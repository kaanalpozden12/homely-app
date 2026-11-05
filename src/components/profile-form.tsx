import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { TermsLink } from '@/components/terms-modal';
import { Button, Chip, Chips, Field, Icon, Label, s } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { LANGUAGES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/theme';

export function ProfileForm({ isNew }: { isNew: boolean }) {
  const { session, profile, refreshProfile } = useAuth();
  const uid = session!.user.id;
  const [name, setName] = useState(profile?.name ?? '');
  const [area, setArea] = useState(profile?.area ?? '');
  const [langs, setLangs] = useState<string[]>(profile?.languages ?? []);
  const [phone, setPhone] = useState('');
  const [insta, setInsta] = useState('');
  const [agree, setAgree] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('profile_contacts').select('*').eq('id', uid).maybeSingle().then(({ data }) => {
      if (data) {
        setPhone(data.phone);
        setInsta(data.instagram);
      }
    });
  }, [uid]);

  const toggle = (l: string) => setLangs((a) => (a.includes(l) ? a.filter((x) => x !== l) : [...a, l]));

  const save = async () => {
    const n = name.trim();
    if (!n) return setError('Add your first name.');
    if (!langs.length) return setError('Pick at least one language you speak.');
    if (!agree) return setError('Please agree to the terms to continue.');
    setBusy(true);
    setError('');
    const row = { name: n, area: area.trim(), languages: langs };
    const res = isNew
      ? await supabase.from('profiles').insert({ id: uid, ...row })
      : await supabase.from('profiles').update(row).eq('id', uid);
    if (res.error) {
      setBusy(false);
      return setError(res.error.message);
    }
    const ig = insta.trim() && !insta.trim().startsWith('@') ? '@' + insta.trim() : insta.trim();
    await supabase.from('profile_contacts').upsert({ id: uid, phone: phone.trim(), instagram: ig });
    await refreshProfile();
    setBusy(false);
    if (!isNew) router.back();
  };

  return (
    <ScrollView contentContainerStyle={[s.pad, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
      <Field label="First name" value={name} onChangeText={setName} placeholder="e.g. Kaan" maxLength={40} autoComplete="given-name" />
      <Field label="Neighbourhood" value={area} onChangeText={setArea} placeholder="e.g. Chelsea" maxLength={40}
        hint="Shown on your profile. Never your street or address." />
      <Label style={{ marginTop: 0 }}>Languages I speak</Label>
      <Chips wrap>
        {LANGUAGES.map(([l, c]) => <Chip key={l} label={l} sub={c} on={langs.includes(l)} onPress={() => toggle(l)} />)}
      </Chips>
      <Text style={[s.hint, { marginTop: 8 }]}>Buyers can filter listings by the languages sellers speak.</Text>
      <Label>Contact details (optional)</Label>
      <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="07700 900000" keyboardType="phone-pad" autoComplete="tel" maxLength={30} />
      <Field label="Instagram" value={insta} onChangeText={setInsta} placeholder="@yourname" autoCapitalize="none" maxLength={40}
        hint="Private. Only shared with someone when you tap Share contact in a chat." />
      {isNew && (
        <Pressable onPress={() => setAgree(!agree)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <Icon name={agree ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={C.accent} />
          <Text style={[s.p, { flex: 1 }]}>
            I agree to the <TermsLink />, and I am 18 or over.
          </Text>
        </Pressable>
      )}
      {error ? <Text style={[s.error, { marginBottom: 10 }]}>{error}</Text> : null}
      <Button title={isNew ? 'Start using Homely' : 'Save'} onPress={save} busy={busy} />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}
