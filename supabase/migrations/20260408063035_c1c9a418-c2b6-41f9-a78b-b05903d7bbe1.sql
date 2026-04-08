
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
