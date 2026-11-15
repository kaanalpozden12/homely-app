-- Homely database schema for Supabase.
-- Run this in the Supabase dashboard: SQL Editor > New query > paste everything > Run.
-- It is safe to run again on an existing project: it only adds what is missing and
-- recreates the functions, rules and triggers. No listings, chats or users are deleted.

-- ---------- Tables ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  area text not null default '' check (char_length(area) <= 40),
  languages text[] not null default '{}',
  id_verified boolean not null default false,  -- set by an admin after the ID check
  created_at timestamptz not null default now()
);
-- Set by an admin (Table Editor > profiles) to stop someone posting, messaging or reserving.
alter table public.profiles add column if not exists banned boolean not null default false;
-- When the person tapped "Request ID check" on the Sell screen.
alter table public.profiles add column if not exists id_check_requested_at timestamptz;

-- Phone and Instagram are private: only the owner can read them.
-- They reach another person only when the owner taps "Share contact" in a chat.
create table if not exists public.profile_contacts (
  id uuid primary key references public.profiles (id) on delete cascade,
  phone text not null default '' check (char_length(phone) <= 30),
  instagram text not null default '' check (char_length(instagram) <= 40)
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  price integer not null check (price between 0 and 100000),  -- whole pounds, 0 = free
  category text not null,
  condition text not null,
  description text not null default '' check (char_length(description) <= 2000),
  hygiene text[] not null default '{}',
  area text not null default '',            -- public, e.g. "SW3"
  lat double precision not null,            -- private: never readable by users
  lng double precision not null,            -- private: never readable by users
  photos text[] not null default '{}',      -- public URLs in the listing-photos bucket
  status text not null default 'active',
  created_at timestamptz not null default now()
);
-- Hidden by moderation: an admin ticks it, or it happens automatically after 3 reports.
alter table public.listings add column if not exists hidden boolean not null default false;
-- 'reserved' = a buyer reserved it through the app (see transactions).
alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings add constraint listings_status_check check (status in ('active', 'reserved', 'sold'));
alter table public.listings drop constraint if exists listings_photos_check;
alter table public.listings add constraint listings_photos_check check (cardinality(photos) <= 5);
create index if not exists listings_status_created on public.listings (status, created_at desc);
create index if not exists listings_seller on public.listings (seller_id, created_at desc);
create index if not exists listings_lat on public.listings (lat);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  buyer_read_at timestamptz not null default now(),
  seller_read_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);
create index if not exists conversations_buyer on public.conversations (buyer_id, created_at desc);
create index if not exists conversations_seller on public.conversations (seller_id);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'text',
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
-- 'system' messages are written by the app itself (for example "Item reserved").
alter table public.messages drop constraint if exists messages_kind_check;
alter table public.messages add constraint messages_kind_check check (kind in ('text', 'contact', 'system'));
create index if not exists messages_conv on public.messages (conversation_id, created_at);
create index if not exists messages_sender on public.messages (sender_id, created_at desc);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);
-- For the admin: change to 'resolved' once a report has been dealt with.
alter table public.reports add column if not exists status text not null default 'open';
alter table public.reports add column if not exists admin_note text not null default '';
create index if not exists reports_reporter on public.reports (reporter_id, created_at desc);
create index if not exists reports_listing on public.reports (listing_id);

-- One row of settings the admin can change in Table Editor > app_settings, no new app release needed.
create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  commission_pence integer not null default 0 check (commission_pence between 0 and 10000), -- 150 = £1.50, 0 = free
  require_id_to_sell boolean not null default false,  -- true = only ID-checked people can post
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- Every reservation and sale made through the app, with the commission Homely charged.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  buyer_id uuid references public.profiles (id) on delete set null,
  seller_id uuid references public.profiles (id) on delete set null,
  item_title text not null,                       -- copied so records survive deleted listings
  item_price integer not null,                     -- whole pounds, paid to the seller in person
  commission_pence integer not null default 0,     -- what Homely charged the buyer, 150 = £1.50
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'reserved', 'completed', 'cancelled', 'expired')),
  cancelled_by text check (cancelled_by in ('buyer', 'seller', 'admin', 'system')),
  refund_status text not null default 'none' check (refund_status in ('none', 'pending', 'refunded', 'failed')),
  stripe_session_id text unique,
  stripe_payment_intent text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  reserved_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);
