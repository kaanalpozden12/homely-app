// Shared code for the payment server (Vercel Functions). Files starting with "_" are not deployed as endpoints.
// Needs these Environment Variables in Vercel (Project > Settings > Environment Variables):
//   STRIPE_SECRET_KEY       sk_live_... (or sk_test_... while testing)
//   STRIPE_WEBHOOK_SECRET   whsec_...   (from the Stripe webhook you create, see README)
//   SUPABASE_SECRET_KEY     the secret / service_role key from Supabase > Project Settings > API keys
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://onukvcqeocqfvyojodzy.supabase.co';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Wraps a handler so errors become a JSON message the app can show. */
export const handle = (fn: (req: Request) => Promise<Response>) => async (req: Request) => {
  try {
    return await fn(req);
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.message });
    console.error(e);
    return json(500, { error: 'Something went wrong with the payment. Please try again.' });
  }
};

export function admin(): SupabaseClient {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new HttpError(503, 'Card payments are not set up yet.');
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** The signed-in person making the request (from the app's sign-in token). */
export async function currentUser(req: Request, db: SupabaseClient) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Please sign in again.');
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Please sign in again.');
  return data.user;
}

/** Calls the Stripe API directly (no extra library needed). */
export async function stripe<T = Record<string, any>>(
  method: 'GET' | 'POST', path: string, params?: Record<string, string>, idempotencyKey?: string,
): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(503, 'Card payments are not set up yet.');
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers,
    body: method === 'POST' && params ? new URLSearchParams(params).toString() : undefined,
  });
  const j = await r.json();
  if (!r.ok) {
    console.error('Stripe error', j?.error);
    throw new HttpError(502, 'The card payment service is not responding. Please try again.');
  }
  return j as T;
}

type Tx = { id: string; stripe_payment_intent: string | null; refund_status: string; commission_pence: number };

/** Sends the Homely fee back to the buyer's card and records the result. Safe to call twice. */
export async function refund(db: SupabaseClient, t: Tx) {
  if (t.refund_status !== 'pending' || !t.stripe_payment_intent) return;
  try {
    await stripe('POST', 'refunds', { payment_intent: t.stripe_payment_intent, 'metadata[transaction_id]': t.id }, `refund-${t.id}`);
    await db.rpc('set_refund_status', { p_tx: t.id, p_status: 'refunded' });
  } catch (e) {
    console.error('Refund failed', t.id, e);
    await db.rpc('set_refund_status', { p_tx: t.id, p_status: 'failed' });
  }
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Checks that a webhook really came from Stripe (the Stripe-Signature header). */
export async function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false;
  const parts = header.split(',').map((p) => p.split('=') as [string, string]);
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`)));
  return sigs.some((s) => s.length === expected.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ expected.charCodeAt(i)), 0) === 0);
}
