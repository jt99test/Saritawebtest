-- Phase 1: profiles + readings storage for SARITA.
-- Run this in Supabase SQL Editor after creating the project.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan text default 'free' check (plan in ('free', 'basico', 'completo')),
  limpieza_unlocked boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text check (type in ('natal', 'luna', 'yoga')),
  chart_data jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.readings enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

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
