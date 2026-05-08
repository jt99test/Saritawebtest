alter table public.ai_reading_generations
drop constraint if exists ai_reading_generations_scope_check;

alter table public.ai_reading_generations
add constraint ai_reading_generations_scope_check
check (scope in ('planet', 'general', 'lunar', 'transit', 'solar_return', 'synastry', 'astrocartography'));

drop policy if exists "AI reading generations are updatable by owner" on public.ai_reading_generations;
create policy "AI reading generations are updatable by owner"
on public.ai_reading_generations
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
