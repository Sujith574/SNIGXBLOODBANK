-- Create donor_records table for walk-in donors registered by blood banks
-- (separate from the donors table which is for authenticated donor users)
CREATE TABLE IF NOT EXISTS public.donor_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bloodbank_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  phone text,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  weight_kg numeric,
  blood_group text CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  date_of_birth date,
  address text,
  state text,
  district text,
  city text,
  pincode text,
  medical_history text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donor_records ENABLE ROW LEVEL SECURITY;

-- Full service role access (Edge Function uses service role)
CREATE POLICY "Service role donor_records" ON public.donor_records
  FOR ALL USING (true) WITH CHECK (true);

-- Index on bloodbank_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_donor_records_bloodbank_id ON public.donor_records(bloodbank_id);
CREATE INDEX IF NOT EXISTS idx_donor_records_blood_group ON public.donor_records(blood_group);
