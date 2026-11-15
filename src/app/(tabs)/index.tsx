import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardSkeletons, Chip, Empty, Icon, ListingCard, Wordmark, s } from '@/components/ui';
import { findListings } from '@/lib/api';
import { CATEGORIES, LANGUAGES } from '@/lib/constants';
import { useFilters } from '@/lib/location';
import { C, shadow } from '@/lib/theme';
import type { Listing } from '@/lib/types';

const CATS = [{ name: 'All', short: 'All', icon: 'view-grid-outline' }, { name: 'Free', short: 'Free', icon: 'gift-outline' }, ...CATEGORIES];

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
      <View style={[s.header, { paddingBottom: 10 }]}>
        <View style={{ flex: 1 }}><Wordmark size={22} /></View>
        <Pressable onPress={() => router.navigate('/search')} accessibilityLabel="Change location and distance"
          style={[s.chip, { paddingVertical: 7 }]}>
          <Icon name="map-marker" size={16} color={C.accent} />
          <Text style={s.chipText}>{filters.label} · {filters.radius ? `${filters.radius} mi` : 'any distance'}</Text>
          <Icon name="chevron-down" size={16} color={C.muted} />
        </Pressable>
      </View>
      <Pressable onPress={() => router.navigate('/search')} accessibilityRole="search"
        style={[s.input, { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }, shadow(1)]}>
        <Icon name="magnify" size={21} color={C.faint} />
        <Text style={{ color: C.faint, fontSize: 15.5 }}>Search sofas, prams, bikes…</Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingHorizontal: 10, paddingTop: 16, paddingBottom: 4 }}>
        {CATS.map((c) => {
          const on = cat === c.name;
          return (
            <Pressable key={c.name} onPress={() => setFilters({ category: c.name === 'All' ? null : c.name })}
              accessibilityRole="button" accessibilityState={{ selected: on }} style={{ width: 74, alignItems: 'center', gap: 6 }}>
              <View style={{ width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                backgroundColor: on ? C.accent : C.surface, borderWidth: 1, borderColor: on ? C.accent : C.line }}>
                <Icon name={c.icon} size={25} color={on ? C.accentInk : C.accent} />
              </View>
              <Text style={{ fontSize: 11.5, fontWeight: on ? '700' : '600', textAlign: 'center', color: on ? C.ink : C.muted }} numberOfLines={1}>{c.short}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' }}>
        <Icon name="translate" size={18} color={C.muted} />
        <Chip label="Any language" on={!filters.languages.length} onPress={() => setFilters({ languages: [] })} />
        {LANGUAGES.map(([l, c]) => <Chip key={l} label={l} sub={c} on={filters.languages.includes(l)} onPress={() => toggleLang(l)} />)}
      </ScrollView>
      <View style={[s.pad, { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 12, gap: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.h2}>{cat === 'All' ? `Near ${filters.label}` : cat}</Text>
          <Text style={[s.meta, { marginTop: 2 }]} numberOfLines={1}>
            {items ? `${items.length} item${items.length === 1 ? '' : 's'}` : 'Loading'}
            {filters.languages.length ? ` · sellers speak ${filters.languages.join(' or ')}` : ' · all languages'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {items === null && !error ? (
        <>{header}<CardSkeletons width={cardW} /></>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(i) => i.id}
          numColumns={2}
          ListHeaderComponent={header}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 18, paddingBottom: 32 }}
          renderItem={({ item }) => <ListingCard item={item} width={cardW} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          ListEmptyComponent={error ? <Empty icon="wifi-off" title="Something went wrong" text={error} action={{ title: 'Try again', onPress: load }} /> :
            <Empty icon="sofa-outline" title="Nothing here yet" text="Try a bigger distance, another language or another category. Or be the first to sell something here!"
              action={{ title: 'Sell an item', onPress: () => router.navigate('/sell') }} />}
        />
      )}
    </SafeAreaView>
  );
}
