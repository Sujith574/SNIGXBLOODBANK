-- SQL Migration script extending tables on Supabase/Postgres

-- 1. Donors profile table
create table if not exists public.donors (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  gender text check (gender in ('male', 'female', 'other')),
  weight_kg numeric,
  blood_group text check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  date_of_birth date,
  address text,
  state text,
  district text,
  city text,
  pincode text,
  medical_history text,
  last_donation_date timestamptz,
  eligibility_status text default 'eligible' check (eligibility_status in ('eligible', 'temporarily_deferred', 'not_eligible')),
  donation_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Hospitals verification profile table
create table if not exists public.hospitals (
  id uuid primary key references auth.users(id) on delete cascade,
  registration_number text not null unique,
  license_number text not null unique,
  doctor_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  is_approved boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Blood inventory stock levels (associated with Hospital / Blood Bank)
create table if not exists public.blood_inventory (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references auth.users(id) on delete cascade,
  blood_group text not null check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_available integer not null default 0 check (units_available >= 0),
  updated_at timestamptz not null default now(),
  unique(hospital_id, blood_group)
);

-- 4. Blood requests
create table if not exists public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  age integer not null,
  gender text not null,
  blood_group text not null check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_required integer not null check (units_required > 0),
  hospital_id uuid references auth.users(id) on delete cascade,
  doctor_name text not null,
  emergency_level text default 'low' check (emergency_level in ('low', 'medium', 'high')),
  reason text not null,
  required_date date not null,
  status text default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Appointments booked by Donors
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references auth.users(id) on delete cascade,
  hospital_id uuid references auth.users(id) on delete cascade,
  appointment_date_time timestamptz not null,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Blood Donation Camps/Drives
create table if not exists public.camps (
  id uuid primary key default gen_random_uuid(),
  camp_name text not null,
  organizer text,
  venue text not null,
  start_date_time timestamptz not null,
  capacity integer,
  description text,
  created_at timestamptz not null default now()
);

-- Enable RLS for all tables
alter table public.donors enable row level security;
alter table public.hospitals enable row level security;
alter table public.blood_inventory enable row level security;
alter table public.blood_requests enable row level security;
alter table public.appointments enable row level security;
alter table public.camps enable row level security;

-- Setup full service role policies (functions run as service role)
create policy "Service role donors" on public.donors for all using (true) with check (true);
create policy "Service role hospitals" on public.hospitals for all using (true) with check (true);
create policy "Service role blood_inventory" on public.blood_inventory for all using (true) with check (true);
create policy "Service role blood_requests" on public.blood_requests for all using (true) with check (true);
create policy "Service role appointments" on public.appointments for all using (true) with check (true);
create policy "Service role camps" on public.camps for all using (true) with check (true);

-- Authenticated select-all access for simplicity in views
create policy "Auth select donors" on public.donors for select using (true);
create policy "Auth select hospitals" on public.hospitals for select using (true);
create policy "Auth select blood_inventory" on public.blood_inventory for select using (true);
create policy "Auth select blood_requests" on public.blood_requests for select using (true);
create policy "Auth select appointments" on public.appointments for select using (true);
create policy "Auth select camps" on public.camps for select using (true);
