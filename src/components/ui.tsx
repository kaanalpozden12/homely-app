import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';

import { BRAND } from '@/lib/brand';
import { categoryIcon, langCode } from '@/lib/constants';
import { avatarColor, distance, price } from '@/lib/format';
import { C, FONT, R, shadow } from '@/lib/theme';
import type { Listing } from '@/lib/types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export const Icon = ({ name, size = 20, color = C.ink }: { name: IconName | string; size?: number; color?: string }) => (
  <MaterialCommunityIcons name={name as IconName} size={size} color={color} />
);

/** The brand logo: a small robin mark and the name. */
export function Wordmark({ size = 26, light }: { size?: number; light?: boolean }) {
  const mark = Math.round(size * 1.15);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.32 }} accessibilityRole="header" accessibilityLabel={BRAND.name}>
      <View style={{ width: mark, height: mark, borderRadius: mark * 0.3, backgroundColor: light ? C.surface : C.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="bird" size={mark * 0.64} color={light ? C.accent : C.accentInk} />
      </View>
      <Text style={{ fontFamily: FONT, fontSize: size, fontWeight: '800', letterSpacing: -size * 0.03, color: light ? C.surface : C.ink }}>
        {BRAND.wordmark[0]}<Text style={{ color: light ? '#BFE3D6' : C.accent }}>{BRAND.wordmark[1]}</Text>
      </Text>
    </View>
  );
}

