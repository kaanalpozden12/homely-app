import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TermsLink } from '@/components/terms-modal';
import { Button, Field, Icon, Wordmark, s, type IconName } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { friendly } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { C, FONT, R, shadow } from '@/lib/theme';

/** Why people can trust buying here. Shown on the landing page. */
const TRUST: [IconName, string, string][] = [
  ['translate', 'Speak the same language', 'Filter by the languages sellers speak, so arranging a pickup is easy and friendly.'],
  ['spray-bottle', 'Hygiene checklist', 'Every listing says if it comes from a smoke-free, pet-free, clean home.'],
  ['handshake-outline', 'Pick up and pay in person', 'See the item before you pay. No delivery, no deposits, no surprises.'],
  ['map-marker-radius-outline', 'Your address stays private', 'Buyers only see a rounded distance until you choose to share the address.'],
];

const STEPS: [string, string][] = [
  ['Find something near you', 'Enter your postcode and pick how far you can travel.'],
  ['Chat in your language', 'Ask questions and agree a time with the seller.'],
  ['Collect and pay', 'Check the item, pay the seller in person and take it home.'],
];

export default function SignIn() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Google blocks its sign-in inside the Instagram, Facebook and TikTok in-app browsers.
  const inAppBrowser = Platform.OS === 'web' && /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance/i.test(navigator.userAgent);

  const google = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
    });
    if (error) setError(/not enabled|provider/i.test(error.message) ? 'Google sign-in is not switched on yet. Use your email for now.' : friendly(error));
  };

  const sendCode = async () => {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return setError('Enter a valid email address.');
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ email: e, options: {
        shouldCreateUser: true,
        // On the web the email's sign-in link also works and brings people back here.
        emailRedirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
      } });
    setBusy(false);
    if (error) {
      return setError(/rate limit|security purposes|seconds/i.test(error.message)
        ? 'Please wait a minute before asking for another code.'
        : friendly(error, 'We could not send the email. Check the address and try again.'));
    }
    setSent(true);
    setCode('');
  };

  const verify = async () => {
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.replace(/\D/g, ''), type: 'email' });
    setBusy(false);
    if (error) {
      setError(/fetch|network/i.test(error.message) ? friendly(error) : 'That code did not work. Use the code from the newest email, or send a new one.');
    }
  };

  const card = (
    <View style={[s.card, { padding: 20, borderRadius: R.xl }, shadow(2), wide && { width: 400 }]}>
      <Text style={s.h2}>{sent ? 'Check your email' : 'Join for free'}</Text>
      <Text style={[s.hint, { fontSize: 13.5, marginTop: 4, marginBottom: 18 }]}>
        {sent ? 'Enter the 6-digit code we just sent you.' : 'Sign in or create an account in seconds. No password needed.'}
      </Text>
      {!sent && Platform.OS === 'web' ? (
        inAppBrowser ? (
          <View style={[s.note, { marginBottom: 14, alignItems: 'flex-start' }]}>
            <Icon name="open-in-new" color={C.accent} />
            <Text style={{ flex: 1, color: C.muted, lineHeight: 19 }}>
              To sign in with Google, open {BRAND.name} in your phone's browser: tap <Text style={{ fontWeight: '700', color: C.ink }}>•••</Text> at
              the top and choose <Text style={{ fontWeight: '700', color: C.ink }}>Open in browser</Text>. Or use your email below.
            </Text>
          </View>
        ) : (
          <>
            <Button title="Continue with Google" kind="ghost" icon="google" onPress={google} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
              <Text style={[s.meta, { color: C.faint }]}>or with email</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
            </View>
          </>
        )
      ) : null}
      {!sent ? (
        <>
          <Field value={email} onChangeText={setEmail} placeholder="you@example.com" icon="email-outline" accessibilityLabel="Email"
            autoCapitalize="none" autoComplete="email" keyboardType="email-address" onSubmitEditing={sendCode} error={error} />
          <Button title="Email me a sign-in code" onPress={sendCode} busy={busy} />
        </>
      ) : (
        <>
          <View style={[s.note, { marginBottom: 14, alignItems: 'flex-start' }]}>
            <Icon name="email-check-outline" color={C.accent} />
            <Text style={{ flex: 1, color: C.muted, lineHeight: 19 }}>Sent to <Text style={{ fontWeight: '700', color: C.ink }}>{email}</Text>. Can't see it? Check your spam or junk folder.</Text>
          </View>
          <Field label="Code" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" icon="lock-outline"
            autoComplete="one-time-code" maxLength={8} onSubmitEditing={verify} error={error} />
          <Button title="Sign in" onPress={verify} busy={busy} disabled={code.trim().length < 6} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Button title="Send a new code" kind="ghost" small onPress={sendCode} disabled={busy} style={{ flex: 1 }} />
            <Button title="Change email" kind="ghost" small onPress={() => { setSent(false); setCode(''); setError(''); }} style={{ flex: 1 }} />
          </View>
        </>
      )}
      <Text style={[s.hint, { marginTop: 16, textAlign: 'center' }]}>
        By continuing you agree to the <TermsLink />.
      </Text>
    </View>
  );

  const hero = (
    <View style={{ gap: 14, flex: wide ? 1 : undefined }}>
      <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, backgroundColor: C.accentSoft, borderRadius: R.pill, paddingVertical: 6, paddingHorizontal: 12 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent }} />
        <Text style={{ color: C.accentDark, fontWeight: '700', fontSize: 12.5 }}>Now open in Chelsea and Battersea</Text>
      </View>
      <Text style={{ fontFamily: FONT, fontSize: wide ? 54 : 31, lineHeight: wide ? 60 : 36, fontWeight: '800', color: C.ink, letterSpacing: wide ? -1.8 : -1.1 }}>
        Pre-loved home items from neighbours who <Text style={{ color: C.accent }}>speak your language.</Text>
      </Text>
      <Text style={{ fontSize: wide ? 18 : 15.5, lineHeight: wide ? 27 : 23, color: C.muted, maxWidth: 520 }}>
        Buy and sell furniture, electronics and everyday household things across {BRAND.city}. Clean, checked and collected in person.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4 }}>
        {['Free to join', 'No delivery fees', 'Pay in person'].map((t) => (
          <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="check-circle" size={18} color={C.accent} />
            <Text style={{ color: C.ink, fontWeight: '600', fontSize: 14 }}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const pad = wide ? Math.max(40, (width - 1120) / 2) : 20;

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ paddingHorizontal: pad, paddingTop: wide ? 28 : 16, paddingBottom: wide ? 8 : 4 }}>
            <Wordmark size={wide ? 26 : 23} />
          </View>

          {/* Hero and sign-in */}
          <View style={{ paddingHorizontal: pad, paddingTop: wide ? 48 : 22, paddingBottom: wide ? 64 : 28, gap: wide ? 56 : 24, flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch' }}>
            {hero}
            {card}
          </View>

          {/* Trust */}
          <View style={{ backgroundColor: C.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingHorizontal: pad, paddingVertical: wide ? 56 : 32 }}>
            <Text style={[s.label, { marginTop: 0, color: C.accent }]}>Why people trust {BRAND.name}</Text>
            <Text style={[s.h1, { fontSize: wide ? 32 : 25, marginBottom: 22, maxWidth: 560 }]}>Second-hand, without the worry.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              {TRUST.map(([icon, title, text]) => (
                <View key={title} style={{ flexGrow: 1, flexBasis: wide ? 220 : 300, backgroundColor: C.bg, borderRadius: R.lg, padding: 18, gap: 8 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                    <Icon name={icon} size={23} color={C.accent} />
                  </View>
                  <Text style={s.h3}>{title}</Text>
                  <Text style={{ color: C.muted, fontSize: 14, lineHeight: 20.5 }}>{text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* How it works */}
          <View style={{ paddingHorizontal: pad, paddingVertical: wide ? 56 : 32 }}>
            <Text style={[s.label, { marginTop: 0, color: C.accent }]}>How it works</Text>
            <Text style={[s.h1, { fontSize: wide ? 32 : 25, marginBottom: 22 }]}>Three simple steps.</Text>
            <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? 28 : 18 }}>
              {STEPS.map(([title, text], i) => (
                <View key={title} style={{ flex: wide ? 1 : undefined, flexDirection: 'row', gap: 14 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: FONT, color: C.surface, fontWeight: '800', fontSize: 15 }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 3, paddingTop: 2 }}>
                    <Text style={s.h3}>{title}</Text>
                    <Text style={{ color: C.muted, fontSize: 14, lineHeight: 20.5 }}>{text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={{ marginTop: 'auto', backgroundColor: C.ink, paddingHorizontal: pad, paddingVertical: 28, gap: 14 }}>
            <Wordmark size={20} light />
            <Text style={{ color: '#B9C3BE', fontSize: 13.5, lineHeight: 20, maxWidth: 460 }}>{BRAND.tagline}</Text>
            <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
              <Link href="/terms" style={{ color: C.surface, fontWeight: '600', fontSize: 13.5 }}>Terms of use</Link>
              <Link href="/privacy" style={{ color: C.surface, fontWeight: '600', fontSize: 13.5 }}>Privacy policy</Link>
              <Text style={{ color: '#8E9893', fontSize: 13.5 }}>© {new Date().getFullYear()} {BRAND.name} · Made in {BRAND.city}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
