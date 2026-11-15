import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui';
import { useUnread } from '@/lib/unread';
import { C, FONT, shadow } from '@/lib/theme';

const icon = (off: IconName, on: IconName) => ({ color, focused }: { color: unknown; focused: boolean }) =>
  <Icon name={focused ? on : off} size={25} color={String(color)} />;

export default function TabsLayout() {
  const unread = useUnread();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.faint,
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.line, height: Platform.OS === 'web' ? 64 : undefined, paddingTop: 6 },
        tabBarItemStyle: Platform.OS === 'web' ? { paddingBottom: 8 } : undefined,
        tabBarLabelStyle: { fontFamily: FONT, fontWeight: '700', fontSize: 11 },
        sceneStyle: { backgroundColor: C.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: icon('magnify', 'magnify') }} />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarAccessibilityLabel: 'Sell an item',
          tabBarIcon: () => (
            <View style={[{ width: 46, height: 32, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }, shadow(1)]}>
              <Icon name="plus" size={22} color={C.accentInk} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="chats" options={{ title: 'Chats', tabBarIcon: icon('chat-outline', 'chat'), tabBarBadge: unread || undefined, tabBarBadgeStyle: { backgroundColor: C.warm, fontWeight: '700' } }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('account-circle-outline', 'account-circle') }} />
    </Tabs>
  );
}
