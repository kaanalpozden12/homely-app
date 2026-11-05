import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_LOCATION } from './constants';

export type Filters = {
  label: string; // postcode shown to the buyer, e.g. "SW3"
  lat: number;
  lng: number;
  radius: number | null; // miles, null = any distance
  languages: string[];
  category: string | null; // null = all, "Free" = price 0
  sort: 'near' | 'new' | 'cheap';
};

const DEFAULTS: Filters = { ...DEFAULT_LOCATION, radius: 3, languages: [], category: null, sort: 'near' };
const KEY = 'homely.filters.v1';

const Ctx = createContext<{ filters: Filters; setFilters: (f: Partial<Filters>) => void }>({
  filters: DEFAULTS,
  setFilters: () => {},
});

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, set] = useState<Filters>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v && set({ ...DEFAULTS, ...JSON.parse(v), category: null }))
      .catch(() => {});
  }, []);

  const setFilters = (f: Partial<Filters>) =>
    set((prev) => {
      const next = { ...prev, ...f };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

  return <Ctx.Provider value={{ filters, setFilters }}>{children}</Ctx.Provider>;
}

export const useFilters = () => useContext(Ctx);
