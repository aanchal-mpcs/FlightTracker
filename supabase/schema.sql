create extension if not exists pgcrypto;

create table if not exists public.aircraft_states (
  icao24 text primary key,
  callsign text,
  origin_country text,
  time_position bigint,
  last_contact bigint,
  longitude double precision,
  latitude double precision,
  baro_altitude double precision,
  on_ground boolean,
  velocity double precision,
  true_track double precision,
  vertical_rate double precision,
  geo_altitude double precision,
  squawk text,
  spi boolean,
  position_source integer,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists aircraft_states_last_contact_idx
  on public.aircraft_states (last_contact desc);

create index if not exists aircraft_states_bounds_idx
  on public.aircraft_states (latitude, longitude);

create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  min_lat double precision,
  max_lat double precision,
  min_lng double precision,
  max_lng double precision,
  callsign_prefix text,
  country text,
  min_altitude double precision,
  max_altitude double precision,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

alter table public.aircraft_states enable row level security;
alter table public.saved_filters enable row level security;

drop policy if exists "aircraft_states are readable by everyone" on public.aircraft_states;
create policy "aircraft_states are readable by everyone"
  on public.aircraft_states
  for select
  using (true);

drop policy if exists "saved_filters are readable by owner" on public.saved_filters;
create policy "saved_filters are readable by owner"
  on public.saved_filters
  for select
  using (auth.uid() = user_id);

drop policy if exists "saved_filters are insertable by owner" on public.saved_filters;
create policy "saved_filters are insertable by owner"
  on public.saved_filters
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_filters are updateable by owner" on public.saved_filters;
create policy "saved_filters are updateable by owner"
  on public.saved_filters
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_filters are deletable by owner" on public.saved_filters;
create policy "saved_filters are deletable by owner"
  on public.saved_filters
  for delete
  using (auth.uid() = user_id);

alter publication supabase_realtime add table public.aircraft_states;
