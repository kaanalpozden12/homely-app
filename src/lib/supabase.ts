import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// The project URL and publishable key are designed to be public (the database is protected by
// row level security), so they are kept here. A .env file can override them for testing.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://onukvcqeocqfvyojodzy.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_lzZRn2IR7UX9ekleo0oZHA_NcqNGXE2';

/** False until the Supabase keys are added to the .env file. */
export const isConfigured = url.startsWith('https://') && key.length > 20;

export const supabase = createClient(url || 'https://not-configured.supabase.co', key || 'not-configured', {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: Platform.OS === 'web' },
});

export const PHOTO_BUCKET = 'listing-photos';
