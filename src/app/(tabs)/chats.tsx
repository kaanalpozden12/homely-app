import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Empty, Header, Loading, Photo, s } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { isUnread, loadChats, other, type ChatSummary } from '@/lib/chats';
import { time } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { C, R } from '@/lib/theme';

export default function Chats() {
  const { session } = useAuth();
  const me = session!.user.id;
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [last, setLast] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await loadChats().catch(() => []);
    setChats(list);
    if (list.length) {
      const { data } = await supabase.from('messages').select('conversation_id, sender_id, kind, body')
        .in('conversation_id', list.map((c) => c.id)).order('created_at', { ascending: false }).limit(300);
      const m: Record<string, string> = {};
      for (const r of data ?? []) {
        if (m[r.conversation_id]) continue;
        if (r.kind === 'system') m[r.conversation_id] = r.body;
        else m[r.conversation_id] = (r.sender_id === me ? 'You: ' : '') + (r.kind === 'contact' ? 'Contact details shared' : r.body);
      }
      setLast(m);
    }
  }, [me]);

  useFocusEffect(useCallback(() => {
    load();
    const ch = supabase.channel('chat-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]));

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Header title="Chats" />
      {chats === null ? <Loading /> : (
        <FlatList
          data={chats}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          ListEmptyComponent={<Empty icon="chat-outline" title="No chats yet" text="When you message a seller, or a buyer messages you, the conversation shows up here."
            action={{ title: 'Browse items', onPress: () => router.navigate('/') }} />}
          renderItem={({ item: c }) => {
            const o = other(c, me);
            const unread = isUnread(c, me);
            return (
              <Pressable onPress={() => router.push(`/chat/${c.id}`)}
                style={({ pressed }) => [{ flexDirection: 'row', gap: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center',
                  backgroundColor: unread ? C.surface : 'transparent', borderBottomWidth: 1, borderBottomColor: C.line }, pressed && { opacity: 0.8 }]}>
                <View>
                  <Avatar id={o.id} name={o.name ?? '?'} size={50} />
                  {unread && <View style={{ position: 'absolute', right: 0, top: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: C.warm, borderWidth: 2, borderColor: C.surface }} />}
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Text style={[s.h3, { fontSize: 15.5 }]} numberOfLines={1}>{o.name}</Text>
                    <Text style={[s.meta, { fontSize: 12 }, unread && { color: C.warm, fontWeight: '700' }]}>{time(c.last_message_at)}</Text>
                  </View>
                  <Text style={{ fontSize: 12.5, color: C.accent, fontWeight: '700' }} numberOfLines={1}>{c.listing?.title ?? 'Listing removed'}</Text>
                  <Text style={{ color: unread ? C.ink : C.muted, fontWeight: unread ? '600' : '400', fontSize: 13.5 }} numberOfLines={1}>
                    {last[c.id] ?? 'Start the conversation'}
                  </Text>
                </View>
                {c.listing && <Photo listing={c.listing} style={{ width: 50, height: 50 }} rounded={R.md} tag={false} />}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
