export type Profile = {
  id: string;
  name: string;
  area: string;
  languages: string[];
  id_verified: boolean;
  id_check_requested_at?: string | null;
  created_at: string;
};

export type Contacts = { id: string; phone: string; instagram: string };

/** A row returned by the find_listings database function. */
export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  description: string;
  hygiene: string[];
  area: string;
  photos: string[];
  status: 'active' | 'reserved' | 'sold';
  created_at: string;
  distance_miles: number;
  seller_name: string;
  seller_area: string;
  seller_languages: string[];
  seller_verified: boolean;
};

export type Message = {
  id: number;
  conversation_id: string;
  sender_id: string;
  kind: 'text' | 'contact' | 'system';
  body: string;
  created_at: string;
};

/** A reservation or sale made through the app (the transactions table). */
export type Transaction = {
  id: string;
  listing_id: string | null;
  conversation_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  item_title: string;
  item_price: number;
  commission_pence: number;
  status: 'awaiting_payment' | 'reserved' | 'completed' | 'cancelled' | 'expired';
  cancelled_by: 'buyer' | 'seller' | 'admin' | 'system' | null;
  refund_status: 'none' | 'pending' | 'refunded' | 'failed';
  created_at: string;
  paid_at: string | null;
  reserved_at: string | null;
};
