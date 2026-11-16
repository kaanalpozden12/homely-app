import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { C, R, shadow } from '@/lib/theme';

// The key keeps its old name so people who already closed the note don't see it again.
const KEY = 'homely.cookie-notice.v1';
const TAB_SCREENS = ['/', '/search', '/sell', '/chats', '/profile'];

/** One-time note on the website: Loftrobin only stores what it needs to work (no tracking), so no consent is required. */
export function CookieNotice() {
  const [show, setShow] = useState(false);
  const path = usePathname();
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
    // Sits above the tab bar on the main screens and near the bottom edge elsewhere, never wider than a phone.
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 12, right: 12, bottom: TAB_SCREENS.includes(path) ? 76 : 12, alignItems: 'center' }}>
    <View style={{ width: '100%', maxWidth: 520, flexDirection: 'row', gap: 10, alignItems: 'center',
      backgroundColor: C.ink, borderRadius: R.lg, padding: 14, paddingHorizontal: 16, ...shadow(2) }}>
      <Text style={{ flex: 1, color: '#fff', fontSize: 13, lineHeight: 18 }}>
        {BRAND.name} uses no tracking or advertising cookies, only the storage needed to keep you signed in.{' '}
        <Link href="/privacy" style={{ fontWeight: '700', textDecorationLine: 'underline', color: '#fff' }}>Privacy policy</Link>
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Close cookie note" onPress={close} hitSlop={10}>
        <Icon name="close" size={20} color="#fff" />
      </Pressable>
    </View>
    </View>
  );
}
