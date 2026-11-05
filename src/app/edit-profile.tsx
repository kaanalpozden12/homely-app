import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileForm } from '@/components/profile-form';
import { Header, s } from '@/components/ui';

export default function EditProfile() {
  return (
    <SafeAreaView style={s.screen}>
      <Header title="Edit profile" back />
      <ProfileForm isNew={false} />
    </SafeAreaView>
  );
}
