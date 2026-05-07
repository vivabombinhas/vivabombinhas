-- Add curation columns to imoveis table
ALTER TABLE public.imoveis 
ADD COLUMN IF NOT EXISTS destaque_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS oculta_para_maria BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_curated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS curador_id UUID REFERENCES auth.users(id);

-- Create an index for faster filtering by Maria
CREATE INDEX IF NOT EXISTS idx_imoveis_maria_visibility ON public.imoveis (oculta_para_maria, status);
CREATE INDEX IF NOT EXISTS idx_imoveis_premium ON public.imoveis (destaque_premium);