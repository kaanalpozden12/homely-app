// GET /api/keepalive — run once a day by Vercel Cron (see vercel.json).
// Supabase's free plan pauses a project after about a week without any use, which takes the whole app
// offline. This tiny daily read keeps it awake. It only reads the public app_settings row.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://onukvcqeocqfvyojodzy.supabase.co';
const PUBLIC_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_lzZRn2IR7UX9ekleo0oZHA_NcqNGXE2';

export async function GET() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?select=id&limit=1`, {
    headers: { apikey: PUBLIC_KEY, Authorization: `Bearer ${PUBLIC_KEY}` },
  });
  return new Response(JSON.stringify({ ok: r.ok, status: r.status }), {
    status: r.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
