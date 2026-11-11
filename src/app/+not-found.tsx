import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Empty, s } from '@/components/ui';

export default function NotFound() {
  return (
    <SafeAreaView style={s.screen}>
      <Empty title="Page not found" text="This link may be old, or the item may have been removed." />
      <View style={s.pad}>
        <Button title="Go to Homely" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}
