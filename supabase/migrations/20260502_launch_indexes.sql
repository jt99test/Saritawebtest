create index if not exists readings_user_created_at_idx
on public.readings (user_id, created_at desc);

create index if not exists reading_usage_events_user_created_at_idx
on public.reading_usage_events (user_id, created_at desc);

create index if not exists reading_usage_events_reading_id_idx
on public.reading_usage_events (reading_id);

create index if not exists synastry_partners_user_created_at_idx
on public.synastry_partners (user_id, created_at desc);
