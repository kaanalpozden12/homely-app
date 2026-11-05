# Homely

A simple second-hand marketplace for London. Neighbours sell furniture and household items to each other,
filter sellers by the languages they speak, chat, and meet to pick up and pay in person.

Built with [Expo](https://expo.dev) (one codebase for web, Android and iPhone) and
[Supabase](https://supabase.com) (database, sign-in, photo storage and live chat).

## What's in the app

- **Sign in** with an email code (no passwords).
- **Profile**: first name, neighbourhood, languages spoken, optional phone and Instagram (kept private).
- **Home**: listings near your postcode, filtered by seller language and category, plus a Free filter.
- **Search**: keyword, postcode, distance (1, 2, 3, 5 miles or any), language, category, sort.
- **Sell**: up to 5 photos, title, price, category, condition, description, hygiene checklist, pickup postcode.
  Only ID-verified sellers can post (see `REQUIRE_ID_TO_SELL` in `src/lib/constants.ts`).
- **Item page**: photos, details, rounded distance, seller, message button, report.
- **Chat**: live messages, quick replies, Share contact (phone and/or Instagram, only when you choose).
- **Safety**: report listings or people, block people, delete your account, terms and privacy page.

Privacy: a seller's exact postcode is stored but can never be read by other users. Buyers only see
the first half of the postcode (like SW3) and a distance rounded to the nearest half mile.

## One-time setup

### 1. Create the database (Supabase, free)

1. Sign up at [supabase.com](https://supabase.com) and create a new project. Choose the London region.
2. Open **SQL Editor**, click **New query**, paste everything from [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. Open **Authentication > Emails > Templates > Magic link** (sometimes called "Magic Link or OTP").
   Replace the message with something like:
   `Your Homely sign-in code is {{ .Token }}`
   The app asks for this 6-digit code.
4. **Important for real users:** Supabase's built-in email only reaches your own team's addresses.
   Before inviting friends, connect a free email sender: create a free [Resend](https://resend.com) account,
   then fill in **Authentication > Emails > SMTP settings** with Resend's SMTP details.
5. Open **Project Settings > API** and copy the **Project URL** and the **anon public** key.

### 2. Run it on your computer (optional)

```bash
cp .env.example .env      # then paste the two values from step 1.5 into .env
npm install
npm run web               # opens the app in your browser
```

### 3. Put it online (Vercel, free)

1. Sign up at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New > Project**, import `homely-app`.
3. Under **Environment Variables** add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
4. Click **Deploy**. Vercel gives you a link like `homely-app.vercel.app`. Every change pushed to GitHub updates it.
5. Friends open the link on their phone and choose **Add to Home Screen**.

### 4. Verify a seller's ID (pilot)

After a short video call where you see the person's photo ID, open Supabase **Table Editor > profiles**,
find their row and tick **id_verified**. They can then post listings. Reports from users appear in the
**reports** table.

## For developers

- Screens live in `src/app` (Expo Router). Shared pieces in `src/components`, logic in `src/lib`.
- Listings are read through the `find_listings` database function so locations stay private.
- Checks: `npm run typecheck` and `npx expo lint`.
- App store builds later: `npx eas-cli@latest build` (see AGENTS.md).
