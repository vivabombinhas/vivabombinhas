ALTER TABLE public.leads_maria 
ADD COLUMN IF NOT EXISTS capital_disponivel NUMERIC,
ADD COLUMN IF NOT EXISTS bens_para_permuta TEXT,
ADD COLUMN IF NOT EXISTS objetivo_investimento TEXT,
ADD COLUMN IF NOT EXISTS região_interesse TEXT,
ADD COLUMN IF NOT EXISTS proximo_passo_sugerido TEXT,
ADD COLUMN IF NOT EXISTS chat_history JSONB;

COMMENT ON COLUMN public.leads_maria.chat_history IS 'Snapshot of the conversation messages for context in CRM';