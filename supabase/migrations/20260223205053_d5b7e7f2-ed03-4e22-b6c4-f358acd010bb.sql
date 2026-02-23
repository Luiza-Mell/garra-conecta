
-- Add rejection_reason and reviewed_by to monthly_reports
ALTER TABLE public.monthly_reports 
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  related_report_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Allow admin to update any report (approve/reject)
CREATE POLICY "Admins can update all reports"
ON public.monthly_reports FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role));
