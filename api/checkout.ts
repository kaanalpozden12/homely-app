// POST /api/checkout { transaction_id } -> { url }
// Opens a Stripe card payment page for the Loftrobin fee of a reservation the buyer just made.
import { admin, currentUser, handle, HttpError, json, stripe } from './_shared';

export const POST = handle(async (req) => {
  const db = admin();
  const user = await currentUser(req, db);
  const { transaction_id } = (await req.json().catch(() => ({}))) as { transaction_id?: string };
  const { data: t } = await db.from('transactions').select('*').eq('id', transaction_id ?? '').maybeSingle();
  if (!t || t.buyer_id !== user.id) throw new HttpError(404, 'Reservation not found.');
  if (t.status !== 'awaiting_payment') throw new HttpError(409, 'This reservation is no longer waiting for payment.');
  if (Date.now() - new Date(t.created_at).getTime() > 25 * 60 * 1000) {
    throw new HttpError(409, 'This payment has timed out. Cancel it and tap Reserve again.');
  }

  // Reuse the payment page if the buyer already opened one.
  if (t.stripe_session_id) {
    const old = await stripe('GET', `checkout/sessions/${t.stripe_session_id}`);
    if (old.status === 'open' && old.url) return json(200, { url: old.url });
  }

  const site = process.env.SITE_URL || new URL(req.url).origin;
  const session = await stripe('POST', 'checkout/sessions', {
    mode: 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'gbp',
    'line_items[0][price_data][unit_amount]': String(t.commission_pence),
    'line_items[0][price_data][product_data][name]': 'Loftrobin reservation fee',
    'line_items[0][price_data][product_data][description]':
      `Holds "${t.item_title}" for you. You pay the £${t.item_price} item price to the seller in person.`.slice(0, 500),
    client_reference_id: t.id,
    'metadata[transaction_id]': t.id,
    'payment_intent_data[metadata][transaction_id]': t.id,
    ...(user.email ? { customer_email: user.email } : {}),
    success_url: `${site}/item/${t.listing_id}?paid=1`,
    cancel_url: `${site}/item/${t.listing_id}`,
    expires_at: String(Math.floor(Date.now() / 1000) + 31 * 60), // Stripe's minimum is 30 minutes
  });
  const { error } = await db.rpc('attach_checkout', { p_tx: t.id, p_session: session.id });
  if (error) throw error;
  return json(200, { url: session.url });
});
