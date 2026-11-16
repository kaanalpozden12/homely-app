import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Chips, Field, Header, Icon, Note, Section, Tag, s, type IconName } from '@/components/ui';
import { removePhotos, uploadPhoto } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORIES, CONDITIONS, HYGIENE, MAX_PHOTOS } from '@/lib/constants';
import { friendly } from '@/lib/errors';
import { useSettings } from '@/lib/settings';
import { isFullPostcode, lookupPostcode } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import { BRAND } from '@/lib/brand';
import { C, R } from '@/lib/theme';

type Picked = { uri: string; mime: string };

export default function Sell() {
  const { session, profile, refreshProfile } = useAuth();
  const settings = useSettings();
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [title, setTitle] = useState('');
  const [priceText, setPriceText] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [condition, setCondition] = useState('Good');
  const [description, setDescription] = useState('');
  const [hygiene, setHygiene] = useState<string[]>(HYGIENE.slice(0, 3));
  const [postcode, setPostcode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (settings.require_id_to_sell && profile && !profile.id_verified) {
    const requested = !!profile.id_check_requested_at;
    const request = async () => {
      setBusy(true);
      const { error } = await supabase.rpc('request_id_check');
      if (!error) await refreshProfile();
      setBusy(false);
      if (error) setError(friendly(error));
    };
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <Header title="Sell an item" />
        <View style={[s.pad, { gap: 14 }]}>
          <Note icon="shield-account-outline">
            <Text style={{ fontWeight: '700', color: C.ink }}>One quick ID check before you sell.</Text> To keep {BRAND.name} safe, every
            seller's ID is checked once on a short video call. You can browse, reserve and message sellers in the meantime.
          </Note>
          {requested ? (
            <Note icon="check-circle-outline">
              <Text style={{ fontWeight: '700', color: C.ink }}>Request received.</Text> We'll contact you by email
              {' '}(check your spam folder too), or by phone or Instagram if you added them in your profile, usually within 2 days.
            </Note>
          ) : (
            <Button title="Request my ID check" icon="shield-check-outline" onPress={request} busy={busy} />
          )}
          <Button title="Add phone or Instagram" kind="ghost" onPress={() => router.push('/edit-profile')} />
          {error ? <Text style={s.error}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  const pick = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.6,
    });
    if (res.canceled) return;
    setPhotos((p) => [...p, ...res.assets.map((a) => ({ uri: a.uri, mime: a.mimeType ?? 'image/jpeg' }))].slice(0, MAX_PHOTOS));
  };

  const publish = async () => {
    const t = title.trim();
    const p = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
    if (!photos.length) return setError('Add at least one photo.');
    if (t.length < 3) return setError("Add a title so buyers know what you're selling.");
    if (!(p >= 0)) return setError("Add a price in pounds. Use 0 if it's free.");
    if (!isFullPostcode(postcode)) return setError('Add your full pickup postcode, like SW3 4RY.');
    if (p > 100000) return setError('The highest price you can set is £100,000.');
    setBusy(true);
    setError('');
    const urls: string[] = [];
    try {
      const place = await lookupPostcode(postcode);
      if (!place) throw new Error("We couldn't find that postcode. Check it and try again.");
      for (const ph of photos) urls.push(await uploadPhoto(ph.uri, session!.user.id, ph.mime));
      const { data, error } = await supabase
        .from('listings')
        .insert({
          seller_id: session!.user.id, title: t, price: p, category, condition, description: description.trim(),
          hygiene, area: place.outcode, lat: place.lat, lng: place.lng, photos: urls,
        })
        .select('id')
        .single();
      if (error) throw error;
      setPhotos([]); setTitle(''); setPriceText(''); setDescription('');
      router.push(`/item/${data.id}`);
    } catch (e) {
      removePhotos(urls).catch(() => {}); // don't leave half-uploaded photos behind
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const hint = CATEGORIES.find((c) => c.name === category)?.hint;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Header title="Sell an item" sub="Free to list. Buyers collect and pay you in person." />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[s.pad, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
          <Section title="Photos" sub={`Add up to ${MAX_PHOTOS}. Real photos of the actual item sell faster.`}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {photos.map((ph, i) => (
                <View key={ph.uri} style={{ width: 92, height: 92, borderRadius: R.md, overflow: 'hidden' }}>
                  <Image source={{ uri: ph.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  {i === 0 && <View style={{ position: 'absolute', left: 4, bottom: 4 }}><Tag text="Cover" tone="dark" /></View>}
                  <Pressable accessibilityLabel="Remove photo" onPress={() => setPhotos(photos.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', right: 4, top: 4, backgroundColor: '#000a', borderRadius: 12, padding: 2 }}>
                    <Icon name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <Pressable onPress={pick} accessibilityRole="button" accessibilityLabel={photos.length ? 'Add more photos' : 'Add photos'} style={{ width: 92, height: 92, borderRadius: R.md, borderWidth: 1.5, borderStyle: 'dashed',
                  borderColor: C.accent, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Icon name="camera-plus-outline" size={26} color={C.accent} />
                  <Text style={{ fontSize: 12, color: C.accentDark, fontWeight: '700' }}>{photos.length ? 'Add more' : 'Add photos'}</Text>
                </Pressable>
              )}
            </View>
          </Section>
          <Section title="Details">
            <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Grey sofa, city bike, winter coat" maxLength={80} />
            <Field label="Price (£)" value={priceText} onChangeText={setPriceText} placeholder="40" keyboardType="number-pad" maxLength={6}
              icon="currency-gbp" hint="Enter 0 to give it away for free." />
            <Text style={s.fieldLabel}>Category</Text>
            <View style={{ marginTop: 8 }}>
              <Chips wrap>{CATEGORIES.map((c) => <Chip key={c.name} label={c.name} icon={c.icon as IconName} on={category === c.name} onPress={() => setCategory(c.name)} />)}</Chips>
            </View>
            <Text style={[s.hint, { marginTop: 8, marginBottom: 16 }]}>{hint}</Text>
            <Text style={s.fieldLabel}>Condition</Text>
            <View style={{ marginTop: 8, marginBottom: 16 }}>
              <Chips wrap>{CONDITIONS.map((c) => <Chip key={c} label={c} on={condition === c} onPress={() => setCondition(c)} />)}</Chips>
            </View>
            <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={2000}
              placeholder="Size, age, any marks, when it can be collected" />
          </Section>
          <Section title="Hygiene checklist" sub="Tick what's true. Buyers see this on your listing.">
            {HYGIENE.map((h, i) => {
              const on = hygiene.includes(h);
              return (
                <Pressable key={h} onPress={() => setHygiene(on ? hygiene.filter((x) => x !== h) : [...hygiene, h])}
                  accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                  style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
                  <Icon name={on ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={24} color={on ? C.accent : C.faint} />
                  <Text style={s.p}>{h}</Text>
                </Pressable>
              );
            })}
          </Section>
          <Section title="Pickup">
            <Field label="Pickup postcode" value={postcode} onChangeText={setPostcode} placeholder="SW3 4RY" autoCapitalize="characters"
              autoComplete="postal-code" icon="map-marker-outline" />
            <View style={{ gap: 10 }}>
              <Note icon="lock-outline" tone="accent">
                <Text style={{ fontWeight: '700', color: C.ink }}>Your postcode stays private.</Text> Buyers only see the first part (like SW3)
                and a rounded distance. You share the exact address in chat when you agree a pickup.
              </Note>
              <Note icon="hand-coin-outline" tone="accent">
                <Text style={{ fontWeight: '700', color: C.ink }}>Pickup only.</Text> The buyer collects and pays you in person.
              </Note>
            </View>
          </Section>
          <Note icon="alert-circle-outline" tone="warm">
            Not allowed: weapons, medicines, alcohol, tobacco, counterfeit or stolen goods, animals, and anything unsafe or recalled.
          </Note>
          {error ? <Text style={[s.error, { marginTop: 14 }]}>{error}</Text> : null}
          <Button title="Publish listing" icon="check" onPress={publish} busy={busy} style={{ marginTop: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
