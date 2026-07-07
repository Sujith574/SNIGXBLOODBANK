-- Add is_approved column to profiles for admin-approval flow
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE;

-- Admin accounts should be auto-approved
UPDATE public.profiles SET is_approved = TRUE WHERE role = 'admin';

-- Add index for fast pending approvals query
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON public.profiles(is_approved);

-- Also add bloodbank to allowed roles (was missing)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'donor', 'hospital', 'bloodbank'));
