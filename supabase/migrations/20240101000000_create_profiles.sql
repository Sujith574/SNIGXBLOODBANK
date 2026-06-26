-- Create profiles table linked to Supabase Auth
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'donor' check (role in ('admin', 'donor', 'hospital')),
  is_email_verified boolean not null default false,
  email_verification_token text,
  email_verification_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Allow service role full access (Edge Function uses service role)
create policy "Service role full access" on public.profiles
  for all using (true)
  with check (true);

-- Allow authenticated users to read their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Allow authenticated users to update their own profile  
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Index on email for fast lookups
create index if not exists idx_profiles_email on public.profiles(email);

-- Index on verification token for fast lookups
create index if not exists idx_profiles_verification_token on public.profiles(email_verification_token);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
