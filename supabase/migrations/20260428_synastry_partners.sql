alter table public.readings
drop constraint if exists readings_type_check;

alter table public.readings
add constraint readings_type_check
check (type in ('natal', 'luna', 'yoga', 'solar_return', 'synastry'));

alter table public.reading_usage_events
drop constraint if exists reading_usage_events_type_check;

alter table public.reading_usage_events
add constraint reading_usage_events_type_check
check (type in ('natal', 'luna', 'yoga', 'solar_return', 'synastry'));

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

alter table public.synastry_partners enable row level security;

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
