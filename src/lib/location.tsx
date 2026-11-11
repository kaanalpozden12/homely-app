import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
import { DEFAULT_LOCATION } from './constants';

export type Filters = {
  label: string; // postcode shown to the buyer, e.g. "SW3"
  lat: number;
  lng: number;
  radius: number | null; // miles, null = any distance
  languages: string[];
  category: string | null; // null = all, "Free" = price 0
  sort: 'near' | 'new' | 'cheap';
  /** True once the person picks languages on the feed themselves; until then the feed follows their profile languages. */
  languagesChosen?: boolean;
};

const DEFAULTS: Filters = { ...DEFAULT_LOCATION, radius: 3, languages: [], category: null, sort: 'near' };
const KEY = 'homely.filters.v1';

const Ctx = createContext<{ filters: Filters; setFilters: (f: Partial<Filters>) => void }>({
  filters: DEFAULTS,
  setFilters: () => {},
});

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, set] = useState<Filters>(DEFAULTS);
  const [restored, setRestored] = useState(false);
  const { profile } = useAuth();
  const profileLangs = profile?.languages.join('|');
  const lastProfileLangs = useRef<string | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v && set({ ...DEFAULTS, ...JSON.parse(v), category: null }))
      .catch(() => {})
      .finally(() => setRestored(true));
  }, []);

  const save = (next: Filters) => {
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    return next;
  };

  const setFilters = (f: Partial<Filters>) =>
    set((prev) => save({ ...prev, ...f, ...('languages' in f ? { languagesChosen: true } : {}) }));

  // The feed shows sellers who speak the person's own languages, unless they chose others on the feed.
  // Editing the languages in the profile resets the feed to them.
  useEffect(() => {
    if (!restored || profileLangs === undefined) return;
    const changed = lastProfileLangs.current !== undefined && lastProfileLangs.current !== profileLangs;
    lastProfileLangs.current = profileLangs;
    set((prev) => (prev.languagesChosen && !changed
      ? prev
      : save({ ...prev, languages: profileLangs ? profileLangs.split('|') : [], languagesChosen: false })));
  }, [restored, profileLangs]);

  return <Ctx.Provider value={{ filters, setFilters }}>{children}</Ctx.Provider>;
}

export const useFilters = () => useContext(Ctx);
