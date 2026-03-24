-- Allow supporters to view organizations with completed registration
CREATE POLICY "Supporters can view registered organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  registration_completed = true 
  AND public.has_role(auth.uid(), 'supporter'::user_role)
);