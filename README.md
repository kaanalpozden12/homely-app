# Loftrobin

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
  Anyone can post. To require an ID check before posting, tick `require_id_to_sell` in the `app_settings` table.
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
   `Your Loftrobin sign-in code is {{ .Token }}`
   The app asks for this 6-digit code.
4. **Important for real users:** Supabase's built-in email only reaches your own team's addresses.
   Before inviting friends, connect a free email sender: create a free [Resend](https://resend.com) account,
   then fill in **Authentication > Emails > SMTP settings** with Resend's SMTP details.
5. Open **Project Settings > API** and copy the **Project URL** and the **anon public** key.

The app already contains this project's URL and publishable key (`src/lib/supabase.ts`).
To use a different Supabase project, put its values in a `.env` file.

### 2. Run it on your computer (optional)

```bash
cp .env.example .env      # optional: only to point at a different Supabase project
npm install
npm run web               # opens the app in your browser
```

### 3. Put it online (Vercel, free)

1. Sign up at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New > Project**, import `homely-app`.
3. Click **Deploy**. Vercel gives you a link like `homely-app.vercel.app`. Every change pushed to GitHub updates it.
4. In Supabase, **Authentication > URL Configuration**: set **Site URL** to that link, so sign-in emails link back to the app.
5. Friends open the link on their phone and choose **Add to Home Screen**.

### 4. Update the database after an app update

Whenever `supabase/schema.sql` changes, open **SQL Editor > New query**, paste the whole file and click **Run**.
It is safe to run again: it keeps all users, listings and chats.

### 5. Google sign-in (one-time)

1. [Google Cloud Console](https://console.cloud.google.com) > new project "Homely" > **APIs & Services > OAuth consent screen**:
   External, app name Loftrobin, your email, then **Publish app**.
2. **Credentials > Create credentials > OAuth client ID**: type **Web application**. Under **Authorized redirect URIs** add
   `https://onukvcqeocqfvyojodzy.supabase.co/auth/v1/callback`. Copy the **Client ID** and **Client secret**.
3. Supabase > **Authentication > Sign In / Providers > Google**: switch on, paste both, **Save**.

Until this is done, the "Continue with Google" button shows a message asking people to use their email.

## Running Loftrobin day to day (all in Supabase > Table Editor)

| Task | Where |
| --- | --- |
| ID checks to do | **admin_id_check_requests** lists sellers who asked, with email, phone and Instagram. After the video call, open **profiles**, find the person and tick **id_verified**. |
| Reports | **admin_open_reports**. A listing reported by 3 different people is hidden automatically. To hide a listing yourself tick **listings.hidden**; to un-hide, untick it. When done, set the report's **status** to `resolved` in **reports**. |
| Ban someone | **profiles**: tick **banned**. Their listings disappear and they can no longer post, message or reserve. |
| Require an ID check before selling (off by default) | **app_settings**: tick **require_id_to_sell**. Give trusted sellers an "ID verified" badge by ticking **profiles.id_verified**. |
| Commission earned | **admin_commission_by_month**, or every reservation in **transactions**. |

## The commission (reservation fee)

Buyers tap **Reserve** on an item. The item is held for them and the seller is told in the chat. The buyer pays the item
price to the seller in person, and the seller taps **Mark as collected**. Every reservation is saved in the **transactions**
table with the commission charged.

- The fee is set in **app_settings > commission_pence**: `0` = free (launch), `150` = £1.50. No app update is needed.
- Fee refunded automatically if the seller cancels. Not refunded if the buyer cancels.
- A card payment page left unpaid for 30 minutes releases the item.

### Before setting the fee above 0 (one-time Stripe setup)

1. Create a [Stripe](https://dashboard.stripe.com/register) account (UK, individual / sole trader is fine) and finish its identity and bank checks.
2. Stripe > **Developers > API keys**: copy the **Secret key**.
3. Stripe > **Developers > Webhooks > Add endpoint**: URL `https://homely-london.vercel.app/api/stripe-webhook`, events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`. Copy the **Signing secret**.
4. Supabase > **Project Settings > API keys**: copy the **secret** (service_role) key. Never share it or put it in the app.
5. Vercel > homely project > **Settings > Environment Variables**, add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and
   `SUPABASE_SECRET_KEY`, then **Redeploy**.
6. Test once with Stripe's test keys and card `4242 4242 4242 4242`, then switch to the live keys.

If an automatic refund fails, **transactions.refund_status** shows `failed`: refund it in the Stripe dashboard and set it to `refunded`.

## Look and brand

- Colours, corner sizes and spacing: `src/lib/theme.ts`. Shared buttons, cards, chips and empty states: `src/components/ui.tsx`.
- Typeface: Plus Jakarta Sans on the website (loaded in `public/index.html`); phones use the system font.
- **Changing the name:** edit `src/lib/brand.ts` (name, logo text, tagline). Then also update `app.json` (name, slug, scheme),
  `public/index.html` (title and link previews), `public/manifest.json`, the terms and privacy text in
  `src/components/terms-text.tsx`, and the icons in `public/` and `assets/images/`.
- Before and after screenshots of the redesign: `docs/design/`.

## For developers

- Screens live in `src/app` (Expo Router). Shared pieces in `src/components`, logic in `src/lib`.
- Listings are read through the `find_listings` database function so locations stay private.
  Pickup points are snapped to a ~550 m grid when saved.
- Reservations go through database functions (`reserve_listing`, `complete_transaction`, `cancel_transaction`).
  The small payment server for card fees is in `api/` (Vercel Functions, Stripe Checkout + webhook).
- Checks: `npm run typecheck` and `npx expo lint`.
- App store builds later: `npx eas-cli@latest build` (see AGENTS.md).
