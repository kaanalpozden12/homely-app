import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Chips, Empty, Header, Label, ListingRow, Loading, s } from '@/components/ui';
import { findListings } from '@/lib/api';
import { CATEGORIES, LANGUAGES, RADII } from '@/lib/constants';
import { lookupPostcode } from '@/lib/geo';
import { useFilters } from '@/lib/location';
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
      <ScrollView contentContainerStyle={[s.pad, { paddingBottom: 30 }]} keyboardShouldPersistTaps="handled">
        <TextInput style={s.input} value={q} onChangeText={setQ} placeholder="Sofa, pram, bike, coat…" placeholderTextColor="#98A3A6"
          accessibilityLabel="What are you looking for?" returnKeyType="search" />
        <Label>Your location</Label>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TextInput style={[s.input, { flex: 1 }]} value={pc} onChangeText={setPc} placeholder="Your postcode, e.g. SW3 4RY"
            placeholderTextColor="#98A3A6" autoCapitalize="characters" autoComplete="postal-code" onSubmitEditing={setPostcode} accessibilityLabel="Postcode" />
          <Button title="Set" small onPress={setPostcode} busy={pcBusy} />
        </View>
        {pcError ? <Text style={[s.error, { marginTop: 6 }]}>{pcError}</Text> : null}
        <Label>Distance</Label>
        <Chips wrap>
          {RADII.map((r) => <Chip key={r.label} label={r.label} on={filters.radius === r.value} onPress={() => setFilters({ radius: r.value })} />)}
        </Chips>
        <Text style={[s.hint, { marginTop: 8 }]}>Sellers' exact addresses are never shown. You only see a rounded distance.</Text>
        <Label>Seller speaks</Label>
        <Chips wrap>
          <Chip label="Any language" on={!filters.languages.length} onPress={() => setFilters({ languages: [] })} />
          {LANGUAGES.map(([l, c]) => <Chip key={l} label={l} sub={c} on={filters.languages.includes(l)} onPress={() => toggleLang(l)} />)}
        </Chips>
        <Label>Category</Label>
        <Chips wrap>
          {['All', 'Free', ...CATEGORIES.map((c) => c.name)].map((c) => (
            <Chip key={c} label={c} on={(filters.category ?? 'All') === c} onPress={() => setFilters({ category: c === 'All' ? null : c })} />
          ))}
        </Chips>
        <Label>Sort by</Label>
        <Chips wrap>
          {([['near', 'Nearest'], ['new', 'Newest'], ['cheap', 'Lowest price']] as const).map(([k, n]) => (
            <Chip key={k} label={n} on={filters.sort === k} onPress={() => setFilters({ sort: k })} />
          ))}
        </Chips>
        <Label>{items ? `${items.length} result${items.length === 1 ? '' : 's'}` : 'Results'}</Label>
        {items === null ? <Loading /> : items.length ? items.map((it) => <ListingRow key={it.id} item={it} />) :
          <Empty title="No matches" text="Try a bigger distance, another language or a different word." />}
      </ScrollView>
    </SafeAreaView>
  );
}
