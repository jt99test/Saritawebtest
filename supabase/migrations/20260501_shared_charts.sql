create table if not exists public.shared_charts (
  id text primary key default substring(gen_random_uuid()::text from 1 for 8),
  chart_data jsonb not null,
  created_at timestamptz default now()
);

alter table public.shared_charts enable row level security;

drop policy if exists "Public read" on public.shared_charts;
create policy "Public read" on public.shared_charts
for select
using (true);

drop policy if exists "Authenticated insert" on public.shared_charts;
create policy "Authenticated insert" on public.shared_charts
for insert
with check (auth.role() = 'authenticated');
