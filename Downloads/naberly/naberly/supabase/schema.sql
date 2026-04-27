-- ============================================================
-- NABERLY JA — FIXED SUPABASE SCHEMA v2
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PARISHES
-- ============================================================
create table if not exists parishes (
  id serial primary key,
  name text not null unique
);

insert into parishes (name) values
  ('Kingston'),('St. Andrew'),('St. Thomas'),('Portland'),
  ('St. Mary'),('St. Ann'),('Trelawny'),('St. James'),
  ('Hanover'),('Westmoreland'),('St. Elizabeth'),('Manchester'),
  ('Clarendon'),('St. Catherine')
on conflict do nothing;

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  whatsapp text,
  parish text,
  district text,
  is_admin boolean default false,
  is_verified boolean default false,
  helper_count integer default 0,
  response_count integer default 0,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, whatsapp, parish)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'parish'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- LISTINGS
-- ============================================================
create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  title text not null,
  description text,
  category text not null check (category in (
    'food','urgent','work','ride','service','buy-sell'
  )),
  listing_type text not null default 'offer' check (listing_type in ('need','offer')),
  price_jmd integer,
  is_free boolean default true,
  parish text not null,
  district text,
  whatsapp text,
  is_anonymous boolean default false,
  status text default 'pending' check (status in (
    'pending','approved','hidden','archived','rejected'
  )),
  is_featured boolean default false,
  featured_until timestamptz,
  photo_url text,
  view_count integer default 0,
  response_count integer default 0,
  families_helped integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- IMPACT STORIES
-- ============================================================
create table if not exists impact_stories (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete set null,
  story_text text not null,
  parish text,
  district text,
  people_helped integer default 0,
  created_at timestamptz default now()
);

insert into impact_stories (story_text, parish, district, people_helped) values
  ('Miss Marva fed 12 families in Cross Roads this week', 'Kingston', 'Cross Roads', 12),
  ('An anonymous urgent need in Maxfield Ave was resolved in 2 hours', 'Kingston', 'Maxfield Ave', 1),
  ('Deacon Brown gave a free market ride to 3 neighbors in Dunrobin', 'Kingston', 'Dunrobin', 3),
  ('Brother Roy shared garden vegetables with August Town families', 'Kingston', 'August Town', 8),
  ('7 free food listings active in Kingston right now', 'Kingston', null, 7)
on conflict do nothing;

-- ============================================================
-- SAVED / FAVORITES
-- ============================================================
create table if not exists saved_listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

-- ============================================================
-- BOOSTS
-- ============================================================
create table if not exists boosts (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references listings(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  plan text not null check (plan in ('weekly','monthly','standard_vendor','premium_vendor')),
  price_jmd integer not null,
  payment_method text default 'cash' check (payment_method in ('cash','lynk','wipay','transfer')),
  payment_status text default 'pending' check (payment_status in ('pending','confirmed','expired')),
  payment_note text,
  duration_days integer,
  starts_at timestamptz,
  ends_at timestamptz,
  confirmed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table listings enable row level security;
alter table profiles enable row level security;
alter table saved_listings enable row level security;
alter table impact_stories enable row level security;
alter table boosts enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public can view approved listings" on listings;
drop policy if exists "Users can insert their own listings" on listings;
drop policy if exists "Users can update their own listings" on listings;
drop policy if exists "Admins can do everything on listings" on listings;
drop policy if exists "Users can view all profiles" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Users manage their own saved listings" on saved_listings;
drop policy if exists "Anyone can read impact stories" on impact_stories;
drop policy if exists "Users can view their own boosts" on boosts;
drop policy if exists "Admins can manage all boosts" on boosts;

-- Listings policies
create policy "Public can view approved listings"
  on listings for select
  using (status = 'approved');

create policy "Users can insert their own listings"
  on listings for insert
  with check (true);

create policy "Users can update their own listings"
  on listings for update
  using (auth.uid() = user_id);

create policy "Admins can do everything on listings"
  on listings for all
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Profiles policies
create policy "Users can view all profiles"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Saved listings
create policy "Users manage their own saved listings"
  on saved_listings for all
  using (auth.uid() = user_id);

-- Impact stories
create policy "Anyone can read impact stories"
  on impact_stories for select using (true);

-- Boosts
create policy "Users can view their own boosts"
  on boosts for select
  using (auth.uid() = user_id);

create policy "Admins can manage all boosts"
  on boosts for all
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- SAMPLE LISTINGS (optional — uncomment block below to seed)
-- ============================================================

-- insert into listings (title, description, category, listing_type, parish, district, whatsapp, is_free, is_anonymous, status) values
-- ('Ackee & Saltfish — free to families in need', 'Hot from the yard every morning. Available 6am–10am daily. No questions asked.', 'food', 'offer', 'Kingston', 'Cross Roads', '+18765550001', true, false, 'approved'),
-- ('Data entry clerk wanted — work from home', 'Part-time, work from home. Must have laptop. Training provided.', 'work', 'offer', 'Kingston', null, '+18765550002', false, false, 'approved'),
-- ('Free ride to Coronation Market — every Saturday', 'Leaving Dunrobin Ave at 7am. Up to 3 passengers. WhatsApp by Friday.', 'ride', 'offer', 'Kingston', 'Dunrobin', '+18765550003', true, false, 'approved'),
-- ('Licensed plumber — same day, fair price', '20 years experience. Leaks, pipe replacement, bathroom fitting.', 'service', 'offer', 'Kingston', 'Duhaney Park', '+18765550004', false, false, 'approved'),
-- ('Garden vegetables — take what you need', 'Fresh callaloo, scallion, thyme, tomatoes. Come any weekend morning.', 'food', 'offer', 'Kingston', 'August Town', '+18765550005', true, false, 'approved');
