import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** False until the Supabase keys are added to the .env file. */
export const isConfigured = url.startsWith('https://') && key.length > 20;

export const supabase = createClient(url || 'https://not-configured.supabase.co', key || 'not-configured', {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

export const PHOTO_BUCKET = 'listing-photos';
