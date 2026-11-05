-- Homely database schema for Supabase.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- It is safe to run again: it drops and recreates the functions and policies.

-- ---------- Tables ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  area text not null default '' check (char_length(area) <= 40),
  languages text[] not null default '{}',
  id_verified boolean not null default false,  -- set by an admin after the ID check
  created_at timestamptz not null default now()
);

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
  status text not null default 'active' check (status in ('active', 'sold')),
  created_at timestamptz not null default now()
);
create index if not exists listings_status_created on public.listings (status, created_at desc);
create index if not exists listings_seller on public.listings (seller_id);

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

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'contact')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conv on public.messages (conversation_id, created_at);

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

-- ---------- Helper ----------

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

-- ---------- Row level security ----------

alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles readable by signed-in users" on public.profiles;
create policy "profiles readable by signed-in users" on public.profiles
  for select to authenticated using (true);
drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Users cannot mark themselves as ID verified.
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
  for select to authenticated using (true);
drop policy if exists "create own listing" on public.listings;
create policy "create own listing" on public.listings
  for insert to authenticated with check (seller_id = auth.uid());
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
    and exists (select 1 from conversations c where c.id = conversation_id
                and auth.uid() in (c.buyer_id, c.seller_id)
                and not public.is_blocked_between(c.buyer_id, c.seller_id)));

drop policy if exists "own blocks" on public.blocks;
create policy "own blocks" on public.blocks
  for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

drop policy if exists "file reports" on public.reports;
create policy "file reports" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

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
      and (p_id is null or l.id = p_id)
      and (p_seller is null or l.seller_id = p_seller)
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
  limit least(p_limit, 200);
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

-- Permanently delete the signed-in user's account and everything they posted.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  -- The app removes the user's photos through the Storage API before calling this.
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.delete_my_account from anon;
grant execute on function public.delete_my_account to authenticated;

-- ---------- Live chat ----------
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object or undefined_object then null; end $$;

-- ---------- Photo storage ----------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "upload own photos" on storage.objects;
create policy "upload own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own photos" on storage.objects;
create policy "delete own photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and owner = auth.uid());