-- Only one open reservation per item at a time.
create unique index if not exists transactions_one_open on public.transactions (listing_id)
  where status in ('awaiting_payment', 'reserved');
create index if not exists transactions_buyer on public.transactions (buyer_id, created_at desc);
create index if not exists transactions_seller on public.transactions (seller_id, created_at desc);

-- ---------- Helpers ----------

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

-- True if the account exists and has not been banned.
create or replace function public.is_active_user(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = u and not banned);
$$;

-- True if this person may post listings (not banned, and ID checked when the setting requires it).
create or replace function public.can_sell(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = u and not p.banned
    and (p.id_verified or not coalesce((select require_id_to_sell from app_settings where id = 1), false)));
$$;

-- ---------- Table access ----------
-- Newer Supabase projects do not give the app access to new tables automatically, so it is listed here.
-- Row level security (below) then limits which rows each person can see or change.
grant usage on schema public to anon, authenticated;
revoke all on public.profiles, public.profile_contacts, public.listings, public.conversations,
  public.messages, public.blocks, public.reports, public.app_settings, public.transactions from anon;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.profile_contacts to authenticated;
grant delete on public.listings to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update, delete on public.blocks to authenticated;
grant select on public.app_settings to anon, authenticated;
grant select on public.transactions to authenticated;
grant usage on all sequences in schema public to authenticated;
-- Only these columns can be filled in by the app; everything else is set by the database or an admin.
revoke insert, update on public.listings from authenticated;
grant insert (seller_id, title, price, category, condition, description, hygiene, area, lat, lng, photos)
  on public.listings to authenticated;
grant update (title, price, category, condition, description, hygiene, area, lat, lng, photos, status)
  on public.listings to authenticated;
revoke insert, update on public.reports from authenticated;
grant insert (reporter_id, listing_id, reported_user_id, reason) on public.reports to authenticated;
revoke insert, update, delete on public.app_settings, public.transactions from authenticated;

-- ---------- Row level security ----------

alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.app_settings enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "profiles readable by signed-in users" on public.profiles;
create policy "profiles readable by signed-in users" on public.profiles
  for select to authenticated using (true);
drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Users cannot mark themselves as ID verified or unban themselves.
revoke update on public.profiles from authenticated;
grant update (name, area, languages) on public.profiles to authenticated;
revoke insert on public.profiles from authenticated;
grant insert (id, name, area, languages) on public.profiles to authenticated;

drop policy if exists "own contacts" on public.profile_contacts;
create policy "own contacts" on public.profile_contacts
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Listings are read through find_listings() so that lat/lng stay hidden.
revoke select on public.listings from anon, authenticated;
grant select (id, seller_id, title, price, category, condition, description, hygiene,
              area, photos, status, created_at) on public.listings to authenticated;
drop policy if exists "listings readable" on public.listings;
create policy "listings readable" on public.listings
  for select to authenticated using (not hidden or seller_id = auth.uid());
drop policy if exists "create own listing" on public.listings;
create policy "create own listing" on public.listings
  for insert to authenticated with check (seller_id = auth.uid() and public.can_sell(auth.uid()));
drop policy if exists "update own listing" on public.listings;
create policy "update own listing" on public.listings
  for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());
drop policy if exists "delete own listing" on public.listings;
create policy "delete own listing" on public.listings
  for delete to authenticated using (seller_id = auth.uid());

drop policy if exists "participants read conversations" on public.conversations;
create policy "participants read conversations" on public.conversations
  for select to authenticated using (auth.uid() in (buyer_id, seller_id));
drop policy if exists "buyer starts conversation" on public.conversations;
create policy "buyer starts conversation" on public.conversations
  for insert to authenticated with check (
    buyer_id = auth.uid()
    and public.is_active_user(auth.uid())
    and seller_id = (select l.seller_id from listings l where l.id = listing_id)
    and not public.is_blocked_between(buyer_id, seller_id));
