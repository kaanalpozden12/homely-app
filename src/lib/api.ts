import { PHOTO_BUCKET, supabase } from './supabase';
import type { Filters } from './location';
import type { Listing } from './types';

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
export async function uploadPhoto(uri: string, userId: string, mime = 'image/jpeg'): Promise<string> {
  const body = await (await fetch(uri)).arrayBuffer();
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, body, { contentType: mime });
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

export async function deleteMyAccount(me: string) {
  const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(me, { limit: 1000 });
  if (files?.length) await supabase.storage.from(PHOTO_BUCKET).remove(files.map((f) => `${me}/${f.name}`));
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
