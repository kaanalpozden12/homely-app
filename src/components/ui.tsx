import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';

import { categoryIcon, langCode } from '@/lib/constants';
import { avatarColor, distance, price } from '@/lib/format';
import { C, R } from '@/lib/theme';
import type { Listing } from '@/lib/types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export const Icon = ({ name, size = 20, color = C.ink }: { name: IconName | string; size?: number; color?: string }) => (
  <MaterialCommunityIcons name={name as IconName} size={size} color={color} />
);

export function Button({
  title, onPress, kind = 'primary', icon, busy, disabled, small, style,
}: {
  title: string; onPress?: () => void; kind?: 'primary' | 'ghost' | 'danger'; icon?: IconName;
  busy?: boolean; disabled?: boolean; small?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const fg = kind === 'primary' ? C.accentInk : kind === 'danger' ? C.danger : C.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        kind === 'primary' ? { backgroundColor: C.accent } : { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
        (disabled || pressed) && { opacity: 0.6 },
        style,
      ]}>
      {busy ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Icon name={icon} size={small ? 16 : 20} color={fg} />}
          <Text style={[s.btnText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({ label, sub, on, onPress }: { label: string; sub?: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={[s.chip, on && { backgroundColor: C.ink, borderColor: C.ink }]}>
      <Text style={[s.chipText, on && { color: C.bg }]}>
        {label}
        {sub ? <Text style={{ fontSize: 11, opacity: 0.65 }}>{'  '}{sub}</Text> : null}
      </Text>
    </Pressable>
  );
}

export const Chips = ({ children, wrap }: { children: ReactNode; wrap?: boolean }) => (
  <View style={[s.chips, wrap && { flexWrap: 'wrap' }]}>{children}</View>
);

export const Label = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={style}><Text style={s.label}>{children}</Text></View>
);

export function Field({ label, hint, error, ...props }: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ marginBottom: 14, gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#98A3A6"
        {...props}
        style={[s.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }, props.style]}
      />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

export function Header({ title, back, right }: { title?: string; back?: boolean; right?: ReactNode }) {
  return (
    <View style={s.header}>
      {back && (
        <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.iconBtn}>
          <Icon name="chevron-left" size={24} />
        </Pressable>
      )}
      {title ? <Text style={[s.h1, back && { fontSize: 19 }]} numberOfLines={1}>{title}</Text> : <View style={{ flex: 1 }} />}
      {right}
    </View>
  );
}

export function Avatar({ id, name, size = 44 }: { id: string; name: string; size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(id) }]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.4 }}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export const Verified = ({ on }: { on: boolean }) =>
  on ? (
    <View style={s.verified}>
      <Icon name="shield-check" size={14} color={C.verify} />
      <Text style={{ color: C.verify, fontWeight: '700', fontSize: 12.5 }}>ID verified</Text>
    </View>
  ) : (
    <View style={[s.verified, { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line }]}>
      <Icon name="shield-outline" size={14} color={C.muted} />
      <Text style={{ color: C.muted, fontWeight: '700', fontSize: 12.5 }}>ID not checked yet</Text>
    </View>
  );

export const LangTags = ({ langs }: { langs: string[] }) => (
  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
    {langs.map((l) => (
      <Text key={l} style={s.lc} accessibilityLabel={`Speaks ${l}`}>{langCode(l)}</Text>
    ))}
  </View>
);

export function Photo({ listing, style, rounded = 14 }: { listing: Pick<Listing, 'photos' | 'category' | 'status'>; style?: StyleProp<ViewStyle>; rounded?: number }) {
  const url = listing.photos?.[0];
  return (
    <View style={[s.photo, { borderRadius: rounded }, style]}>
      {url ? (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <Icon name={categoryIcon(listing.category)} size={44} color={C.accent} />
      )}
      {listing.status === 'sold' && <Text style={s.soldTag}>Sold</Text>}
    </View>
  );
}

export function ListingCard({ item, width }: { item: Listing; width: number }) {
  return (
    <Pressable onPress={() => router.push(`/item/${item.id}`)} style={{ width, gap: 5 }}>
      <Photo listing={item} style={{ width, height: width }} />
      <Text style={s.price}>{price(item.price)}</Text>
      <Text style={s.title} numberOfLines={2}>{item.title}</Text>
      <Text style={s.meta}>{distance(item.distance_miles)} · {item.area}</Text>
      <LangTags langs={item.seller_languages} />
    </Pressable>
  );
}

export function ListingRow({ item }: { item: Listing }) {
  return (
    <Pressable onPress={() => router.push(`/item/${item.id}`)} style={s.row}>
      <Photo listing={item} style={{ width: 72, height: 72 }} rounded={10} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.price, { fontSize: 16 }]}>{price(item.price)}</Text>
        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Text style={s.meta}>{distance(item.distance_miles)} · {item.area}</Text>
          <LangTags langs={item.seller_languages} />
        </View>
      </View>
    </Pressable>
  );
}

export const Empty = ({ title, text }: { title: string; text: string }) => (
  <View style={{ padding: 40, alignItems: 'center' }}>
    <Text style={{ fontWeight: '700', fontSize: 16, color: C.ink, marginBottom: 4 }}>{title}</Text>
    <Text style={{ color: C.muted, textAlign: 'center', lineHeight: 21 }}>{text}</Text>
  </View>
);

export const Note = ({ icon, children }: { icon: IconName; children: ReactNode }) => (
  <View style={s.note}>
    <Icon name={icon} size={20} color={C.accent} />
    <Text style={{ flex: 1, color: C.muted, fontSize: 13.5, lineHeight: 19 }}>{children}</Text>
  </View>
);

export const Loading = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <ActivityIndicator color={C.accent} />
  </View>
);

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  pad: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  h1: { flex: 1, fontSize: 24, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18 },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 11 },
  btnText: { fontWeight: '700', fontSize: 15 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: R.pill, paddingVertical: 7, paddingHorizontal: 13 },
  chipText: { fontSize: 13, fontWeight: '600', color: C.ink },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.muted, marginTop: 18, marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13, fontSize: 15, color: C.ink },
  hint: { fontSize: 12.5, color: C.muted, lineHeight: 17 },
  error: { fontSize: 13, color: C.danger },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.verifySoft, borderRadius: R.pill, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  lc: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, borderWidth: 1, borderColor: C.line, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1, color: C.muted, overflow: 'hidden' },
  photo: { backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  soldTag: { position: 'absolute', left: 8, top: 8, backgroundColor: C.ink, color: C.bg, fontSize: 11, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  price: { fontSize: 18, fontWeight: '800', color: C.ink },
  title: { fontSize: 14, color: C.ink, lineHeight: 18 },
  meta: { fontSize: 12.5, color: C.muted },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: 'center' },
  note: { flexDirection: 'row', gap: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12 },
  box: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 14 },
  p: { fontSize: 14.5, lineHeight: 21, color: C.ink },
});