revoke update on public.conversations from authenticated;

drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages" on public.messages
  for select to authenticated using (exists (
    select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));
drop policy if exists "participants send messages" on public.messages;
create policy "participants send messages" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and kind in ('text', 'contact')
    and public.is_active_user(auth.uid())
    and exists (select 1 from conversations c where c.id = conversation_id
                and auth.uid() in (c.buyer_id, c.seller_id)
                and not public.is_blocked_between(c.buyer_id, c.seller_id)));

drop policy if exists "own blocks" on public.blocks;
create policy "own blocks" on public.blocks
  for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

drop policy if exists "file reports" on public.reports;
create policy "file reports" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists "settings readable" on public.app_settings;
create policy "settings readable" on public.app_settings for select to anon, authenticated using (true);

drop policy if exists "participants read transactions" on public.transactions;
create policy "participants read transactions" on public.transactions
  for select to authenticated using (auth.uid() in (buyer_id, seller_id));

-- ---------- Triggers ----------

create or replace function public.on_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations set last_message_at = new.created_at,
    buyer_read_at = case when buyer_id = new.sender_id then new.created_at else buyer_read_at end,
    seller_read_at = case when seller_id = new.sender_id then new.created_at else seller_read_at end
  where id = new.conversation_id;
  return new;
end $$;
drop trigger if exists message_insert on public.messages;
create trigger message_insert after insert on public.messages
  for each row execute function public.on_message_insert();

-- Spam limits. Normal people never reach these; bots and spammers do.
create or replace function public.limit_messages()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'system' then return new; end if;
  if (select count(*) from messages where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 20
     or (select count(*) from messages where sender_id = new.sender_id and created_at > now() - interval '1 day') >= 1000 then
    raise exception 'You are sending messages too quickly. Please wait a moment and try again.';
  end if;
  return new;
end $$;
drop trigger if exists limit_messages on public.messages;
create trigger limit_messages before insert on public.messages
  for each row execute function public.limit_messages();

create or replace function public.limit_conversations()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from conversations where buyer_id = new.buyer_id and created_at > now() - interval '1 day') >= 40 then
    raise exception 'You have started a lot of chats today. Please try again tomorrow.';
  end if;
  return new;
end $$;
drop trigger if exists limit_conversations on public.conversations;
create trigger limit_conversations before insert on public.conversations
  for each row execute function public.limit_conversations();

create or replace function public.limit_reports()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from reports where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You have sent a lot of reports today. Please try again tomorrow.';
  end if;
  return new;
end $$;
drop trigger if exists limit_reports on public.reports;
create trigger limit_reports before insert on public.reports
  for each row execute function public.limit_reports();

-- A listing reported by 3 different people is hidden until an admin looks at it.
create or replace function public.auto_hide_reported()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.listing_id is not null
     and (select count(distinct reporter_id) from reports where listing_id = new.listing_id) >= 3 then
    update listings set hidden = true where id = new.listing_id;
  end if;
  return new;
end $$;
drop trigger if exists auto_hide_reported on public.reports;
create trigger auto_hide_reported after insert on public.reports
  for each row execute function public.auto_hide_reported();

-- Listing safety. Runs with the caller's rights so it can tell the app apart from the database's own functions.
create or replace function public.listings_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  -- Snap the pickup point to a grid of roughly 550 metres. Distances shown to buyers are rounded anyway,
  -- and this makes it impossible to work out a seller's home by searching from many places.
  if tg_op <> 'DELETE' then
    new.lat := round(new.lat::numeric * 200) / 200;
    new.lng := round(new.lng::numeric * 125) / 125;
  end if;
  if current_user not in ('authenticated', 'anon') then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'INSERT' then
    if (select count(*) from listings where seller_id = new.seller_id and created_at > now() - interval '1 day') >= 15 then
      raise exception 'You can post up to 15 items a day. Please try again tomorrow.';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.status = 'reserved' and old.status <> 'reserved' then
      raise exception 'Items are reserved by buyers through the Reserve button.';
    end if;
    if old.status = 'reserved' and new.status <> 'reserved' then
      raise exception 'This item is reserved. Mark it as collected or cancel the reservation first.';
    end if;
  elsif tg_op = 'DELETE' then
    if old.status = 'reserved' then
      raise exception 'This item is reserved. Cancel the reservation before deleting it.';
    end if;
    return old;
  end if;
  return new;
