-- KHANHDUY Training Tracker V5 - Supabase setup
-- Chay toan bo script nay trong Supabase > SQL Editor.

create table if not exists public.tracker_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.tracker_state enable row level security;

grant select, insert, update on table public.tracker_state to authenticated;
revoke all on table public.tracker_state from anon;

drop policy if exists "Users can access own tracker state" on public.tracker_state;
create policy "Users can access own tracker state"
on public.tracker_state
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.set_tracker_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tracker_state_set_updated_at on public.tracker_state;
create trigger tracker_state_set_updated_at
before update on public.tracker_state
for each row execute function public.set_tracker_updated_at();
