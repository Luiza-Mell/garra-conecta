-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'organization', 'supporter');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  cnpj TEXT,
  description TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supporters table
CREATE TABLE public.supporters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monthly reports table
CREATE TABLE public.monthly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  reference_month DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pending', 'approved', 'rejected')),
  
  -- Section 1: Organization Data
  activities_description TEXT,
  responsible_person TEXT,
  form_filled_by TEXT,
  
  -- Section 2: Project Summary
  project_description TEXT,
  challenges TEXT,
  advances TEXT,
  next_steps TEXT,
  
  -- Section 3: Activities Execution
  activities_detailed TEXT,
  participants_count INTEGER,
  
  -- Section 4: Financial Execution
  funds_usage TEXT,
  cash_flow TEXT,
  financial_management_model TEXT,
  other_resources TEXT,
  
  -- Section 5: Result Indicators
  results_achieved TEXT,
  impact_generated TEXT,
  autonomy_strategies TEXT,
  revenue_diversification TEXT,
  
  -- Section 6: Support and Joint Actions
  network_activities TEXT,
  partnerships TEXT,
  partner_locations TEXT,
  action_type TEXT,
  
  -- Section 7: Learning and Wellbeing
  learnings TEXT,
  personal_report TEXT,
  work_life_balance TEXT,
  current_needs TEXT,
  how_garra_can_help TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE
);

-- Create report attachments table
CREATE TABLE public.report_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.monthly_reports(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('invoice', 'receipt', 'photo', 'video', 'testimony', 'other')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_attachments ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Organizations policies
CREATE POLICY "Organizations can view own data" ON public.organizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organizations can update own data" ON public.organizations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Organizations can insert own data" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all organizations" ON public.organizations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Supporters policies
CREATE POLICY "Supporters can view own data" ON public.supporters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Supporters can update own data" ON public.supporters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Supporters can insert own data" ON public.supporters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all supporters" ON public.supporters
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Monthly reports policies
CREATE POLICY "Organizations can view own reports" ON public.monthly_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE organizations.id = monthly_reports.organization_id 
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizations can insert own reports" ON public.monthly_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE organizations.id = organization_id 
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizations can update own reports" ON public.monthly_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE organizations.id = monthly_reports.organization_id 
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and supporters can view all reports" ON public.monthly_reports
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supporter')
  );

-- Report attachments policies
CREATE POLICY "View attachments via report access" ON public.report_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.monthly_reports mr
      JOIN public.organizations o ON mr.organization_id = o.id
      WHERE mr.id = report_attachments.report_id 
      AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supporter'))
    )
  );

CREATE POLICY "Organizations can insert attachments" ON public.report_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.monthly_reports mr
      JOIN public.organizations o ON mr.organization_id = o.id
      WHERE mr.id = report_id 
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizations can delete own attachments" ON public.report_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.monthly_reports mr
      JOIN public.organizations o ON mr.organization_id = o.id
      WHERE mr.id = report_attachments.report_id 
      AND o.user_id = auth.uid()
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supporters_updated_at
  BEFORE UPDATE ON public.supporters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_reports_updated_at
  BEFORE UPDATE ON public.monthly_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for report files
INSERT INTO storage.buckets (id, name, public) VALUES ('report-files', 'report-files', false);

-- Storage policies
CREATE POLICY "Organizations can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'report-files' AND 
    auth.uid() IS NOT NULL AND
    public.has_role(auth.uid(), 'organization')
  );

CREATE POLICY "Authenticated users can view files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'report-files' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Organizations can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'report-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );