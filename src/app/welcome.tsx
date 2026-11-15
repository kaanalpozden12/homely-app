import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileForm } from '@/components/profile-form';
import { View } from 'react-native';

import { Header, Wordmark, s } from '@/components/ui';
import { BRAND } from '@/lib/brand';

export default function Welcome() {
  return (
    <SafeAreaView style={s.screen}>
      <View style={[s.pad, { paddingTop: 16 }]}><Wordmark size={22} /></View>
      <Header title={`Welcome to ${BRAND.name}`} sub="Tell neighbours a little about you. It takes a minute." />
      <ProfileForm isNew />
    </SafeAreaView>
  );
}
