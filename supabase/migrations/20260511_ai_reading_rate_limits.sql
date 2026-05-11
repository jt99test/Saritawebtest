create table if not exists public.ai_reading_request_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  reading_id uuid references public.readings(id) on delete cascade,
  scope text not null check (scope in ('planet', 'general', 'lunar', 'transit', 'solar_return', 'synastry', 'astrocartography')),
  created_at timestamptz default now()
);

alter table public.ai_reading_request_events enable row level security;

drop policy if exists "AI reading request events are viewable by owner" on public.ai_reading_request_events;
create policy "AI reading request events are viewable by owner"
on public.ai_reading_request_events
for select
using (auth.uid() = user_id);

drop policy if exists "AI reading request events are insertable by owner" on public.ai_reading_request_events;
create policy "AI reading request events are insertable by owner"
on public.ai_reading_request_events
for insert
with check (auth.uid() = user_id);

create index if not exists ai_reading_request_events_user_created_at_idx
on public.ai_reading_request_events (user_id, created_at desc);
