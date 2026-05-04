-- Great Guide — schema for the bespoke tourist guide app.
--
-- Mirrors the localStorage shape used by /apps/greatguide/storage.js so the
-- frontend can swap localStorage → supabase with no model changes.

create table if not exists greatguide_tours (
  id text primary key,                       -- e.g. GG-260502-A1B2
  created_at timestamptz not null default now(),
  brand text not null default 'litoral',
  lang text not null default 'en',
  hours numeric not null check (hours > 0 and hours <= 24),
  duration_minutes int,                      -- realized total
  stop_ids text[] not null default '{}',     -- ordered POI ids
  segments jsonb not null default '[]'::jsonb, -- [{mode, km, minutes}, ...]
  drivers text[] not null default '{}',      -- per-stop driving interest id
  notes text                                 -- free-form guide notes
);

create table if not exists greatguide_guests (
  id uuid primary key default gen_random_uuid(),
  tour_id text not null references greatguide_tours(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  home_city text,
  arrival date,
  party_size int not null default 1 check (party_size >= 1),
  -- Interests as a {tag: 1..5} map; custom interests as text[]
  interests jsonb not null default '{}'::jsonb,
  custom_interest_notes text[] not null default '{}'
);

create index if not exists greatguide_guests_tour_id_idx on greatguide_guests(tour_id);
create index if not exists greatguide_tours_created_at_idx on greatguide_tours(created_at desc);

-- Lightweight CRM: each guest's email is unique enough to identify them
-- across tours. This view rolls all tours per email so the hotel can see
-- repeat visitors.
create or replace view greatguide_guest_history as
select
  lower(email) as email,
  max(name) as last_name,
  count(distinct tour_id) as tour_count,
  max(created_at) as last_seen,
  array_agg(distinct home_city) filter (where home_city is not null) as home_cities
from greatguide_guests
group by lower(email);

-- RLS — public can insert tours/guests (this is a kiosk-style flow).
-- Guides authenticate via Supabase Auth and read everything.
alter table greatguide_tours enable row level security;
alter table greatguide_guests enable row level security;

drop policy if exists "anyone can create a tour" on greatguide_tours;
create policy "anyone can create a tour"
  on greatguide_tours for insert to anon, authenticated
  with check (true);

drop policy if exists "anyone can read their tour by id" on greatguide_tours;
create policy "anyone can read their tour by id"
  on greatguide_tours for select to anon, authenticated
  using (true);

drop policy if exists "guides can update tours" on greatguide_tours;
create policy "guides can update tours"
  on greatguide_tours for update to authenticated
  using (true) with check (true);

drop policy if exists "anyone can add a guest" on greatguide_guests;
create policy "anyone can add a guest"
  on greatguide_guests for insert to anon, authenticated
  with check (true);

drop policy if exists "anyone can read guests by tour id" on greatguide_guests;
create policy "anyone can read guests by tour id"
  on greatguide_guests for select to anon, authenticated
  using (true);
