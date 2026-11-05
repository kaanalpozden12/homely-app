import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TermsLink } from '@/components/terms-modal';
import { Button, Field, Icon, s } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return setError('Enter a valid email address.');
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true);
  };

  const verify = async () => {
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) setError('That code did not work. Check the latest email, or send a new code.');
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 6, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 40, fontWeight: '800', color: C.ink, letterSpacing: -1 }}>
            home<Text style={{ color: C.accent }}>ly</Text>
          </Text>
          <Text style={[s.p, { color: C.muted, marginBottom: 24 }]}>
            Second-hand furniture and household items from ID-verified neighbours. Pick up in person, pay in person.
          </Text>
          {!sent ? (
            <>
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com"
                autoCapitalize="none" autoComplete="email" keyboardType="email-address" onSubmitEditing={sendCode} error={error} />
              <Button title="Send me a sign-in code" onPress={sendCode} busy={busy} />
            </>
          ) : (
            <>
              <View style={[s.note, { marginBottom: 14 }]}>
                <Icon name="email-check-outline" color={C.accent} />
                <Text style={{ flex: 1, color: C.muted }}>We sent a 6-digit code to <Text style={{ fontWeight: '700', color: C.ink }}>{email}</Text>.</Text>
              </View>
              <Field label="Code" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad"
                autoComplete="one-time-code" maxLength={8} onSubmitEditing={verify} error={error} />
              <Button title="Sign in" onPress={verify} busy={busy} disabled={code.trim().length < 6} />
              <Button title="Use a different email" kind="ghost" onPress={() => { setSent(false); setCode(''); setError(''); }} style={{ marginTop: 10 }} />
            </>
          )}
          <Text style={[s.hint, { marginTop: 18, textAlign: 'center' }]}>
            By continuing you agree to the <TermsLink />.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
