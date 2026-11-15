import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CookieNotice } from '@/components/cookie-notice';
import { TermsModal } from '@/components/terms-modal';
import { Button, Loading, s } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { FiltersProvider } from '@/lib/location';
import { isConfigured } from '@/lib/supabase';
import { C } from '@/lib/theme';

function Routes() {
  const { loading, session, profile } = useAuth();
  if (!isConfigured) return <NotConfigured />;
  if (loading) return <Loading />;
  const signedIn = !!session;
  const ready = signedIn && !!profile;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Protected guard={!signedIn} redirectTo={profile ? '/' : '/welcome'}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !profile} redirectTo={signedIn ? '/' : '/sign-in'}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={ready} redirectTo={signedIn ? '/welcome' : '/sign-in'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="seller/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="edit-profile" />
      </Stack.Protected>
      {/* Readable by anyone, signed in or not (needed for app stores, Stripe and the ads). */}
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function NotConfigured() {
  return (
    <View style={[s.screen, { justifyContent: 'center', padding: 24, gap: 10 }]}>
      <Text style={s.h1}>Almost ready</Text>
      <Text style={s.p}>
        Homely is not connected to its database yet. Add EXPO_PUBLIC_SUPABASE_URL and
        EXPO_PUBLIC_SUPABASE_ANON_KEY to the .env file (see README.md), then restart.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FiltersProvider>
          <StatusBar style="dark" />
          <View style={{ flex: 1, backgroundColor: C.bg }}>
            <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
              <Routes />
              <TermsModal />
              <CookieNotice />
            </View>
          </View>
        </FiltersProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/** Shown instead of a blank screen if something crashes. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={[s.screen, { justifyContent: 'center', padding: 24, gap: 12 }]}>
      <Text style={s.h1}>Something went wrong</Text>
      <Text style={s.p}>Sorry about that. Please try again. If it keeps happening, close the app and open it again.</Text>
      <Button title="Try again" onPress={retry} />
    </View>
  );
}
