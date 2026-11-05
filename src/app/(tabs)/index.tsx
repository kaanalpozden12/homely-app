import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, Empty, Icon, ListingCard, Loading, s } from '@/components/ui';
import { findListings } from '@/lib/api';
import { CATEGORIES, LANGUAGES } from '@/lib/constants';
import { useFilters } from '@/lib/location';
import { C } from '@/lib/theme';
import type { Listing } from '@/lib/types';

const CATS = [{ name: 'All', short: 'All', icon: 'home-outline' }, { name: 'Free', short: 'Free', icon: 'gift-outline' }, ...CATEGORIES];

export default function Feed() {
  const { filters, setFilters } = useFilters();
  const [items, setItems] = useState<Listing[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const w = Math.min(useWindowDimensions().width, 560);
  const cardW = (w - 16 * 2 - 12) / 2;

  const load = useCallback(async () => {
    try {
      setItems(await findListings({ ...filters, sort: 'near' }));
      setError('');
    } catch (e: any) {
      setError(e.message ?? 'Could not load listings.');
    }
  }, [filters]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleLang = (l: string) =>
    setFilters({ languages: filters.languages.includes(l) ? filters.languages.filter((x) => x !== l) : [...filters.languages, l] });
  const cat = filters.category ?? 'All';

  const header = (
    <View>
      <View style={[s.header, { paddingBottom: 6 }]}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.5, flex: 1 }}>
          home<Text style={{ color: C.accent }}>ly</Text>
        </Text>
        <Pressable onPress={() => router.navigate('/search')} style={[s.chip, { flexDirection: 'row', gap: 4, alignItems: 'center' }]}>
          <Icon name="map-marker-outline" size={15} color={C.accent} />
          <Text style={s.chipText}>{filters.label} · {filters.radius ? `${filters.radius} mi` : 'any'}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 6 }}>
        <Chip label="Any language" on={!filters.languages.length} onPress={() => setFilters({ languages: [] })} />
        {LANGUAGES.map(([l, c]) => <Chip key={l} label={l} sub={c} on={filters.languages.includes(l)} onPress={() => toggleLang(l)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
        {CATS.map((c) => {
          const on = cat === c.name;
          return (
            <Pressable key={c.name} onPress={() => setFilters({ category: c.name === 'All' ? null : c.name })}
              accessibilityRole="button" accessibilityState={{ selected: on }} style={{ width: 76, alignItems: 'center', gap: 5 }}>
              <View style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                backgroundColor: on ? C.accent : C.surface, borderWidth: 1, borderColor: on ? C.accent : C.line }}>
                <Icon name={c.icon} size={26} color={on ? C.accentInk : C.accent} />
              </View>
              <Text style={{ fontSize: 11.5, fontWeight: '600', textAlign: 'center', color: on ? C.ink : C.muted }} numberOfLines={2}>{c.short}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[s.meta, s.pad, { paddingBottom: 10 }]}>
        {items ? `${items.length} item${items.length === 1 ? '' : 's'} near ${filters.label}` : ' '}
        {filters.languages.length ? ` from sellers who speak ${filters.languages.join(' or ')}` : ''}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {items === null && !error ? (
        <>{header}<Loading /></>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(i) => i.id}
          numColumns={2}
          ListHeaderComponent={header}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
          renderItem={({ item }) => <ListingCard item={item} width={cardW} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          ListEmptyComponent={error ? <Empty title="Something went wrong" text={error} /> :
            <Empty title="Nothing here yet" text="Try a bigger distance, another language or another category. Or be the first to sell something!" />}
        />
      )}
    </SafeAreaView>
  );
}
