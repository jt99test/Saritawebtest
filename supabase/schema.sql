-- Phase 1: profiles + readings storage for SARITA.
-- Run this in Supabase SQL Editor after creating the project.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  locale text not null default 'es',
  plan text default 'free' check (plan in ('free', 'pro', 'avanzado')),
  limpieza_unlocked boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  billing_period text check (billing_period in ('monthly', 'yearly')),
  lavado_purchased boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text check (type in ('natal', 'luna', 'yoga', 'solar_return', 'synastry')),
  chart_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.reading_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  reading_id uuid,
  type text check (type in ('natal', 'luna', 'yoga', 'solar_return', 'synastry')),
  created_at timestamptz default now()
);

create table if not exists public.synastry_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  birth_date date not null,
  birth_time time,
  birth_city text not null,
  birth_lat decimal(9,6) not null,
  birth_lng decimal(9,6) not null,
  chart_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.shared_charts (
  id text primary key default substring(gen_random_uuid()::text from 1 for 8),
  chart_data jsonb not null,
  created_at timestamptz default now()
);

insert into public.reading_usage_events (user_id, reading_id, type, created_at)
select reading.user_id, reading.id, reading.type, reading.created_at
from public.readings as reading
where not exists (
  select 1
  from public.reading_usage_events as usage
  where usage.reading_id = reading.id
);

alter table public.profiles enable row level security;
alter table public.readings enable row level security;
alter table public.reading_usage_events enable row level security;
alter table public.synastry_partners enable row level security;
alter table public.shared_charts enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;

drop policy if exists "Readings are viewable by owner" on public.readings;
create policy "Readings are viewable by owner"
on public.readings
for select
using (auth.uid() = user_id);

drop policy if exists "Readings are insertable by owner" on public.readings;
create policy "Readings are insertable by owner"
on public.readings
for insert
with check (auth.uid() = user_id);

drop policy if exists "Readings are updatable by owner" on public.readings;
create policy "Readings are updatable by owner"
on public.readings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Readings are deletable by owner" on public.readings;
create policy "Readings are deletable by owner"
on public.readings
for delete
using (auth.uid() = user_id);

drop policy if exists "Reading usage is viewable by owner" on public.reading_usage_events;
create policy "Reading usage is viewable by owner"
on public.reading_usage_events
for select
using (auth.uid() = user_id);

drop policy if exists "Reading usage is insertable by owner" on public.reading_usage_events;
create policy "Reading usage is insertable by owner"
on public.reading_usage_events
for insert
with check (auth.uid() = user_id);

drop policy if exists "Synastry partners are viewable by owner" on public.synastry_partners;
create policy "Synastry partners are viewable by owner"
on public.synastry_partners
for select
using (auth.uid() = user_id);

drop policy if exists "Synastry partners are insertable by owner" on public.synastry_partners;
create policy "Synastry partners are insertable by owner"
on public.synastry_partners
for insert
with check (auth.uid() = user_id);

drop policy if exists "Synastry partners are updatable by owner" on public.synastry_partners;
create policy "Synastry partners are updatable by owner"
on public.synastry_partners
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Synastry partners are deletable by owner" on public.synastry_partners;
create policy "Synastry partners are deletable by owner"
on public.synastry_partners
for delete
using (auth.uid() = user_id);

drop policy if exists "Public read" on public.shared_charts;
create policy "Public read"
on public.shared_charts
for select
using (true);

drop policy if exists "Authenticated insert" on public.shared_charts;
create policy "Authenticated insert"
on public.shared_charts
for insert
with check (auth.role() = 'authenticated');

create index if not exists readings_user_created_at_idx
on public.readings (user_id, created_at desc);

create index if not exists reading_usage_events_user_created_at_idx
on public.reading_usage_events (user_id, created_at desc);

create index if not exists reading_usage_events_reading_id_idx
on public.reading_usage_events (reading_id);

create index if not exists synastry_partners_user_created_at_idx
on public.synastry_partners (user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
