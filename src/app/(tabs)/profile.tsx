import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Chip, Chips, Empty, Header, Icon, Label, ListingCard, Verified, s } from '@/components/ui';
import { deleteMyAccount, findListings } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { langCode } from '@/lib/constants';
import { confirm, notify } from '@/lib/dialog';
import { monthYear } from '@/lib/format';
import { useFilters } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/theme';
import type { Contacts, Listing } from '@/lib/types';

export default function Profile() {
  const { session, profile } = useAuth();
  const { filters } = useFilters();
  const me = session!.user.id;
  const [items, setItems] = useState<Listing[]>([]);
  const [contacts, setContacts] = useState<Contacts | null>(null);
  const cardW = (Math.min(useWindowDimensions().width, 560) - 44) / 2;

  useFocusEffect(useCallback(() => {
    findListings({ lat: filters.lat, lng: filters.lng, seller: me, sort: 'new', includeSold: true }).then(setItems).catch(() => {});
    supabase.from('profile_contacts').select('*').eq('id', me).maybeSingle().then(({ data }) => setContacts(data as Contacts | null));
  }, [me, filters.lat, filters.lng]));

  if (!profile) return null;

  const del = async () => {
    if (!(await confirm('Delete your account?', 'Your profile, listings, photos and chats will be permanently deleted. This cannot be undone.', 'Delete account', true))) return;
    try {
      await deleteMyAccount(me);
    } catch (e: any) {
      notify('Could not delete your account', e.message);
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Header title="Profile" right={<Button title="Edit" kind="ghost" small icon="pencil-outline" onPress={() => router.push('/edit-profile')} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', gap: 6, padding: 16, paddingTop: 4 }}>
          <Avatar id={me} name={profile.name} size={84} />
          <Text style={{ fontSize: 24, fontWeight: '800', color: C.ink, marginTop: 6 }}>{profile.name}</Text>
          <Text style={s.meta}>{profile.area ? `${profile.area} · ` : ''}Joined {monthYear(profile.created_at)}</Text>
          <Verified on={profile.id_verified} />
          {!profile.id_verified && <Text style={[s.hint, { textAlign: 'center', maxWidth: 300 }]}>We check every seller's ID once, on a short video call, before they can post.</Text>}
        </View>
        <View style={s.pad}>
          <Label>Languages I speak</Label>
          <Chips wrap>{profile.languages.map((l) => <Chip key={l} label={l} sub={langCode(l)} />)}</Chips>
          <Label>My listings</Label>
        </View>
        {items.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 }}>
            {items.map((it) => <ListingCard key={it.id} item={it} width={cardW} />)}
          </View>
        ) : <Empty title="Nothing for sale yet" text="Tap Sell to post your first item." />}
        <View style={s.pad}>
          <Label>Contact details</Label>
          <View style={s.box}>
            <Row k="Email" v={session!.user.email ?? ''} />
            <Row k="Phone" v={contacts?.phone || 'Not added'} />
            <Row k="Instagram" v={contacts?.instagram || 'Not added'} last />
          </View>
          <Text style={[s.hint, { marginTop: 8 }]}>Phone and Instagram are only shared when you tap Share contact in a chat.</Text>
          <Label>Account</Label>
          <View style={s.box}>
            <Link icon="file-document-outline" label="Terms and privacy" onPress={() => router.push('/terms')} />
            <Link icon="logout" label="Sign out" onPress={() => supabase.auth.signOut()} />
            <Link icon="delete-outline" label="Delete my account" danger onPress={del} last />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Row = ({ k, v, last }: { k: string; v: string; last?: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.line, gap: 10 }}>
    <Text style={s.p}>{k}</Text><Text style={[s.p, { color: C.muted, flexShrink: 1 }]} numberOfLines={1}>{v}</Text>
  </View>
);

const Link = ({ icon, label, onPress, danger, last }: { icon: string; label: string; onPress: () => void; danger?: boolean; last?: boolean }) => (
  <Pressable onPress={onPress} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.line }}>
    <Icon name={icon} size={20} color={danger ? C.danger : C.ink} />
    <Text style={[s.p, danger && { color: C.danger }]}>{label}</Text>
  </Pressable>
);
