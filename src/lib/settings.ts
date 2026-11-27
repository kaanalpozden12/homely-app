import { useEffect, useState } from 'react';

import { supabase } from './supabase';

/** Settings the admin can change in Supabase (Table Editor > app_settings) without a new release. */
export type AppSettings = {
  commission_pence: number; // the Reserve fee the buyer pays
  reserve_seller_percent: number; // the seller's share of it, as Loftrobin credit
  require_id_to_sell: boolean;
  boosts_enabled: boolean;
  boost_price_pence: number;
  boost_days: number;
};

const DEFAULTS: AppSettings = {
  commission_pence: 0, reserve_seller_percent: 50, require_id_to_sell: false, boosts_enabled: false, boost_price_pence: 150, boost_days: 3,
};
const COLUMNS = Object.keys(DEFAULTS).join(', ');
let cache: AppSettings | null = null;

export async function loadSettings(): Promise<AppSettings> {
  const { data } = await supabase.from('app_settings').select(COLUMNS).eq('id', 1).maybeSingle();
  cache = { ...DEFAULTS, ...((data as Partial<AppSettings> | null) ?? {}) };
  return cache;
}

export function useSettings(): AppSettings {
  const [s, set] = useState<AppSettings>(cache ?? DEFAULTS);
  useEffect(() => {
    loadSettings().then(set).catch(() => {});
  }, []);
  return s;
}

export const fee = (pence: number) => (pence > 0 && pence < 100 ? `${pence}p` : `£${(pence / 100).toFixed(2)}`);

/** The seller's part of a Reserve fee, rounded the same way as the database. */
export const sellerShare = (s: AppSettings) => Math.round((s.commission_pence * s.reserve_seller_percent) / 100);
