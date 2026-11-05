import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Chip, Icon, Loading, Photo, s } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { CHAT_SELECT, other, type ChatSummary } from '@/lib/chats';
import { langCode } from '@/lib/constants';
import { notify } from '@/lib/dialog';
import { price, time } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/theme';
import type { Contacts, Message } from '@/lib/types';

const QUICK = ['Is this still available?', 'Can I pick it up this weekend?', 'Would you take a bit less?'];

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const me = session!.user.id;
  const [chat, setChat] = useState<ChatSummary | null>(null);
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [text, setText] = useState('');
  const [sharing, setSharing] = useState(false);
  const [contacts, setContacts] = useState<Contacts | null>(null);
  const [share, setShare] = useState({ phone: true, instagram: true });
  const list = useRef<FlatList<Message>>(null);

  const add = useCallback((m: Message) => setMsgs((prev) => (prev?.some((x) => x.id === m.id) ? prev : [...(prev ?? []), m])), []);

  useEffect(() => {
    supabase.from('conversations').select(CHAT_SELECT).eq('id', id).single().then(({ data }) => setChat(data as unknown as ChatSummary));
    supabase.from('messages').select('*').eq('conversation_id', id).order('created_at').then(({ data }) => setMsgs((data ?? []) as Message[]));
    supabase.from('profile_contacts').select('*').eq('id', me).maybeSingle().then(({ data }) => setContacts(data as Contacts | null));
    supabase.rpc('mark_read', { p_conversation: id }).then(() => {});
    const ch = supabase.channel(`chat-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (p) => {
        add(p.new as Message);
        supabase.rpc('mark_read', { p_conversation: id }).then(() => {});
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, me, add]);

  const send = async (body: string, kind: 'text' | 'contact' = 'text') => {
    body = body.trim();
    if (!body) return;
    if (kind === 'text') setText('');
    const { data, error } = await supabase.from('messages').insert({ conversation_id: id, sender_id: me, kind, body }).select('*').single();
    if (error) return notify('Message not sent', error.message.includes('row-level') ? 'You can no longer message this person.' : error.message);
    add(data as Message);
  };

  const shareContact = () => {
    const parts = [share.phone && contacts?.phone && `Phone: ${contacts.phone}`, share.instagram && contacts?.instagram && `Instagram: ${contacts.instagram}`].filter(Boolean);
    setSharing(false);
    if (parts.length) send(parts.join('\n'), 'contact');
  };

  if (!chat || !msgs) return <SafeAreaView style={s.screen}><Loading /></SafeAreaView>;
  const o = other(chat, me);
  const hasContacts = !!(contacts?.phone || contacts?.instagram);

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/chats'))} style={s.iconBtn}>
            <Icon name="chevron-left" size={24} />
          </Pressable>
          <Pressable style={{ flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' }} onPress={() => router.push(`/seller/${o.id}`)}>
            <Avatar id={o.id} name={o.name ?? '?'} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: C.ink }}>{o.name}</Text>
              <Text style={[s.meta, { fontSize: 12 }]}>{o.id_verified ? 'ID verified · ' : ''}speaks {(o.languages ?? []).map(langCode).join(', ')}</Text>
            </View>
          </Pressable>
          <Button title="Share contact" kind="ghost" small onPress={() => hasContacts ? setSharing(true) : notify('No contact details yet', 'Add your phone or Instagram in Profile > Edit profile first.')} />
        </View>
        {chat.listing && (
          <Pressable onPress={() => router.push(`/item/${chat.listing_id}`)}
            style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 8, paddingHorizontal: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <Photo listing={chat.listing} style={{ width: 40, height: 40 }} rounded={8} />
            <View style={{ flex: 1 }}>
              <Text style={s.title} numberOfLines={1}>{chat.listing.title}</Text>
              <Text style={s.meta}>{price(chat.listing.price)} · Pickup only{chat.listing.status === 'sold' ? ' · Sold' : ''}</Text>
            </View>
          </Pressable>
        )}
        <FlatList
          ref={list}
          data={msgs}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={<Text style={[s.meta, { textAlign: 'center', paddingHorizontal: 18, paddingBottom: 6 }]}>Meet somewhere public or bring a friend. Check the item, then pay in person.</Text>}
          renderItem={({ item: m }) => {
            const mine = m.sender_id === me;
            if (m.kind === 'contact') return (
              <View style={{ alignSelf: 'center', backgroundColor: C.accentSoft, borderRadius: 14, padding: 10, paddingHorizontal: 14 }}>
                <Text style={{ textAlign: 'center', color: C.ink, fontSize: 13.5, lineHeight: 20 }}>
                  {mine ? 'You shared your contact details' : `${o.name} shared their contact details`}{'\n'}
                  <Text style={{ fontWeight: '700' }} selectable>{m.body}</Text>
                </Text>
              </View>
            );
            return (
              <View style={{ maxWidth: '78%', alignSelf: mine ? 'flex-end' : 'flex-start', backgroundColor: mine ? C.accent : C.surface,
                borderWidth: 1, borderColor: mine ? C.accent : C.line, borderRadius: 18, paddingVertical: 9, paddingHorizontal: 13,
                borderBottomRightRadius: mine ? 6 : 18, borderBottomLeftRadius: mine ? 18 : 6 }}>
                <Text style={{ color: mine ? C.accentInk : C.ink, fontSize: 14.5, lineHeight: 20 }} selectable>{m.body}</Text>
                <Text style={{ color: mine ? C.accentInk : C.muted, opacity: 0.7, fontSize: 11, marginTop: 3 }}>{time(m.created_at)}</Text>
              </View>
            );
          }}
        />
        {!msgs.length && chat.buyer_id === me && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingBottom: 8 }}>
            {QUICK.map((q) => <Chip key={q} label={q} onPress={() => send(q)} />)}
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 8, padding: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.surface }}>
          <TextInput value={text} onChangeText={setText} placeholder={`Message ${o.name}`} placeholderTextColor="#98A3A6"
            onSubmitEditing={() => send(text)} returnKeyType="send" accessibilityLabel="Message" maxLength={2000}
            style={{ flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.bg, color: C.ink, fontSize: 15 }} />
          <Pressable accessibilityLabel="Send" onPress={() => send(text)}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={20} color={C.accentInk} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={sharing} transparent animationType="slide" onRequestClose={() => setSharing(false)}>
        <Pressable style={{ flex: 1, backgroundColor: '#0006', justifyContent: 'flex-end' }} onPress={() => setSharing(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 30, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
            <Text style={[s.h1, { fontSize: 21, flex: 0 }]}>Share your contact with {o.name}?</Text>
            <Text style={[s.hint, { marginVertical: 10 }]}>Only {o.name} will see what you tick.</Text>
            <View style={[s.box, { marginBottom: 16 }]}>
              {contacts?.phone ? <Toggle on={share.phone} label={`Phone · ${contacts.phone}`} onPress={() => setShare({ ...share, phone: !share.phone })} /> : null}
              {contacts?.instagram ? <Toggle on={share.instagram} label={`Instagram · ${contacts.instagram}`} onPress={() => setShare({ ...share, instagram: !share.instagram })} /> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancel" kind="ghost" onPress={() => setSharing(false)} style={{ flex: 1 }} />
              <Button title="Share" onPress={shareContact} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const Toggle = ({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 11 }}>
    <Icon name={on ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={C.accent} />
    <Text style={s.p}>{label}</Text>
  </Pressable>
);
