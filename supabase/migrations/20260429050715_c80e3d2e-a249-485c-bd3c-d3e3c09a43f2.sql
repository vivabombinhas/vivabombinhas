
-- Tabela de receita por lead
CREATE TABLE IF NOT EXISTS public.lead_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  imovel_id UUID,
  tipo_negocio TEXT NOT NULL CHECK (tipo_negocio IN ('temporada','anual','venda')),
  parceiro_nome TEXT,
  parceiro_telefone TEXT,
  valor_negocio NUMERIC(12,2),
  comissao_percentual NUMERIC(5,2),
  valor_previsto NUMERIC(12,2),
  valor_pago NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'previsto' CHECK (status IN ('previsto','negociacao','fechado','pago','cancelado')),
  data_fechamento DATE,
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_revenue_lead ON public.lead_revenue(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_revenue_status ON public.lead_revenue(status);
CREATE INDEX IF NOT EXISTS idx_lead_revenue_tipo ON public.lead_revenue(tipo_negocio);

ALTER TABLE public.lead_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem receita"
  ON public.lead_revenue FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins criam receita"
  ON public.lead_revenue FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins atualizam receita"
  ON public.lead_revenue FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins deletam receita"
  ON public.lead_revenue FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_lead_revenue_updated
  BEFORE UPDATE ON public.lead_revenue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
