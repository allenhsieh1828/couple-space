-- Migration: Add invite_code to profiles
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- Generate a random 6-character alphanumeric code helper
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text LANGUAGE sql AS $$
  SELECT upper(substring(md5(random()::text) FROM 1 FOR 6));
$$;

-- Auto-generate invite_code when a profile is created (if not set)
CREATE OR REPLACE FUNCTION public.set_invite_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  new_code text;
BEGIN
  IF NEW.invite_code IS NULL THEN
    LOOP
      new_code := public.generate_invite_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = new_code);
    END LOOP;
    NEW.invite_code := new_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_invite_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_invite_code();

-- Backfill existing profiles that have no invite_code
DO $$
DECLARE
  r RECORD;
  new_code text;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE invite_code IS NULL LOOP
    LOOP
      new_code := public.generate_invite_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = new_code);
    END LOOP;
    UPDATE public.profiles SET invite_code = new_code WHERE id = r.id;
  END LOOP;
END;
$$;

-- RLS: allow any authenticated user to look up a profile by invite_code (for pairing)
CREATE POLICY "profiles: anyone can look up by invite_code"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
