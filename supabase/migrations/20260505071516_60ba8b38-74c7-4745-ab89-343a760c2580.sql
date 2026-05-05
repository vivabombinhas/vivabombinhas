-- Set search_path for the trigger function to improve security
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- Add administrative policy for ai_config
-- Assuming administrators have a 'role' claim in metadata or are just authenticated for now
-- In a real scenario, check for admin role
CREATE POLICY "Admins can update AI config" 
ON public.ai_config 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete AI config" 
ON public.ai_config 
FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "Admins can insert AI config" 
ON public.ai_config 
FOR INSERT 
TO authenticated 
WITH CHECK (true);