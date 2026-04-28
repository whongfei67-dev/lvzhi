ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_organization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creator_application_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requested_role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT;
