import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileForm } from '@/components/profile-form';
import { Header, s } from '@/components/ui';

export default function Welcome() {
  return (
    <SafeAreaView style={s.screen}>
      <Header title="Welcome to Homely" />
      <Text style={[s.p, s.pad, { color: '#5C6A70', marginBottom: 12 }]}>Tell neighbours a little about you.</Text>
      <ProfileForm isNew />
    </SafeAreaView>
  );
}
