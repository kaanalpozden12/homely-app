import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Chip, Chips, Empty, Header, Label, ListingCard, ListLink, Verified, s } from '@/components/ui';
import { deleteMyAccount, findListings } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { langCode } from '@/lib/constants';
import { confirm, notify } from '@/lib/dialog';
import { monthYear } from '@/lib/format';
import { useFilters } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import { C, shadow } from '@/lib/theme';
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

  const active = items.filter((i) => i.status !== 'sold').length;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Header title="Profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.pad}>
          <View style={[s.card, { padding: 18 }, shadow(1)]}>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <Avatar id={me} name={profile.name} size={68} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.h2} numberOfLines={1}>{profile.name}</Text>
                <Text style={s.meta}>{profile.area ? `${profile.area} · ` : ''}Joined {monthYear(profile.created_at)}</Text>
                <Verified on={profile.id_verified} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.line }}>
              <Stat n={active} label="For sale" />
              <Stat n={items.length - active} label="Sold" />
              <Stat n={profile.languages.length} label={profile.languages.length === 1 ? 'Language' : 'Languages'} />
            </View>
            <Button title="Edit profile" kind="ghost" small icon="pencil-outline" onPress={() => router.push('/edit-profile')} style={{ marginTop: 14 }} />
          </View>
          <Label>I buy and sell in</Label>
          <Chips wrap>{profile.languages.map((l) => <Chip key={l} label={l} sub={langCode(l)} />)}</Chips>
          <Label>My listings</Label>
        </View>
        {items.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, rowGap: 18, paddingHorizontal: 16 }}>
            {items.map((it) => <ListingCard key={it.id} item={it} width={cardW} />)}
          </View>
        ) : (
          <View style={[s.card, { marginHorizontal: 16 }]}>
            <Empty icon="tag-outline" title="Nothing for sale yet" text="Clearing out before a move? Your first listing takes about a minute."
              action={{ title: 'Sell an item', onPress: () => router.navigate('/sell') }} />
          </View>
        )}
        <View style={s.pad}>
          <Label>Contact details</Label>
          <View style={s.box}>
            <ListLink icon="email-outline" label="Email" value={session!.user.email ?? ''} />
            <ListLink icon="phone-outline" label="Phone" value={contacts?.phone || 'Not added'} />
            <ListLink icon="instagram" label="Instagram" value={contacts?.instagram || 'Not added'} last />
          </View>
          <Text style={[s.hint, { marginTop: 8 }]}>Phone and Instagram are only shared when you tap Share contact in a chat.</Text>
          <Label>Account</Label>
          <View style={s.box}>
            <ListLink icon="file-document-outline" label="Terms of use" onPress={() => router.push('/terms')} />
            <ListLink icon="shield-lock-outline" label="Privacy policy" onPress={() => router.push('/privacy')} />
            <ListLink icon="logout" label="Sign out" onPress={() => supabase.auth.signOut()} />
            <ListLink icon="delete-outline" label="Delete my account" danger onPress={del} last />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Stat = ({ n, label }: { n: number; label: string }) => (
  <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
    <Text style={[s.h2, { fontSize: 19 }]}>{n}</Text>
    <Text style={s.meta}>{label}</Text>
  </View>
);
