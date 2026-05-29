ALTER TABLE public.leads_maria 
ADD COLUMN IF NOT EXISTS feedback_corretor TEXT,
ADD COLUMN IF NOT EXISTS observacao_interna TEXT;

COMMENT ON COLUMN public.leads_maria.feedback_corretor IS 'Pode ser "bom", "ruim", "valido" ou "invalido"';