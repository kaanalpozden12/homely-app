import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Chips, Field, Header, Icon, Label, Note, s } from '@/components/ui';
import { uploadPhoto } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORIES, CONDITIONS, HYGIENE, MAX_PHOTOS, REQUIRE_ID_TO_SELL } from '@/lib/constants';
import { isFullPostcode, lookupPostcode } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/theme';

type Picked = { uri: string; mime: string };

export default function Sell() {
  const { session, profile } = useAuth();
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

  if (REQUIRE_ID_TO_SELL && profile && !profile.id_verified) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <Header title="Sell an item" />
        <View style={[s.pad, { gap: 14 }]}>
          <Note icon="shield-account-outline">
            <Text style={{ fontWeight: '700', color: C.ink }}>Your ID check is next.</Text> To keep Homely safe, every seller's
            ID is checked once before they can post. We'll contact you to arrange a short video call. You can still browse and
            message sellers in the meantime.
          </Note>
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
    setBusy(true);
    setError('');
    try {
      const place = await lookupPostcode(postcode);
      if (!place) throw new Error("We couldn't find that postcode. Check it and try again.");
      const urls: string[] = [];
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
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const hint = CATEGORIES.find((c) => c.name === category)?.hint;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Header title="Sell an item" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[s.pad, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
          <Text style={s.fieldLabel}>Photos</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6, marginBottom: 14 }}>
            {photos.map((ph, i) => (
              <View key={ph.uri} style={{ width: 96, height: 96, borderRadius: 12, overflow: 'hidden' }}>
                <Image source={{ uri: ph.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <Pressable accessibilityLabel="Remove photo" onPress={() => setPhotos(photos.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', right: 4, top: 4, backgroundColor: '#000a', borderRadius: 12, padding: 2 }}>
                  <Icon name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable onPress={pick} style={{ width: 96, height: 96, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
                borderColor: C.line, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Icon name="camera-outline" size={24} color={C.muted} />
                <Text style={{ fontSize: 12, color: C.muted }}>{photos.length ? 'Add more' : 'Add photos'}</Text>
              </Pressable>
            )}
          </View>
          <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Grey sofa, city bike, winter coat" maxLength={80} />
          <Field label="Price (£)" value={priceText} onChangeText={setPriceText} placeholder="40 (0 = free)" keyboardType="number-pad" maxLength={6} />
          <Text style={s.fieldLabel}>Category</Text>
          <View style={{ marginTop: 6 }}>
            <Chips wrap>{CATEGORIES.map((c) => <Chip key={c.name} label={c.name} on={category === c.name} onPress={() => setCategory(c.name)} />)}</Chips>
          </View>
          <Text style={[s.hint, { marginTop: 6, marginBottom: 14 }]}>{hint}</Text>
          <Text style={s.fieldLabel}>Condition</Text>
          <View style={{ marginTop: 6, marginBottom: 14 }}>
            <Chips wrap>{CONDITIONS.map((c) => <Chip key={c} label={c} on={condition === c} onPress={() => setCondition(c)} />)}</Chips>
          </View>
          <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={2000}
            placeholder="Size, age, any marks, when it can be collected" />
          <Text style={s.fieldLabel}>Hygiene checklist</Text>
          <View style={[s.box, { marginTop: 6, marginBottom: 14 }]}>
            {HYGIENE.map((h, i) => {
              const on = hygiene.includes(h);
              return (
                <Pressable key={h} onPress={() => setHygiene(on ? hygiene.filter((x) => x !== h) : [...hygiene, h])}
                  style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
                  <Icon name={on ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={C.accent} />
                  <Text style={s.p}>{h}</Text>
                </Pressable>
              );
            })}
          </View>
          <Field label="Pickup postcode" value={postcode} onChangeText={setPostcode} placeholder="SW3 4RY" autoCapitalize="characters" autoComplete="postal-code" />
          <View style={{ gap: 10, marginBottom: 16 }}>
            <Note icon="map-marker-outline">
              <Text style={{ fontWeight: '700', color: C.ink }}>Your postcode stays private.</Text> Buyers only see the first part (like SW3)
              and a rounded distance. You share the exact address in chat when you agree a pickup.
            </Note>
            <Note icon="hand-coin-outline">
              <Text style={{ fontWeight: '700', color: C.ink }}>Pickup only.</Text> The buyer collects and pays you in person.
            </Note>
            <Note icon="alert-circle-outline">
              Not allowed: weapons, medicines, alcohol, tobacco, counterfeit or stolen goods, animals, and anything unsafe or recalled.
            </Note>
          </View>
          {error ? <Text style={[s.error, { marginBottom: 10 }]}>{error}</Text> : null}
          <Button title="Publish listing" onPress={publish} busy={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
