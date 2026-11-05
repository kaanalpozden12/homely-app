import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/ui';
import { useUnread } from '@/lib/unread';
import { C } from '@/lib/theme';

const icon = (name: IconName) => ({ color }: { color: unknown }) => <Icon name={name} size={24} color={String(color)} />;

export default function TabsLayout() {
  const unread = useUnread();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.line },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
        sceneStyle: { backgroundColor: C.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: icon('magnify') }} />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: () => (
            <View style={{ width: 40, height: 26, borderRadius: 9, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={20} color={C.accentInk} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="chats" options={{ title: 'Chats', tabBarIcon: icon('chat-outline'), tabBarBadge: unread || undefined, tabBarBadgeStyle: { backgroundColor: C.accent } }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('account-outline') }} />
    </Tabs>
  );
}
