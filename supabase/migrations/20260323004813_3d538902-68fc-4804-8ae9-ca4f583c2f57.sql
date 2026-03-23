ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS program_category text,
ADD COLUMN IF NOT EXISTS project_axis text,
ADD COLUMN IF NOT EXISTS ods text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS municipalities_count text;