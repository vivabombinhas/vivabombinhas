-- Create DELETE policy for admins on leads_maria
CREATE POLICY "Admins can delete leads" 
ON public.leads_maria 
FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));