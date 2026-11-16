// POST /api/stripe-webhook  (called by Stripe, not by the app)
// Confirms reservations and Boosts once the card payment succeeds, and releases them if the payment page expires.
import { admin, handle, json, refund, stripe, verifyStripeSignature } from './_shared';

export const POST = handle(async (req) => {
  const payload = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !(await verifyStripeSignature(payload, req.headers.get('stripe-signature'), secret))) {
    return json(400, { error: 'Invalid signature' });
  }
  const event = JSON.parse(payload);
  const session = event.data?.object ?? {};
  const db = admin();

  // Boost payments carry metadata[boost_id]; Reserve fee payments carry metadata[transaction_id].
  const boostId: string | undefined = session.metadata?.boost_id;
  if (boostId) {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      if (session.payment_status !== 'paid') return json(200, { received: true });
      const { data: b, error } = await db.rpc('confirm_boost_payment', { p_session: session.id, p_payment_intent: session.payment_intent });
      if (error) throw error; // Stripe will try again later
      if (b?.status === 'refunded') {
        // The item was sold or removed before the payment went through: give the money back.
        try {
          await stripe('POST', 'refunds', { payment_intent: session.payment_intent, 'metadata[boost_id]': boostId }, `boost-refund-${boostId}`);
        } catch (e) {
          console.error('Boost refund failed', boostId, e);
          await db.rpc('set_boost_status', { p_boost: boostId, p_status: 'refund_failed' });
        }
      }
    } else if (event.type === 'checkout.session.expired') {
      await db.rpc('expire_boost_checkout', { p_session: session.id });
    }
    return json(200, { received: true });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    if (session.payment_status !== 'paid') return json(200, { received: true });
    const { data: t, error } = await db.rpc('confirm_payment', { p_session: session.id, p_payment_intent: session.payment_intent });
    if (error) throw error; // Stripe will try again later
    if (t?.refund_status === 'pending') await refund(db, t); // the item was taken meanwhile
  } else if (event.type === 'checkout.session.expired') {
    await db.rpc('expire_checkout', { p_session: session.id });
  }
  return json(200, { received: true });
});
