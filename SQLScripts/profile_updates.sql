-- ==========================================
-- REALINVEST: Profile Info Schema Update
-- ==========================================

-- 1. Add display_name and bio to users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Migrate existing username to display_name for consistency (optional but helpful)
UPDATE public.users SET display_name = username WHERE display_name IS NULL;
