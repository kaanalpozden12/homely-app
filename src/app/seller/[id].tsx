import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReportSheet } from '@/components/report-sheet';
import { Avatar, Chip, Chips, Empty, Header, Icon, Label, ListingCard, Loading, Verified, s } from '@/components/ui';
import { block, findListings } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { langCode } from '@/lib/constants';
import { confirm } from '@/lib/dialog';
import { monthYear } from '@/lib/format';
import { useFilters } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/theme';
import type { Listing, Profile } from '@/lib/types';

export default function Seller() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { filters } = useFilters();
  const me = session!.user.id;
  const [p, setP] = useState<Profile | null | undefined>(undefined);
  const [items, setItems] = useState<Listing[]>([]);
  const [reporting, setReporting] = useState(false);
  const cardW = (Math.min(useWindowDimensions().width, 560) - 44) / 2;

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', id).maybeSingle().then(({ data }) => setP((data as Profile) ?? null));
    findListings({ lat: filters.lat, lng: filters.lng, seller: id, sort: 'new' }).then(setItems).catch(() => {});
  }, [id, filters.lat, filters.lng]);

  if (p === undefined) return <SafeAreaView style={s.screen}><Loading /></SafeAreaView>;
  if (p === null) return <SafeAreaView style={s.screen}><Header back /><Empty title="Not found" text="This account no longer exists." /></SafeAreaView>;

  const doBlock = async () => {
    if (!(await confirm(`Block ${p.name}?`, "You won't see each other's listings and can't message each other.", 'Block', true))) return;
    await block(me, p.id);
    router.replace('/');
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Header back title="Seller" />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ alignItems: 'center', gap: 6, padding: 16 }}>
          <Avatar id={p.id} name={p.name} size={84} />
          <Text style={{ fontSize: 24, fontWeight: '800', color: C.ink, marginTop: 6 }}>{p.name}</Text>
          <Text style={s.meta}>{p.area ? `${p.area} · ` : ''}Joined {monthYear(p.created_at)}</Text>
          <Verified on={p.id_verified} />
        </View>
        <View style={s.pad}>
          <Label>Speaks</Label>
          <Chips wrap>{p.languages.map((l) => <Chip key={l} label={l} sub={langCode(l)} />)}</Chips>
          <Label>Listings</Label>
        </View>
        {items.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 }}>
            {items.map((it) => <ListingCard key={it.id} item={it} width={cardW} />)}
          </View>
        ) : <Empty title="Nothing for sale right now" text="Check back later." />}
        {p.id !== me && (
          <View style={[s.pad, { marginTop: 24, gap: 4 }]}>
            <Pressable onPress={() => setReporting(true)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 10 }}>
              <Icon name="flag-outline" size={18} color={C.muted} /><Text style={s.meta}>Report {p.name}</Text>
            </Pressable>
            <Pressable onPress={doBlock} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 10 }}>
              <Icon name="cancel" size={18} color={C.danger} /><Text style={[s.meta, { color: C.danger }]}>Block {p.name}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <ReportSheet open={reporting} onClose={() => setReporting(false)} userId={p.id} title={`Report ${p.name}`} />
    </SafeAreaView>
  );
}
