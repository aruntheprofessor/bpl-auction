-- Badminton Premier League Auction: database schema (Supabase / Postgres)
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run

-- 1. Settings (single row)
create table settings (
  id int primary key default 1 check (id = 1),
  event_name text not null default 'Badminton Premier League Auction',
  starting_purse integer not null default 100000 check (starting_purse > 0)
);
insert into settings default values;

-- 2. Categories (created by the auctioneer)
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_price integer not null check (base_price > 0),
  increment integer not null check (increment > 0),
  sort_order integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'active', 'done')),
  created_at timestamptz not null default now()
);

-- 3. Teams (logo + colour are used to style the bid buttons)
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  color text not null default '#1e40af',
  created_at timestamptz not null default now()
);

-- 4. Players
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  category_id uuid not null references categories(id) on delete restrict,
  age integer check (age > 0),
  level text,
  status text not null default 'pending' check (status in ('pending', 'sold', 'unsold')),
  team_id uuid references teams(id) on delete restrict,
  sold_price integer,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  -- a sold player must have a team and a price; otherwise neither
  constraint sold_consistency check (
    (status = 'sold' and team_id is not null and sold_price is not null)
    or (status <> 'sold' and team_id is null and sold_price is null)
  )
);

-- one player per category per team (the squad rule, enforced by the database)
create unique index one_player_per_category_per_team
  on players (team_id, category_id) where status = 'sold';

create index players_category_idx on players (category_id);

-- 5. Bids (every click; undo marks the latest one as cancelled)
create table bids (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  amount integer not null check (amount > 0),
  cancelled boolean not null default false,
  created_at timestamptz not null default now()
);

create index bids_player_idx on bids (player_id, created_at);

-- 6. Auction state (single row: what the projector is showing right now)
create table auction_state (
  id int primary key default 1 check (id = 1),
  phase text not null default 'main' check (phase in ('main', 'unsold')),
  screen text not null default 'auction' check (screen in ('auction', 'results', 'final')),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  current_category_id uuid references categories(id) on delete set null,
  current_player_id uuid references players(id) on delete set null,
  current_bid integer,
  current_team_id uuid references teams(id) on delete set null,
  results_category_id uuid references categories(id) on delete set null
);
insert into auction_state default values;

-- Security: everyone can READ (projector link is public).
-- Nobody can write with the public key; all writes go through the
-- password-protected server using the service role key.
alter table settings enable row level security;
alter table categories enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table bids enable row level security;
alter table auction_state enable row level security;

create policy "public read" on settings for select using (true);
create policy "public read" on categories for select using (true);
create policy "public read" on teams for select using (true);
create policy "public read" on players for select using (true);
create policy "public read" on bids for select using (true);
create policy "public read" on auction_state for select using (true);

-- Live updates for the projector screen
alter publication supabase_realtime add table auction_state, players, bids, teams, categories;

-- Public storage bucket for player photos and team logos
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;
