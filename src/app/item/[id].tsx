import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReportSheet } from '@/components/report-sheet';
import { Avatar, Button, Empty, Icon, LangTags, Loading, Note, Photo, Verified, s } from '@/components/ui';
import {
  cancelTransaction, completeTransaction, findListings, openConversation, openTransaction, removePhotos, reserve, startCheckout,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { confirm, notify } from '@/lib/dialog';
import { friendly } from '@/lib/errors';
import { ago, distance, price } from '@/lib/format';
import { useFilters } from '@/lib/location';
import { fee, useSettings } from '@/lib/settings';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/theme';
import type { Listing, Transaction } from '@/lib/types';

export default function Item() {
  const { id, paid } = useLocalSearchParams<{ id: string; paid?: string }>();
  const { session } = useAuth();
  const { filters } = useFilters();
  const settings = useSettings();
  const me = session!.user.id;
  const [it, setIt] = useState<Listing | null | undefined>(undefined);
  const [tx, setTx] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [page, setPage] = useState(0);
  const w = Math.min(useWindowDimensions().width, 560);

  const load = useCallback(async () => {
    const [r, t] = await Promise.all([
      findListings({ lat: filters.lat, lng: filters.lng, id, includeSold: true }).catch(() => []),
      openTransaction(id).catch(() => null),
    ]);
    setIt(r[0] ?? null);
    setTx(t);
    return t;
  }, [id, filters.lat, filters.lng]);
  useEffect(() => { load(); }, [load]);

  // Back from card payment: Stripe tells our server a few seconds later, so check again for a short while.
  useEffect(() => {
    if (!paid) return;
    let n = 0;
    const timer = setInterval(async () => {
      const t = await load();
      if (++n >= 10 || !t || t.status !== 'awaiting_payment') clearInterval(timer);
    }, 2000);
    return () => clearInterval(timer);
  }, [paid, load]);

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
    } catch (e) {
      notify('Could not open the chat', friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const run = async (what: string, fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      notify(what, friendly(e));
    } finally {
      setBusy(false);
      load();
    }
  };

  const setStatus = (status: 'active' | 'sold') => run('Could not update the listing', async () => {
    const { error } = await supabase.from('listings').update({ status }).eq('id', it.id);
    if (error) throw error;
  });

  const remove = async () => {
    if (!(await confirm('Delete this listing?', 'This cannot be undone.', 'Delete', true))) return;
    setBusy(true);
    const { error } = await supabase.from('listings').delete().eq('id', it.id);
    setBusy(false);
    if (error) return notify('Could not delete the listing', friendly(error));
    await removePhotos(it.photos).catch(() => {});
    router.canGoBack() ? router.back() : router.replace('/');
  };

  const pay = async (t: Transaction) => {
    const url = await startCheckout(t.id);
    if (Platform.OS === 'web') window.location.assign(url);
    else await Linking.openURL(url);
  };

  const doReserve = async () => {
    const f = settings.commission_pence;
    const ok = await confirm(
      f ? `Reserve for ${fee(f)}?` : 'Reserve this item?',
      (f
        ? `Pay a ${fee(f)} Homely fee by card and the item is held for you. `
        : 'Reserving is free while Homely is new. The item is held for you. ') +
        `You pay ${price(it.price)} to ${it.seller_name} in person when you collect it.` +
        (f ? ' If the seller cancels, the fee is refunded.' : ''),
      f ? 'Continue to payment' : 'Reserve',
    );
    if (!ok) return;
    await run('Could not reserve this item', async () => {
      const t = await reserve(it.id);
      if (t.status === 'awaiting_payment') return pay(t);
      if (t.conversation_id) router.push(`/chat/${t.conversation_id}`);
    });
  };

  const doComplete = async () => {
    if (!tx || !(await confirm('Item collected?', 'Confirm the buyer has collected the item and paid you. It will be marked as sold.', 'Yes, collected'))) return;
    await run('Could not update the reservation', () => completeTransaction(tx.id));
  };

  const doCancel = async () => {
    if (!tx) return;
    const seller = tx.seller_id === me;
    const paidFee = !!tx.paid_at && tx.commission_pence > 0;
    const ok = await confirm(
      'Cancel the reservation?',
      seller
        ? `The item goes back on sale.${paidFee ? " The buyer's Homely fee is refunded." : ''}`
        : `The item goes back on sale for others.${paidFee ? ' The Homely fee is not refunded when the buyer cancels.' : ''}`,
      'Cancel reservation', true,
    );
    if (ok) await run('Could not cancel the reservation', () => cancelTransaction(tx.id));
  };

  const messageBtn = (primary: boolean) => (
    <Button title={primary ? `Message ${it.seller_name}` : 'Message'} icon="chat-outline" kind={primary ? 'primary' : 'ghost'}
      onPress={message} busy={busy} style={primary ? { flex: 1 } : undefined} />
  );

  const actionBar = () => {
    const row = { flexDirection: 'row', gap: 10 } as const;
    if (mine) {
      if (it.status === 'reserved') return (
        <>
          <Status icon="clock-outline" text={tx?.status === 'reserved' ? 'Reserved by a buyer. Mark it as collected once they have picked it up and paid.' : 'Reserved by a buyer.'} />
          {tx?.status === 'reserved' && (
            <View style={row}>
              <Button title="Mark as collected" onPress={doComplete} busy={busy} style={{ flex: 1 }} />
              <Button title="Cancel" kind="ghost" onPress={doCancel} disabled={busy} />
            </View>
          )}
        </>
      );
      return (
        <View style={row}>
          <Button title={it.status === 'sold' ? 'Mark as available' : 'Mark as sold'} kind="ghost" style={{ flex: 1 }} busy={busy}
            onPress={() => setStatus(it.status === 'sold' ? 'active' : 'sold')} />
          <Button title="Delete" kind="danger" onPress={remove} disabled={busy} />
        </View>
      );
    }
    if (tx && tx.buyer_id === me) {
      if (tx.status === 'awaiting_payment') return (
        <>
          <Status icon="credit-card-outline" text={paid ? 'Confirming your payment…' : `Pay the ${fee(tx.commission_pence)} Homely fee to hold this item for you.`} />
          <View style={row}>
            <Button title={`Pay ${fee(tx.commission_pence)}`} onPress={() => run('Could not open card payment', () => pay(tx))} busy={busy} style={{ flex: 1 }} />
            <Button title="Cancel" kind="ghost" onPress={doCancel} disabled={busy} />
          </View>
        </>
      );
      return (
        <>
          <Status icon="check-circle-outline" text={`Reserved for you. Agree a pickup time with ${it.seller_name} and pay ${price(it.price)} in person.`} />
          <View style={row}>
            {messageBtn(true)}
            <Button title="Cancel" kind="ghost" onPress={doCancel} disabled={busy} />
          </View>
        </>
      );
    }
    if (it.status === 'sold') return <Button title="This item has been sold" kind="ghost" disabled />;
    if (it.status === 'reserved') return (
      <>
        <Status icon="clock-outline" text="Reserved by another buyer. You can still message the seller in case it falls through." />
        {messageBtn(true)}
      </>
    );
    return (
      <View style={row}>
        {messageBtn(false)}
        <Button title={settings.commission_pence ? `Reserve · ${fee(settings.commission_pence)}` : 'Reserve'} icon="hand-okay"
          onPress={doReserve} busy={busy} style={{ flex: 1 }} />
      </View>
    );
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
          <Text style={s.meta}>Posted {ago(it.created_at)}{it.status === 'sold' ? ' · Sold' : it.status === 'reserved' ? ' · Reserved' : ''}</Text>
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
      <View style={{ gap: 8, padding: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg }}>
        {actionBar()}
      </View>
      <ReportSheet open={reporting} onClose={() => setReporting(false)} listingId={it.id} userId={it.seller_id} title="Report this listing" />
    </SafeAreaView>
  );
}

const sec = { padding: 16, borderBottomWidth: 1, borderBottomColor: C.line } as const;

const Status = ({ icon, text }: { icon: string; text: string }) => (
  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
    <Icon name={icon} size={18} color={C.accent} />
    <Text style={[s.meta, { flex: 1, color: C.ink }]}>{text}</Text>
  </View>
);

function Back({ bare }: { bare?: boolean }) {
  return (
    <View style={bare ? undefined : { padding: 12 }}>
      <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.iconBtn}>
        <Icon name="chevron-left" size={24} />
      </Pressable>
    </View>
  );
}
