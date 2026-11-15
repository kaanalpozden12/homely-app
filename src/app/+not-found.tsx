import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Empty, s } from '@/components/ui';
import { BRAND } from '@/lib/brand';

export default function NotFound() {
  return (
    <SafeAreaView style={s.screen}>
      <Empty icon="map-marker-question-outline" title="Page not found" text="This link may be old, or the item may have been removed." />
      <View style={s.pad}>
        <Button title={`Go to ${BRAND.name}`} onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}
