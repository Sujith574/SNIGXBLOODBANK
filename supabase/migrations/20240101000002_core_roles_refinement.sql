-- SQL Migration refactoring roles to admin, bloodbank, hospital

-- 1. Alter constraints on profiles to use 'bloodbank' instead of 'donor'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'bloodbank', 'hospital'));

-- 2. Modify donors table to associate records with registering blood banks
alter table public.donors add column if not exists bloodbank_id uuid references auth.users(id) on delete cascade;

-- 3. Fulfillments tracker table
create table if not exists public.fulfillments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.blood_requests(id) on delete cascade,
  bloodbank_id uuid references auth.users(id) on delete cascade,
  units_provided integer not null check (units_provided > 0),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.fulfillments enable row level security;
create policy "Service role fulfillments" on public.fulfillments for all using (true) with check (true);
create policy "Auth select fulfillments" on public.fulfillments for select using (true);
