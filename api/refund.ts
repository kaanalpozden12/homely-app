// POST /api/refund { transaction_id }
// Called by the app right after a seller cancels a paid reservation, to send the Loftrobin fee back.
import { admin, currentUser, handle, HttpError, json, refund } from './_shared';

export const POST = handle(async (req) => {
  const db = admin();
  const user = await currentUser(req, db);
  const { transaction_id } = (await req.json().catch(() => ({}))) as { transaction_id?: string };
  const { data: t } = await db.from('transactions').select('*').eq('id', transaction_id ?? '').maybeSingle();
  if (!t || (t.buyer_id !== user.id && t.seller_id !== user.id)) throw new HttpError(404, 'Reservation not found.');
  await refund(db, t);
  return json(200, { ok: true });
});
