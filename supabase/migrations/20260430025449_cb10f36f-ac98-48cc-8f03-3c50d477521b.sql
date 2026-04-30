ALTER TABLE public.imoveis 
  ADD COLUMN IF NOT EXISTS destaque_pago boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS destaque_ate timestamp with time zone,
  ADD COLUMN IF NOT EXISTS destaque_valor numeric;

CREATE INDEX IF NOT EXISTS idx_imoveis_destaque_ativo 
  ON public.imoveis (destaque_ate DESC NULLS LAST) 
  WHERE destaque_pago = true AND status = 'ativo';