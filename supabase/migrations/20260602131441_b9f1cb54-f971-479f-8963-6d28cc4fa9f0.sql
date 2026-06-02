ALTER TABLE public.leads_maria 
ADD COLUMN IF NOT EXISTS cidade_estado TEXT,
ADD COLUMN IF NOT EXISTS pais_codigo TEXT,
ADD COLUMN IF NOT EXISTS tipo_lead TEXT,
ADD COLUMN IF NOT EXISTS quer_analise BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS proximo_passo_sugerido TEXT;

-- Garantir que as permissões continuam válidas (embora já devam estar)
GRANT ALL ON public.leads_maria TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.leads_maria TO anon;