// POST /api/boost-checkout { boost_id } -> { url }
// Opens a Stripe card payment page for a Boost the seller just started (see start_boost in supabase/schema.sql).
import { admin, currentUser, handle, HttpError, json, stripe } from './_shared';

export const POST = handle(async (req) => {
  const db = admin();
  const user = await currentUser(req, db);
  const { boost_id } = (await req.json().catch(() => ({}))) as { boost_id?: string };
  const { data: b } = await db.from('boosts').select('*').eq('id', boost_id ?? '').maybeSingle();
  if (!b || b.seller_id !== user.id) throw new HttpError(404, 'Boost not found.');
  if (b.status !== 'awaiting_payment') throw new HttpError(409, 'This boost is no longer waiting for payment.');
  if (Date.now() - new Date(b.created_at).getTime() > 25 * 60 * 1000) {
    throw new HttpError(409, 'This payment has timed out. Tap Boost again.');
  }

  // Reuse the payment page if the seller already opened one.
  if (b.stripe_session_id) {
    const old = await stripe('GET', `checkout/sessions/${b.stripe_session_id}`);
    if (old.status === 'open' && old.url) return json(200, { url: old.url });
  }

  const site = process.env.SITE_URL || new URL(req.url).origin;
  const session = await stripe('POST', 'checkout/sessions', {
    mode: 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'gbp',
    'line_items[0][price_data][unit_amount]': String(b.price_pence),
    'line_items[0][price_data][product_data][name]': `Loftrobin Boost (${b.days} ${b.days === 1 ? 'day' : 'days'})`,
    'line_items[0][price_data][product_data][description]':
      `Shows "${b.item_title}" at the top of the feed and search.`.slice(0, 500),
    client_reference_id: b.id,
    'metadata[boost_id]': b.id,
    'payment_intent_data[metadata][boost_id]': b.id,
    ...(user.email ? { customer_email: user.email } : {}),
    success_url: `${site}/item/${b.listing_id}?boosted=1`,
    cancel_url: `${site}/item/${b.listing_id}`,
    expires_at: String(Math.floor(Date.now() / 1000) + 31 * 60), // Stripe's minimum is 30 minutes
  });
  const { error } = await db.rpc('attach_boost_checkout', { p_boost: b.id, p_session: session.id });
  if (error) throw error;
  return json(200, { url: session.url });
});