export function Button({
  title, onPress, kind = 'primary', icon, busy, disabled, small, style,
}: {
  title: string; onPress?: () => void; kind?: 'primary' | 'ghost' | 'danger' | 'soft'; icon?: IconName;
  busy?: boolean; disabled?: boolean; small?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const fg = kind === 'primary' ? C.accentInk : kind === 'danger' ? C.danger : kind === 'soft' ? C.accentDark : C.ink;
  const bg = kind === 'primary' ? C.accent : kind === 'soft' ? C.accentSoft : C.surface;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        { backgroundColor: kind === 'primary' && pressed ? C.accentDark : bg },
        (kind === 'ghost' || kind === 'danger') && { borderWidth: 1, borderColor: C.line },
        kind === 'primary' && !disabled && shadow(1),
        disabled && { opacity: 0.5 },
        pressed && kind !== 'primary' && { opacity: 0.75 },
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

export function Chip({ label, sub, on, onPress, icon }: { label: string; sub?: string; on?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      disabled={!onPress}
      style={[s.chip, on && { backgroundColor: C.ink, borderColor: C.ink }]}>
      {icon && <Icon name={icon} size={15} color={on ? C.surface : C.accent} />}
      <Text style={[s.chipText, on && { color: C.surface }]}>
        {label}
        {sub ? <Text style={{ fontSize: 11, opacity: 0.6, fontWeight: '700' }}>{'  '}{sub}</Text> : null}
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

/** A titled group of content on a white card. */
export function Section({ title, sub, children, style }: { title?: string; sub?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.card, { padding: 16, marginBottom: 12 }, style]}>
      {title ? <Text style={s.h3}>{title}</Text> : null}
      {sub ? <Text style={[s.hint, { marginTop: 2 }]}>{sub}</Text> : null}
      {title || sub ? <View style={{ height: 12 }} /> : null}
      {children}
    </View>
  );
}

export function Field({ label, hint, error, icon, ...props }: TextInputProps & { label?: string; hint?: string; error?: string; icon?: IconName }) {
  return (
    <View style={{ marginBottom: 14, gap: 6 }}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <View style={{ justifyContent: 'center' }}>
        {icon && <View style={{ position: 'absolute', left: 13, zIndex: 1 }} pointerEvents="none"><Icon name={icon} size={20} color={C.faint} /></View>}
        <TextInput
          placeholderTextColor={C.faint}
          {...props}
          style={[s.input, icon && { paddingLeft: 42 }, !!error && { borderColor: C.danger }, props.multiline && { minHeight: 100, textAlignVertical: 'top' }, props.style]}
        />
      </View>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

export const BackButton = ({ fallback = '/', floating }: { fallback?: '/' | '/chats'; floating?: boolean }) => (
  <Pressable accessibilityLabel="Back" hitSlop={6} onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
    style={[s.iconBtn, floating && [{ borderWidth: 0 }, shadow(1)]]}>
    <Icon name="chevron-left" size={24} />
  </Pressable>
);

export function Header({ title, back, right, sub }: { title?: string; back?: boolean; right?: ReactNode; sub?: string }) {
  return (
    <View style={s.header}>
      {back && <BackButton />}
      <View style={{ flex: 1 }}>
        {title ? <Text style={[s.h1, back && { fontSize: 20 }]} numberOfLines={1}>{title}</Text> : null}
        {sub ? <Text style={[s.meta, { marginTop: 2 }]}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Avatar({ id, name, size = 44 }: { id: string; name: string; size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(id) }]}>
      <Text style={{ fontFamily: FONT, color: '#fff', fontWeight: '700', fontSize: size * 0.4 }}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export const Verified = ({ on, center }: { on: boolean; center?: boolean }) =>
  on ? (
    <View style={[s.verified, center && { alignSelf: 'center' }]}>
      <Icon name="shield-check" size={14} color={C.verify} />
      <Text style={{ color: C.verify, fontWeight: '700', fontSize: 12.5 }}>ID verified</Text>
    </View>
  ) : null;

export const LangTags = ({ langs, max = 3 }: { langs: string[]; max?: number }) => (
  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
    <Icon name="translate" size={13} color={C.faint} />
    {langs.slice(0, max).map((l) => (
      <Text key={l} style={s.lc} accessibilityLabel={`Speaks ${l}`}>{langCode(l)}</Text>
    ))}
    {langs.length > max ? <Text style={[s.lc, { backgroundColor: 'transparent' }]}>+{langs.length - max}</Text> : null}
  </View>
);

/** A small rounded label, e.g. "Like new". */
export const Tag = ({ text, icon, tone = 'neutral', style }: { text: string; icon?: IconName; tone?: 'neutral' | 'accent' | 'warm' | 'gold' | 'dark'; style?: StyleProp<ViewStyle> }) => {
  const t = TONES[tone];
  return (
    <View style={[s.tag, { backgroundColor: t[0] }, style]}>
      {icon && <Icon name={icon} size={13} color={t[1]} />}
      <Text style={{ color: t[1], fontSize: 12, fontWeight: '700' }}>{text}</Text>
    </View>
  );
};
const TONES = {
  neutral: [C.sunken, C.ink], accent: [C.accentSoft, C.accentDark], warm: [C.warmSoft, C.warm], gold: [C.goldSoft, C.gold], dark: ['rgba(22,32,28,0.82)', '#fff'],
} as const;

export function Photo({ listing, style, rounded = R.lg, tag = true }: { listing: Pick<Listing, 'photos' | 'category' | 'status'> & { price?: number }; style?: StyleProp<ViewStyle>; rounded?: number; tag?: boolean }) {
  const url = listing.photos?.[0];
  return (
    <View style={[s.photo, { borderRadius: rounded }, style]}>
      {url ? (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <Icon name={categoryIcon(listing.category)} size={44} color={C.accent} />
      )}
      {tag && (
        <View style={{ position: 'absolute', left: 8, top: 8, gap: 4, alignItems: 'flex-start' }}>
          {listing.status === 'sold' && <Tag text="Sold" tone="dark" />}
          {listing.status === 'reserved' && <Tag text="Reserved" icon="clock-outline" tone="gold" />}
          {listing.status === 'active' && listing.price === 0 && <Tag text="Free" icon="gift-outline" tone="warm" />}
        </View>
      )}
    </View>
  );
}

export function ListingCard({ item, width }: { item: Listing; width: number }) {
  return (
    <Pressable onPress={() => router.push(`/item/${item.id}`)} style={({ pressed }) => [{ width }, pressed && { opacity: 0.85 }]}
      accessibilityRole="link" accessibilityLabel={`${item.title}, ${price(item.price)}`}>
      <Photo listing={item} style={{ width, height: width * 1.08 }} />
      <View style={{ paddingTop: 9, paddingHorizontal: 2, gap: 3 }}>
        <Text style={s.price}>{price(item.price)}</Text>
        <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Icon name="map-marker-outline" size={13} color={C.faint} />
          <Text style={s.meta} numberOfLines={1}>{distance(item.distance_miles)} · {item.area}</Text>
        </View>
        <LangTags langs={item.seller_languages} max={2} />
      </View>
    </Pressable>
  );
}

export function ListingRow({ item, last }: { item: Listing; last?: boolean }) {
  return (
    <Pressable onPress={() => router.push(`/item/${item.id}`)} style={({ pressed }) => [s.row, last && { borderBottomWidth: 0 }, pressed && { opacity: 0.8 }]}>
      <Photo listing={item} style={{ width: 84, height: 84 }} rounded={R.md} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.price, { fontSize: 17 }]}>{price(item.price)}</Text>
        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Text style={s.meta}>{distance(item.distance_miles)} · {item.area}</Text>
          <LangTags langs={item.seller_languages} max={2} />
        </View>
      </View>
      <Icon name="chevron-right" size={20} color={C.faint} />
    </Pressable>
  );
}

/** A friendly empty state with an icon and an optional next step. */
export const Empty = ({ title, text, icon = 'magnify', action }: { title: string; text: string; icon?: IconName; action?: { title: string; onPress: () => void } }) => (
  <View style={{ paddingVertical: 40, paddingHorizontal: 32, alignItems: 'center' }}>
    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
      <Icon name={icon} size={32} color={C.accent} />
    </View>
    <Text style={[s.h3, { textAlign: 'center', marginBottom: 6 }]}>{title}</Text>
    <Text style={{ color: C.muted, textAlign: 'center', lineHeight: 21, fontSize: 14.5, maxWidth: 320 }}>{text}</Text>
    {action && <Button title={action.title} small kind="soft" onPress={action.onPress} style={{ marginTop: 16 }} />}
  </View>
);

export const Note = ({ icon, children, tone = 'plain' }: { icon: IconName; children: ReactNode; tone?: 'plain' | 'accent' | 'warm' }) => (
  <View style={[s.note, tone === 'accent' && { backgroundColor: C.accentSoft, borderColor: C.accentSoft }, tone === 'warm' && { backgroundColor: C.warmSoft, borderColor: C.warmSoft }]}>
    <View style={[s.noteIcon, tone !== 'plain' && { backgroundColor: C.surface }]}>
      <Icon name={icon} size={18} color={tone === 'warm' ? C.warm : C.accent} />
    </View>
    <Text style={{ flex: 1, color: C.muted, fontSize: 13.5, lineHeight: 19.5 }}>{children}</Text>
  </View>
);

/** A row in a settings-style list. */
export const ListLink = ({ icon, label, value, onPress, danger, last }: { icon: IconName; label: string; value?: string; onPress?: () => void; danger?: boolean; last?: boolean }) => (
  <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.listLink, last && { borderBottomWidth: 0 }, pressed && { opacity: 0.7 }]}>
    <View style={[s.noteIcon, { backgroundColor: danger ? C.dangerSoft : C.sunken }]}>
      <Icon name={icon} size={18} color={danger ? C.danger : C.ink} />
    </View>
    <Text style={[s.p, { flex: 1 }, danger && { color: C.danger }]}>{label}</Text>
    {value ? <Text style={[s.p, { color: C.muted, flexShrink: 1 }]} numberOfLines={1}>{value}</Text> : null}
    {onPress && !danger ? <Icon name="chevron-right" size={20} color={C.faint} /> : null}
  </Pressable>
);

export const Loading = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <ActivityIndicator color={C.accent} />
  </View>
);

/** Grey placeholder cards shown while the feed loads. */
export const CardSkeletons = ({ width, count = 4 }: { width: number; count?: number }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 }}>
    {Array.from({ length: count }, (_, i) => (
      <View key={i} style={{ width, gap: 8, marginBottom: 8 }}>
        <View style={{ width, height: width * 1.08, borderRadius: R.lg, backgroundColor: C.sunken }} />
        <View style={{ width: width * 0.35, height: 14, borderRadius: 4, backgroundColor: C.sunken }} />
        <View style={{ width: width * 0.8, height: 12, borderRadius: 4, backgroundColor: C.sunken }} />
      </View>
    ))}
  </View>
);

