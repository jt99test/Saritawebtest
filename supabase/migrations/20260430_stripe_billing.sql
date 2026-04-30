alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists billing_period text,
  add column if not exists lavado_purchased boolean default false;

alter table public.profiles
  drop constraint if exists profiles_plan_check;

update public.profiles set plan = 'pro' where plan = 'basico';
update public.profiles set plan = 'avanzado' where plan = 'completo';

alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'pro', 'avanzado'));

alter table public.profiles
  drop constraint if exists profiles_billing_period_check;

alter table public.profiles
  add constraint profiles_billing_period_check check (billing_period in ('monthly', 'yearly') or billing_period is null);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
