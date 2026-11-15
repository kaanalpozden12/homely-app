import { Platform } from 'react-native';

/** Brand colours. Warm, calm and trustworthy: a deep green, a warm off-white and a terracotta highlight. */
export const C = {
  bg: '#F7F5F0', // warm off-white page
  surface: '#FFFFFF', // cards
  sunken: '#EFECE5', // inputs, skeletons, quiet panels
  ink: '#16201C', // main text
  muted: '#5E6B66', // secondary text
  faint: '#8E9893', // placeholders, captions
  line: '#E6E1D7', // borders
  accent: '#0F6B57', // brand green
  accentDark: '#0A4F40',
  accentInk: '#FFFFFF',
  accentSoft: '#E2EFE9',
  warm: '#D4673C', // terracotta highlight: "Free", new
  warmSoft: '#FBEBE3',
  gold: '#B7791F',
  goldSoft: '#FBF1DF',
  verify: '#2457C5',
  verifySoft: '#E6EDFB',
  danger: '#B93A2A',
  dangerSoft: '#FBE8E5',
};

/** Corner radii. */
export const R = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

/** Spacing scale (4-point). */
export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** Brand typeface for headings and prices. On the web it is loaded in public/index.html; phones use the system font. */
export const FONT = Platform.select({ web: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', default: undefined });

/** Soft shadow for raised cards and sheets. */
export const shadow = (level: 1 | 2 = 1) =>
  Platform.select({
    web: { boxShadow: level === 1 ? '0 1px 2px rgba(22,32,28,0.06), 0 2px 8px rgba(22,32,28,0.05)' : '0 8px 30px rgba(22,32,28,0.12)' } as object,
    default: { shadowColor: '#16201C', shadowOpacity: level === 1 ? 0.06 : 0.14, shadowRadius: level === 1 ? 6 : 18, shadowOffset: { width: 0, height: level === 1 ? 2 : 8 }, elevation: level === 1 ? 2 : 8 },
  });
