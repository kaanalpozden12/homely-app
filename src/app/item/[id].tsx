import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReportSheet } from '@/components/report-sheet';
import { Avatar, Button, Empty, Icon, LangTags, Loading, Note, Photo, Verified, s } from '@/components/ui';
import { findListings, openConversation, photoPath } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { confirm, notify } from '@/lib/dialog';
import { ago, distance, price } from '@/lib/format';
import { useFilters } from '@/lib/location';
import { PHOTO_BUCKET, supabase } from '@/lib/supabase';
import { C } from '@/lib/theme';
import type { Listing } from '@/lib/types';

export default function Item() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { filters } = useFilters();
  const me = session!.user.id;
  const [it, setIt] = useState<Listing | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [page, setPage] = useState(0);
  const w = Math.min(useWindowDimensions().width, 560);

  const load = useCallback(async () => {
    const r = await findListings({ lat: filters.lat, lng: filters.lng, id, includeSold: true }).catch(() => []);
    setIt(r[0] ?? null);
  }, [id, filters.lat, filters.lng]);
  useEffect(() => { load(); }, [load]);

  if (it === undefined) return <SafeAreaView style={s.screen}><Loading /></SafeAreaView>;
  if (it === null) return (
    <SafeAreaView style={s.screen}>
      <Back />
      <Empty title="Listing not found" text="It may have been removed by the seller." />
    </SafeAreaView>
  );

  const mine = it.seller_id === me;

  const message = async () => {
    setBusy(true);
    try {
      const cid = await openConversation(it, me);
      router.push(`/chat/${cid}`);
    } catch (e: any) {
      notify('Could not open the chat', e.message);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: 'active' | 'sold') => {
    await supabase.from('listings').update({ status }).eq('id', it.id);
    load();
  };

  const remove = async () => {
    if (!(await confirm('Delete this listing?', 'This cannot be undone.', 'Delete', true))) return;
    await supabase.storage.from(PHOTO_BUCKET).remove(it.photos.map(photoPath).filter(Boolean));
    await supabase.from('listings').delete().eq('id', it.id);
    router.back();
  };

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <ScrollView>
        <View>
          {it.photos.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / w))}
              onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / w))} scrollEventThrottle={64}>
              {it.photos.map((u) => <Image key={u} source={{ uri: u }} style={{ width: w, height: w * 0.8 }} contentFit="cover" />)}
            </ScrollView>
          ) : <Photo listing={it} style={{ width: w, height: w * 0.75 }} rounded={0} />}
          {it.photos.length > 1 && (
            <View style={{ position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
              {it.photos.map((u, i) => <View key={u} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i === page ? '#fff' : '#fff8' }} />)}
            </View>
          )}
          <View style={{ position: 'absolute', left: 12, top: 12 }}><Back bare /></View>
        </View>

        <View style={sec}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: C.ink }}>{price(it.price)}</Text>
          <Text style={{ fontSize: 19, fontWeight: '600', color: C.ink, marginTop: 2, marginBottom: 6 }}>{it.title}</Text>
          <Text style={s.meta}>Posted {ago(it.created_at)}{it.status === 'sold' ? ' · Sold' : ''}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {[it.condition, it.category, 'Pickup only'].map((p) => (
              <Text key={p} style={{ fontSize: 12.5, fontWeight: '600', backgroundColor: C.accentSoft, color: C.ink, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, overflow: 'hidden' }}>{p}</Text>
            ))}
          </View>
        </View>
        {it.description ? <View style={sec}><Text style={s.p}>{it.description}</Text></View> : null}
        <View style={sec}>
          <Text style={[s.label, { marginTop: 0 }]}>Hygiene checklist</Text>
          {it.hygiene.length ? it.hygiene.map((h) => (
            <View key={h} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 7 }}>
              <Icon name="check" size={18} color={C.accent} /><Text style={s.p}>{h}</Text>
            </View>
          )) : <Text style={s.meta}>The seller did not fill in the checklist.</Text>}
        </View>
        <View style={[sec, { gap: 10 }]}>
          <Note icon="map-marker-outline">
            <Text style={{ fontWeight: '700', color: C.ink }}>{distance(it.distance_miles)} from {filters.label}</Text> · {it.area}{'\n'}
            The exact address is shared in chat once you agree a pickup.
          </Note>
          <Note icon="hand-coin-outline">
            <Text style={{ fontWeight: '700', color: C.ink }}>Collect and pay in person.</Text> Check the item before you pay. Never send money in advance.
          </Note>
        </View>
        <Pressable style={[sec, { flexDirection: 'row', gap: 12, alignItems: 'center' }]} onPress={() => router.push(`/seller/${it.seller_id}`)}>
          <Avatar id={it.seller_id} name={it.seller_name} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontWeight: '700', color: C.ink }}>{it.seller_name}</Text>
            <LangTags langs={it.seller_languages} />
          </View>
          <Verified on={it.seller_verified} />
        </Pressable>
        {!mine && (
          <Pressable onPress={() => setReporting(true)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', padding: 16 }}>
            <Icon name="flag-outline" size={18} color={C.muted} /><Text style={s.meta}>Report this listing</Text>
          </Pressable>
        )}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, padding: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg }}>
        {mine ? (
          <>
            <Button title={it.status === 'sold' ? 'Mark as available' : 'Mark as sold'} kind="ghost" style={{ flex: 1 }}
              onPress={() => setStatus(it.status === 'sold' ? 'active' : 'sold')} />
            <Button title="Delete" kind="danger" onPress={remove} />
          </>
        ) : it.status === 'sold' ? (
          <Button title="This item has been sold" kind="ghost" disabled style={{ flex: 1 }} />
        ) : (
          <Button title={`Message ${it.seller_name}`} icon="chat-outline" onPress={message} busy={busy} style={{ flex: 1 }} />
        )}
      </View>
      <ReportSheet open={reporting} onClose={() => setReporting(false)} listingId={it.id} userId={it.seller_id} title="Report this listing" />
    </SafeAreaView>
  );
}

const sec = { padding: 16, borderBottomWidth: 1, borderBottomColor: C.line } as const;

function Back({ bare }: { bare?: boolean }) {
  return (
    <View style={bare ? undefined : { padding: 12 }}>
      <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.iconBtn}>
        <Icon name="chevron-left" size={24} />
      </Pressable>
    </View>
  );
}