end $$;
drop trigger if exists listings_guard on public.listings;
create trigger listings_guard before insert or update or delete on public.listings
  for each row execute function public.listings_guard();
-- Snap the locations of listings posted before this rule existed.
update public.listings set lat = round(lat::numeric * 200) / 200, lng = round(lng::numeric * 125) / 125
  where lat <> round(lat::numeric * 200) / 200 or lng <> round(lng::numeric * 125) / 125;

-- ---------- Functions the app calls ----------

-- Search listings. Distance is rounded to the nearest half mile; exact location never leaves the database.
drop function if exists public.find_listings;
create or replace function public.find_listings(
  p_lat double precision, p_lng double precision,
  p_radius double precision default null,   -- miles, null = any distance
  p_languages text[] default null,          -- seller speaks any of these
  p_category text default null,             -- null = all, 'Free' = price 0
  p_query text default null,
  p_sort text default 'near',               -- near | new | cheap
  p_seller uuid default null,
  p_id uuid default null,
  p_include_sold boolean default false,
  p_limit integer default 60
) returns table (
  id uuid, seller_id uuid, title text, price integer, category text, condition text,
  description text, hygiene text[], area text, photos text[], status text, created_at timestamptz,
  distance_miles double precision,
  seller_name text, seller_area text, seller_languages text[], seller_verified boolean
) language sql stable security definer set search_path = public as $$
  with base as (
    select l.*, p.name as s_name, p.area as s_area, p.languages as s_langs, p.id_verified as s_verified,
      3958.8 * 2 * asin(sqrt(
        power(sin(radians(l.lat - p_lat) / 2), 2) +
        cos(radians(p_lat)) * cos(radians(l.lat)) * power(sin(radians(l.lng - p_lng) / 2), 2))) as d
    from listings l join profiles p on p.id = l.seller_id
    where (p_include_sold or l.status = 'active' or l.seller_id = auth.uid())
      and ((not l.hidden and not p.banned) or l.seller_id = auth.uid())
      and (p_id is null or l.id = p_id)
      and (p_seller is null or l.seller_id = p_seller)
      and (p_radius is null or l.lat between p_lat - p_radius / 68.0 and p_lat + p_radius / 68.0)
      and (p_category is null or (p_category = 'Free' and l.price = 0) or l.category = p_category)
      and (p_languages is null or cardinality(p_languages) = 0 or p.languages && p_languages)
      and (p_query is null or p_query = '' or
           (l.title || ' ' || l.category || ' ' || l.description) ilike '%' || p_query || '%')
      and (auth.uid() is null or not public.is_blocked_between(auth.uid(), l.seller_id))
  )
  select b.id, b.seller_id, b.title, b.price, b.category, b.condition, b.description, b.hygiene,
    b.area, b.photos, b.status, b.created_at,
    greatest(0.5, round(b.d * 2) / 2) as distance_miles,
    b.s_name, b.s_area, b.s_langs, b.s_verified
  from base b
  where p_radius is null or b.d <= p_radius
  order by
    case when p_sort = 'near' then b.d end asc,
    case when p_sort = 'cheap' then b.price end asc,
    b.created_at desc
  limit greatest(1, least(coalesce(p_limit, 60), 200));
$$;
revoke execute on function public.find_listings from anon;
grant execute on function public.find_listings to authenticated;

-- Mark a conversation as read by the current user.
create or replace function public.mark_read(p_conversation uuid)
returns void language sql security definer set search_path = public as $$
  update conversations set
    buyer_read_at = case when buyer_id = auth.uid() then now() else buyer_read_at end,
    seller_read_at = case when seller_id = auth.uid() then now() else seller_read_at end
  where id = p_conversation and auth.uid() in (buyer_id, seller_id);
