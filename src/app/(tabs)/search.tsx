import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RadiusMap } from '@/components/radius-map';
import { Button, Chip, Chips, Empty, Field, Header, ListingRow, Loading, Section, s, type IconName } from '@/components/ui';
import { findListings } from '@/lib/api';
import { CATEGORIES, LANGUAGES, RADII } from '@/lib/constants';
import { lookupPostcode } from '@/lib/geo';
import { useFilters } from '@/lib/location';
import { shadow } from '@/lib/theme';
import type { Listing } from '@/lib/types';

export default function Search() {
  const { filters, setFilters } = useFilters();
  const [q, setQ] = useState('');
  const [pc, setPc] = useState(filters.label);
  const [pcError, setPcError] = useState('');
  const [pcBusy, setPcBusy] = useState(false);
  const [items, setItems] = useState<Listing[] | null>(null);

  useEffect(() => setPc(filters.label), [filters.label]);

  useEffect(() => {
    let live = true;
    const t = setTimeout(async () => {
      try {
        const r = await findListings({ ...filters, query: q });
        if (live) setItems(r);
      } catch {
        if (live) setItems([]);
      }
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [filters, q]);

  const setPostcode = async () => {
    setPcBusy(true);
    const place = await lookupPostcode(pc);
    setPcBusy(false);
    if (!place) return setPcError("We couldn't find that postcode. Try the first part, like SW3 or SW11.");
    setPcError('');
    setFilters({ label: place.label, lat: place.lat, lng: place.lng });
  };

  const toggleLang = (l: string) =>
    setFilters({ languages: filters.languages.includes(l) ? filters.languages.filter((x) => x !== l) : [...filters.languages, l] });

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Header title="Search" />
      <ScrollView contentContainerStyle={[s.pad, { paddingBottom: 32 }]} keyboardShouldPersistTaps="handled">
        <Field value={q} onChangeText={setQ} placeholder="Sofa, pram, bike, coat…" icon="magnify"
          accessibilityLabel="What are you looking for?" returnKeyType="search" style={shadow(1)} />
        <Section title="Where" sub="Sellers' exact addresses are never shown, only a rounded distance.">
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Field value={pc} onChangeText={setPc} placeholder="Your postcode, e.g. SW3 4RY" icon="map-marker-outline"
                autoCapitalize="characters" autoComplete="postal-code" onSubmitEditing={setPostcode} accessibilityLabel="Postcode" error={pcError} />
            </View>
            <Button title="Set" onPress={setPostcode} busy={pcBusy} kind="soft" />
          </View>
          <RadiusMap lat={filters.lat} lng={filters.lng} radius={filters.radius} onChange={(radius) => setFilters({ radius })} />
          <Chips wrap>
            {RADII.map((r) => <Chip key={r.label} label={r.value ? `Within ${r.label}` : 'Any distance'} on={filters.radius === r.value} onPress={() => setFilters({ radius: r.value })} />)}
          </Chips>
        </Section>
        <Section title="Seller speaks" sub="Pick one or more. You'll see items from people who speak them.">
          <Chips wrap>
            <Chip label="Any language" on={!filters.languages.length} onPress={() => setFilters({ languages: [] })} />
            {LANGUAGES.map(([l, c]) => <Chip key={l} label={l} sub={c} on={filters.languages.includes(l)} onPress={() => toggleLang(l)} />)}
          </Chips>
        </Section>
        <Section title="Category">
          <Chips wrap>
            {[{ name: 'All', icon: 'view-grid-outline' }, { name: 'Free', icon: 'gift-outline' }, ...CATEGORIES].map((c) => (
              <Chip key={c.name} label={c.name} icon={c.icon as IconName} on={(filters.category ?? 'All') === c.name}
                onPress={() => setFilters({ category: c.name === 'All' ? null : c.name })} />
            ))}
          </Chips>
        </Section>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 8, gap: 8 }}>
          <Text style={s.h2}>{items ? `${items.length} result${items.length === 1 ? '' : 's'}` : 'Results'}</Text>
          <Chips>
            {([['near', 'Nearest'], ['new', 'Newest'], ['cheap', 'Cheapest']] as const).map(([k, n]) => (
              <Chip key={k} label={n} on={filters.sort === k} onPress={() => setFilters({ sort: k })} />
            ))}
          </Chips>
        </View>
        {items === null ? <Loading /> : items.length ? (
          <View style={[s.box, { paddingVertical: 2 }]}>
            {items.map((it, i) => <ListingRow key={it.id} item={it} last={i === items.length - 1} />)}
          </View>
        ) : <Empty title="No matches" text="Try a bigger distance, another language or a different word." />}
      </ScrollView>
    </SafeAreaView>
  );
}
