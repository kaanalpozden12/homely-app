// POST /api/stripe-webhook  (called by Stripe, not by the app)
// Confirms reservations once the card payment succeeds, and releases the item if the payment page expires.
import { admin, handle, json, refund, verifyStripeSignature } from './_shared';

export const POST = handle(async (req) => {
  const payload = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !(await verifyStripeSignature(payload, req.headers.get('stripe-signature'), secret))) {
    return json(400, { error: 'Invalid signature' });
  }
  const event = JSON.parse(payload);
  const session = event.data?.object ?? {};
  const db = admin();

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
