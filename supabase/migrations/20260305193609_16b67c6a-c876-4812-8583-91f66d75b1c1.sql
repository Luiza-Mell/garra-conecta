
-- Add new institutional registration fields to organizations table
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS registration_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fantasy_name text,
  ADD COLUMN IF NOT EXISTS organization_nature text,
  ADD COLUMN IF NOT EXISTS constitution_date date,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS institutional_email text,
  ADD COLUMN IF NOT EXISTS social_media text,
  ADD COLUMN IF NOT EXISTS legal_rep_name text,
  ADD COLUMN IF NOT EXISTS legal_rep_phone text,
  ADD COLUMN IF NOT EXISTS legal_rep_email text,
  ADD COLUMN IF NOT EXISTS legal_rep_gender text,
  ADD COLUMN IF NOT EXISTS legal_rep_race text,
  ADD COLUMN IF NOT EXISTS legal_rep_education text,
  ADD COLUMN IF NOT EXISTS team_structure text[],
  ADD COLUMN IF NOT EXISTS annual_revenue text,
  ADD COLUMN IF NOT EXISTS areas_of_action text[];
