import { Platform } from 'react-native';

import { readPhoto } from './image';
import type { Filters } from './location';
import { PHOTO_BUCKET, supabase } from './supabase';
import type { Boost, Listing, Transaction } from './types';

export async function findListings(
  f: Pick<Filters, 'lat' | 'lng'> & Partial<Filters> & { query?: string; seller?: string; id?: string; includeSold?: boolean },
): Promise<Listing[]> {
  const { data, error } = await supabase.rpc('find_listings', {
    p_lat: f.lat,
    p_lng: f.lng,
    p_radius: f.radius ?? null,
    p_languages: f.languages?.length ? f.languages : null,
    p_category: f.category ?? null,
    p_query: f.query?.trim() || null,
    p_sort: f.sort ?? 'near',
    p_seller: f.seller ?? null,
    p_id: f.id ?? null,
    p_include_sold: f.includeSold ?? false,
  });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

/** Returns the existing chat for this item, or starts a new one. */
export async function openConversation(listing: Listing, me: string): Promise<string> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listing.id)
    .eq('buyer_id', me)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listing.id, buyer_id: me, seller_id: listing.seller_id })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/** Uploads a picked photo and returns its public URL. */
export async function uploadPhoto(uri: string, userId: string, picked = 'image/jpeg'): Promise<string> {
  const { body, mime } = await readPhoto(uri, picked);
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, body, { contentType: mime, cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Path inside the bucket, taken from a public URL. */
export const photoPath = (url: string) => url.split(`/${PHOTO_BUCKET}/`)[1] ?? '';

export async function report(me: string, reason: string, target: { listingId?: string; userId?: string }) {
  const { error } = await supabase
    .from('reports')
    .insert({ reporter_id: me, reason, listing_id: target.listingId ?? null, reported_user_id: target.userId ?? null });
  if (error) throw error;
}

export async function block(me: string, other: string) {
  const { error } = await supabase.from('blocks').upsert({ blocker_id: me, blocked_id: other });
  if (error) throw error;
}

export async function removePhotos(urls: string[]) {
  const paths = urls.map(photoPath).filter(Boolean);
  if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
}

export async function deleteMyAccount(me: string) {
  const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(me, { limit: 1000 });
  if (files?.length) await supabase.storage.from(PHOTO_BUCKET).remove(files.map((f) => `${me}/${f.name}`));
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut();
}

// ---------- Reservations ----------

/** The open reservation (or card payment in progress) for an item, if the signed-in user is the buyer or seller. */
export async function openTransaction(listingId: string): Promise<Transaction | null> {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('listing_id', listingId)
    .in('status', ['awaiting_payment', 'reserved'])
    .maybeSingle();
  return (data as Transaction) ?? null;
}

export async function reserve(listingId: string): Promise<Transaction> {
  const { data, error } = await supabase.rpc('reserve_listing', { p_listing: listingId });
  if (error) throw error;
  return data as Transaction;
}

export async function completeTransaction(id: string): Promise<Transaction> {
  const { data, error } = await supabase.rpc('complete_transaction', { p_tx: id });
  if (error) throw error;
  return data as Transaction;
}

export async function cancelTransaction(id: string): Promise<Transaction> {
  const { data, error } = await supabase.rpc('cancel_transaction', { p_tx: id });
  if (error) throw error;
  const t = data as Transaction;
  // Ask the payment server to send the fee back now; if that fails it is retried from the admin side.
  if (t.refund_status === 'pending') await callPaymentServer('refund', { transaction_id: t.id }).catch(() => {});
  return t;
}

/** Starts card payment of the Loftrobin fee and returns the Stripe page to open. */
export async function startCheckout(transactionId: string): Promise<string> {
  const { url } = await callPaymentServer('checkout', { transaction_id: transactionId });
  return url as string;
}

// ---------- Boosts and Loftrobin credit ----------

/** Boosts the item: paid from Loftrobin credit straight away if there is enough, otherwise status 'awaiting_payment'. */
export async function startBoost(listingId: string): Promise<Boost> {
  const { data, error } = await supabase.rpc('start_boost', { p_listing: listingId });
  if (error) throw error;
  return data as Boost;
}

/** Starts card payment of a Boost and returns the Stripe page to open. */
export async function startBoostCheckout(boostId: string): Promise<string> {
  const { url } = await callPaymentServer('boost-checkout', { boost_id: boostId });
  return url as string;
}

/** The signed-in person's Loftrobin credit, in pence. */
export async function myCredit(): Promise<number> {
  const { data, error } = await supabase.rpc('my_credit_pence');
  if (error) throw error;
  return (data as number) ?? 0;
}

/** Where the web app is served from. The phone apps talk to the same server. */
const SITE = process.env.EXPO_PUBLIC_SITE_URL || 'https://www.loftrobin.com';

async function callPaymentServer(path: string, body: object): Promise<Record<string, unknown>> {
  const { data } = await supabase.auth.getSession();
  const base = Platform.OS === 'web' ? window.location.origin : SITE;
  const r = await fetch(`${base}/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Card payments are not available right now. Please try again later.');
  return j;
}