$$;
revoke execute on function public.mark_read from anon;
grant execute on function public.mark_read to authenticated;

-- ---------- Reservations and commission ----------
-- How it works: a buyer taps Reserve. If the commission (app_settings.commission_pence) is 0, the item is
-- reserved straight away. Otherwise the buyer pays the commission by card (Stripe) and the item is reserved
-- once Stripe confirms the payment. The buyer pays the item price to the seller in person at pickup.
-- The seller then marks it as collected (completed) or either side cancels.

-- Internal: put a transaction into the "reserved" state and tell both people in their chat.
create or replace function public._reserve(p_tx uuid)
returns public.transactions language plpgsql security definer set search_path = public as $$
declare t transactions;
begin
  update transactions set status = 'reserved', reserved_at = now(),
    paid_at = case when commission_pence > 0 then coalesce(paid_at, now()) else paid_at end
  where id = p_tx returning * into t;
  update listings set status = 'reserved' where id = t.listing_id;
  insert into messages (conversation_id, sender_id, kind, body)
  values (t.conversation_id, t.buyer_id, 'system',
    'Item reserved. Arrange a pickup time here, check the item, then pay £' || t.item_price || ' to the seller in person.');
  return t;
end $$;

-- Buyer taps Reserve. Returns the transaction; status 'awaiting_payment' means the app should open card payment.
create or replace function public.reserve_listing(p_listing uuid)
returns public.transactions language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  l listings;
  t transactions;
  fee integer;
  conv uuid;
begin
  if me is null then raise exception 'Please sign in first.'; end if;
  if not is_active_user(me) then raise exception 'Your account cannot reserve items. Contact Homely for help.'; end if;
  select * into l from listings where id = p_listing for update;
  if not found or l.hidden then raise exception 'This item is no longer available.'; end if;
  if l.seller_id = me then raise exception 'This is your own item.'; end if;
  if is_blocked_between(me, l.seller_id) or not is_active_user(l.seller_id) then
    raise exception 'You can no longer contact this seller.';
  end if;

  -- Card payments left unfinished for 30 minutes no longer hold the item.
  update transactions set status = 'expired', cancelled_at = now(), cancelled_by = 'system'
  where listing_id = l.id and status = 'awaiting_payment' and created_at < now() - interval '30 minutes';

  select * into t from transactions where listing_id = l.id and status in ('awaiting_payment', 'reserved');
  if found then
    if t.buyer_id = me then return t; end if;
    raise exception 'Someone else has just reserved this item.';
  end if;
  if l.status <> 'active' then raise exception 'This item is no longer available.'; end if;
  if (select count(*) from transactions where buyer_id = me and status = 'reserved') >= 5 then
    raise exception 'You already have 5 items reserved. Collect or cancel one first.';
  end if;
  if (select count(*) from transactions where buyer_id = me and created_at > now() - interval '1 day') >= 15 then
    raise exception 'You have reserved a lot of items today. Please try again tomorrow.';
  end if;

  select id into conv from conversations where listing_id = l.id and buyer_id = me;
  if conv is null then
    insert into conversations (listing_id, buyer_id, seller_id) values (l.id, me, l.seller_id) returning id into conv;
  end if;

  fee := coalesce((select commission_pence from app_settings where id = 1), 0);
  insert into transactions (listing_id, conversation_id, buyer_id, seller_id, item_title, item_price, commission_pence, status)
  values (l.id, conv, me, l.seller_id, l.title, l.price, fee, 'awaiting_payment')
  returning * into t;
  if fee = 0 then t := _reserve(t.id); end if;
  return t;
end $$;

