import { supabase } from './supabase';

export type ChatSummary = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_read_at: string;
  seller_read_at: string;
  last_message_at: string;
  listing: { title: string; price: number; photos: string[]; category: string; status: 'active' | 'sold' } | null;
  buyer: { name: string; languages: string[]; id_verified: boolean } | null;
  seller: { name: string; languages: string[]; id_verified: boolean } | null;
};

export const CHAT_SELECT =
  'id, listing_id, buyer_id, seller_id, buyer_read_at, seller_read_at, last_message_at,' +
  ' listing:listings!conversations_listing_id_fkey(title, price, photos, category, status),' +
  ' buyer:profiles!conversations_buyer_id_fkey(name, languages, id_verified),' +
  ' seller:profiles!conversations_seller_id_fkey(name, languages, id_verified)';

export async function loadChats(): Promise<ChatSummary[]> {
  const { data, error } = await supabase.from('conversations').select(CHAT_SELECT).order('last_message_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ChatSummary[];
}

export const other = (c: ChatSummary, me: string) =>
  c.buyer_id === me ? { id: c.seller_id, ...c.seller! } : { id: c.buyer_id, ...c.buyer! };

export const isUnread = (c: ChatSummary, me: string) =>
  c.last_message_at > (c.buyer_id === me ? c.buyer_read_at : c.seller_read_at);
