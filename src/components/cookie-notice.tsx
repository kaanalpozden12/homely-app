import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { C, R, shadow } from '@/lib/theme';

const KEY = 'homely.cookie-notice.v1';

/** One-time note on the website: Loftrobin only stores what it needs to work (no tracking), so no consent is required. */
export function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    AsyncStorage.getItem(KEY).then((v) => setShow(!v)).catch(() => {});
  }, []);
  if (!show) return null;
  const close = () => {
    setShow(false);
    AsyncStorage.setItem(KEY, '1').catch(() => {});
  };
  return (
    <View style={{ position: 'absolute', left: 12, right: 12, bottom: 70, flexDirection: 'row', gap: 10, alignItems: 'center',
      backgroundColor: C.ink, borderRadius: R.lg, padding: 14, paddingHorizontal: 16, ...shadow(2) }}>
      <Text style={{ flex: 1, color: '#fff', fontSize: 13, lineHeight: 18 }}>
        {BRAND.name} uses no tracking or advertising cookies, only the storage needed to keep you signed in.{' '}
        <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }} onPress={() => router.push('/privacy')}>Privacy policy</Text>
      </Text>
      <Pressable accessibilityLabel="Close" onPress={close} hitSlop={10}>
        <Icon name="close" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}