const display: TextStyle = { fontFamily: FONT };

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  pad: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  h1: { ...display, fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.6 },
  h2: { ...display, fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  h3: { ...display, fontSize: 16.5, fontWeight: '700', color: C.ink, letterSpacing: -0.2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: R.md + 2, minHeight: 50, paddingVertical: 13, paddingHorizontal: 20 },
  btnSmall: { minHeight: 38, paddingVertical: 8, paddingHorizontal: 14, borderRadius: R.md - 1 },
  btnText: { ...display, fontWeight: '700', fontSize: 15.5, letterSpacing: -0.1 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: R.pill, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { fontSize: 13.5, fontWeight: '600', color: C.ink },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: C.muted, marginTop: 22, marginBottom: 10 },
  fieldLabel: { fontSize: 13.5, fontWeight: '700', color: C.ink },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.md, minHeight: 50, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15.5, color: C.ink },
  hint: { fontSize: 12.5, color: C.muted, lineHeight: 18 },
  error: { fontSize: 13, color: C.danger, fontWeight: '600' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.verifySoft, borderRadius: R.pill, paddingVertical: 4, paddingHorizontal: 9, alignSelf: 'flex-start' },
  lc: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.4, backgroundColor: C.sunken, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1.5, color: C.muted, overflow: 'hidden' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: R.sm, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  photo: { backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  price: { ...display, fontSize: 17, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  title: { fontSize: 14, color: C.ink, lineHeight: 19 },
  meta: { fontSize: 12.5, color: C.muted },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: 'center' },
  note: { flexDirection: 'row', gap: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.md + 2, padding: 12, alignItems: 'center' },
  noteIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: C.surface, borderRadius: R.lg + 2, borderWidth: 1, borderColor: C.line },
  box: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, paddingHorizontal: 14 },
  listLink: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  p: { fontSize: 14.5, lineHeight: 21, color: C.ink },
});
