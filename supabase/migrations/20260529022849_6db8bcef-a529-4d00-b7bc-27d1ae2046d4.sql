ALTER TABLE public.leads_maria 
ADD COLUMN IF NOT EXISTS lead_score TEXT DEFAULT 'frio',
ADD COLUMN IF NOT EXISTS objetivo TEXT,
ADD COLUMN IF NOT EXISTS prazo_compra TEXT,
ADD COLUMN IF NOT EXISTS orcamento_max NUMERIC;

-- Grant permissions for service role (used by Edge Functions)
GRANT ALL ON public.leads_maria TO service_role;
