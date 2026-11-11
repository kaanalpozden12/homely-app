import { useEffect, useState } from 'react';

import { supabase } from './supabase';

/** Settings the admin can change in Supabase (Table Editor > app_settings) without a new release. */
export type AppSettings = { commission_pence: number; require_id_to_sell: boolean };

const DEFAULTS: AppSettings = { commission_pence: 0, require_id_to_sell: true };
let cache: AppSettings | null = null;

export async function loadSettings(): Promise<AppSettings> {
  const { data } = await supabase.from('app_settings').select('commission_pence, require_id_to_sell').eq('id', 1).maybeSingle();
  cache = { ...DEFAULTS, ...(data ?? {}) };
  return cache;
}

export function useSettings(): AppSettings {
  const [s, set] = useState<AppSettings>(cache ?? DEFAULTS);
  useEffect(() => {
    loadSettings().then(set).catch(() => {});
  }, []);
  return s;
}

export const fee = (pence: number) => `£${(pence / 100).toFixed(2)}`;
