import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TermsModal } from '@/components/terms-modal';
import { Loading, s } from '@/components/ui';
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
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !profile}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={ready}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="seller/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="terms" />
      </Stack.Protected>
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
            </View>
          </View>
        </FiltersProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