-- Seller confirms the buyer collected the item. The listing becomes sold.
create or replace function public.complete_transaction(p_tx uuid)
returns public.transactions language plpgsql security definer set search_path = public as $$
declare t transactions;
begin
  select * into t from transactions where id = p_tx for update;
  if not found or t.seller_id is distinct from auth.uid() then raise exception 'Only the seller can do this.'; end if;
  if t.status <> 'reserved' then raise exception 'This reservation is no longer open.'; end if;
  update transactions set status = 'completed', completed_at = now() where id = p_tx returning * into t;
  update listings set status = 'sold' where id = t.listing_id;
  insert into messages (conversation_id, sender_id, kind, body)
  values (t.conversation_id, t.seller_id, 'system', 'Collected. Thanks for using Homely!');
  return t;
end $$;

-- Buyer or seller cancels a reservation. The item goes back on sale.
-- If the buyer paid the commission and the seller cancels, the commission is refunded (refund_status = 'pending'
-- until the app's payment server has sent the money back).
create or replace function public.cancel_transaction(p_tx uuid)
returns public.transactions language plpgsql security definer set search_path = public as $$
declare t transactions; who text;
begin
  select * into t from transactions where id = p_tx for update;
  if not found or auth.uid() is null or auth.uid() not in (t.buyer_id, t.seller_id) then
    raise exception 'You cannot change this reservation.';
  end if;
  if t.status not in ('awaiting_payment', 'reserved') then raise exception 'This reservation is no longer open.'; end if;
  who := case when auth.uid() = t.seller_id then 'seller' else 'buyer' end;
  update transactions set status = 'cancelled', cancelled_at = now(), cancelled_by = who,
    refund_status = case when who = 'seller' and paid_at is not null and commission_pence > 0 then 'pending' else refund_status end
  where id = p_tx returning * into t;
  update listings set status = 'active' where id = t.listing_id and status = 'reserved';
  if t.reserved_at is not null then
    insert into messages (conversation_id, sender_id, kind, body)
    values (t.conversation_id, auth.uid(), 'system',
      case when who = 'seller' then 'The seller cancelled the reservation.' else 'The buyer cancelled the reservation.' end
      || case when t.refund_status = 'pending' then ' The Homely fee will be refunded to the buyer''s card.' else '' end);
  end if;
  return t;
end $$;

-- Used only by the payment server (it holds the secret service key).
create or replace function public.attach_checkout(p_tx uuid, p_session text)
returns void language sql security definer set search_path = public as $$
  update transactions set stripe_session_id = p_session where id = p_tx and status = 'awaiting_payment';
$$;

-- Used only by the payment server when Stripe confirms the card payment.
-- Returns the transaction; refund_status 'pending' means the item was taken meanwhile and the money must go back.
create or replace function public.confirm_payment(p_session text, p_payment_intent text)
returns public.transactions language plpgsql security definer set search_path = public as $$
declare t transactions; l listings;
begin
  select * into t from transactions where stripe_session_id = p_session for update;
  if not found then raise exception 'Unknown checkout session'; end if;
  if t.paid_at is not null then return t; end if;  -- Stripe can send the same event twice
  update transactions set paid_at = now(), stripe_payment_intent = p_payment_intent where id = t.id returning * into t;
  select * into l from listings where id = t.listing_id for update;
  if t.status = 'awaiting_payment' then
    return _reserve(t.id);
  end if;
  -- Paid after the 30 minute hold ran out: reserve it if still free, otherwise refund.
  if t.status = 'expired' and l.id is not null and l.status = 'active' and not l.hidden
     and not exists (select 1 from transactions where listing_id = l.id and status in ('awaiting_payment', 'reserved')) then
    return _reserve(t.id);
  end if;
  update transactions set status = 'cancelled', cancelled_by = 'system', cancelled_at = coalesce(cancelled_at, now()),
    refund_status = 'pending' where id = t.id returning * into t;
  return t;
end $$;

-- Used only by the payment server.
create or replace function public.set_refund_status(p_tx uuid, p_status text)
returns void language sql security definer set search_path = public as $$
  update transactions set refund_status = p_status where id = p_tx;
$$;

-- Used only by the payment server when a checkout page expires unpaid.
create or replace function public.expire_checkout(p_session text)
returns void language sql security definer set search_path = public as $$
  update transactions set status = 'expired', cancelled_at = now(), cancelled_by = 'system'
  where stripe_session_id = p_session and status = 'awaiting_payment';
$$;

revoke execute on function public._reserve, public.attach_checkout, public.confirm_payment,
  public.set_refund_status, public.expire_checkout from public, anon, authenticated;
grant execute on function public.attach_checkout, public.confirm_payment, public.set_refund_status,
  public.expire_checkout to service_role;
revoke execute on function public.reserve_listing, public.complete_transaction, public.cancel_transaction from public, anon;
grant execute on function public.reserve_listing, public.complete_transaction, public.cancel_transaction to authenticated;

-- Permanently delete the signed-in user's account and everything they posted.
-- Transaction records are kept (without the person) because they are financial records.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  update transactions set status = 'cancelled', cancelled_at = now(),
    cancelled_by = case when seller_id = me then 'seller' else 'buyer' end,
    refund_status = case when seller_id = me and paid_at is not null and commission_pence > 0 then 'pending' else refund_status end
  where me in (buyer_id, seller_id) and status in ('awaiting_payment', 'reserved');
  update listings set status = 'active'
  where status = 'reserved'
    and id in (select listing_id from transactions where me in (buyer_id, seller_id) and status = 'cancelled');
  -- The app removes the user's photos through the Storage API before calling this.
  delete from auth.users where id = me;
end $$;
revoke execute on function public.delete_my_account from anon;
grant execute on function public.delete_my_account to authenticated;

-- Seller asks for their one-time ID check. Appears in admin_id_check_requests.
create or replace function public.request_id_check()
returns void language sql security definer set search_path = public as $$
  update profiles set id_check_requested_at = now() where id = auth.uid() and not id_verified;
$$;
revoke execute on function public.request_id_check from public, anon;
grant execute on function public.request_id_check to authenticated;

-- Internal helpers are not callable from the app.
revoke execute on function public.is_blocked_between, public.is_active_user, public.can_sell from anon;

-- ---------- Admin views (only visible in the Supabase dashboard) ----------

create or replace view public.admin_open_reports as
  select r.id, r.created_at, r.reason, r.status,
    rp.name as reporter, r.listing_id, l.title as listing_title, l.hidden as listing_hidden,
    r.reported_user_id, u.name as reported_user, u.banned as reported_user_banned
  from reports r
  left join profiles rp on rp.id = r.reporter_id
  left join listings l on l.id = r.listing_id
  left join profiles u on u.id = r.reported_user_id
  where r.status = 'open'
  order by r.created_at desc;

create or replace view public.admin_commission_by_month as
  select date_trunc('month', coalesce(completed_at, reserved_at, created_at))::date as month,
    count(*) filter (where status = 'completed') as items_sold,
    count(*) filter (where status = 'reserved') as reserved_now,
    count(*) filter (where status = 'cancelled') as cancelled,
    sum(commission_pence) filter (where paid_at is not null and refund_status <> 'refunded') / 100.0 as commission_gbp,
    sum(item_price) filter (where status = 'completed') as items_value_gbp
  from transactions
  group by 1 order by 1 desc;

create or replace view public.admin_id_check_requests as
  select p.id, p.name, u.email, c.phone, c.instagram, p.area, p.languages, p.id_check_requested_at
  from profiles p
  join auth.users u on u.id = p.id
  left join profile_contacts c on c.id = p.id
  where p.id_check_requested_at is not null and not p.id_verified and not p.banned
  order by p.id_check_requested_at;

revoke all on public.admin_open_reports, public.admin_commission_by_month, public.admin_id_check_requests
  from anon, authenticated;

-- ---------- Live chat ----------
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object or undefined_object then null; end $$;

-- ---------- Photo storage ----------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;
-- Photos only, up to 8 MB each (the app shrinks them before upload).
update storage.buckets
set file_size_limit = 8388608, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'listing-photos';

drop policy if exists "upload own photos" on storage.objects;
create policy "upload own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
-- Needed so people can find and remove their own photos (deleting a listing or the account).
drop policy if exists "see own photos" on storage.objects;
create policy "see own photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own photos" on storage.objects;
create policy "delete own photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
