-- Add user_id column to imoveis_submissions
ALTER TABLE public.imoveis_submissions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id column to imoveis
ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Enable RLS on imoveis_submissions if not already enabled
ALTER TABLE public.imoveis_submissions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own submissions
CREATE POLICY "Users can view their own submissions" 
ON public.imoveis_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for users to update their own submissions
CREATE POLICY "Users can update their own submissions" 
ON public.imoveis_submissions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy for anyone to insert submissions (frictionless flow)
-- We allow insertion without user_id, but the dashboard only shows those with it.
CREATE POLICY "Anyone can insert submissions" 
ON public.imoveis_submissions 
FOR INSERT 
WITH CHECK (true);

-- Update RLS for imoveis
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

-- Everyone can view active properties
CREATE POLICY "Anyone can view active properties"
ON public.imoveis
FOR SELECT
USING (status = 'ativo');

-- Owners can view their own properties regardless of status
CREATE POLICY "Owners can view their own properties"
ON public.imoveis
FOR SELECT
USING (auth.uid() = user_id);

-- Owners can update their own properties
CREATE POLICY "Owners can update their own properties"
ON public.imoveis
FOR UPDATE
USING (auth.uid() = user_id);
