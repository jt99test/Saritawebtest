create table if not exists public.ai_reading_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  reading_id uuid references public.readings(id) on delete cascade not null,
  scope text not null check (scope in ('planet', 'general', 'lunar', 'transit', 'solar_return', 'synastry')),
  item_key text not null,
  locale text not null default 'es',
  content jsonb not null,
  created_at timestamptz default now(),
  unique (reading_id, scope, item_key, locale)
);

alter table public.ai_reading_generations enable row level security;

drop policy if exists "AI reading generations are viewable by owner" on public.ai_reading_generations;
create policy "AI reading generations are viewable by owner"
on public.ai_reading_generations
for select
using (auth.uid() = user_id);

drop policy if exists "AI reading generations are insertable by owner" on public.ai_reading_generations;
create policy "AI reading generations are insertable by owner"
on public.ai_reading_generations
for insert
with check (auth.uid() = user_id);

create index if not exists ai_reading_generations_user_reading_idx
on public.ai_reading_generations (user_id, reading_id);
