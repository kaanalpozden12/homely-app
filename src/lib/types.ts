export type Profile = {
  id: string;
  name: string;
  area: string;
  languages: string[];
  id_verified: boolean;
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
  status: 'active' | 'sold';
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
  kind: 'text' | 'contact';
  body: string;
  created_at: string;
};
