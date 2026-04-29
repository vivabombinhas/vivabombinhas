
-- ============ TABELA lead_alerts ============
CREATE TABLE IF NOT EXISTS public.lead_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  finalidade text,
  tipo text,
  bairro text,
  preco_max numeric,
  quartos_min integer,
  query_original text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_matched_at timestamptz,
  CONSTRAINT lead_alerts_status_check CHECK (status IN ('ativo','atendido','cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_lead_alerts_lead_id ON public.lead_alerts(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_alerts_status ON public.lead_alerts(status);

ALTER TABLE public.lead_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem alertas"
  ON public.lead_alerts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins criam alertas"
  ON public.lead_alerts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins atualizam alertas"
  ON public.lead_alerts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins deletam alertas"
  ON public.lead_alerts FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Permite que o backend (service role via edge function) também insira alertas
CREATE POLICY "Service role insere alertas"
  ON public.lead_alerts FOR INSERT TO service_role
  WITH CHECK (true);

CREATE TRIGGER trg_lead_alerts_updated
  BEFORE UPDATE ON public.lead_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ Garante unicidade de match (lead, imóvel) ============
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_matches_unique
  ON public.lead_matches(lead_id, imovel_id);

-- ============ Trigger para criar matches quando um imóvel novo entra ============
DROP TRIGGER IF EXISTS trg_auto_match_on_imovel ON public.imoveis;
CREATE TRIGGER trg_auto_match_on_imovel
  AFTER INSERT OR UPDATE OF status ON public.imoveis
  FOR EACH ROW EXECUTE FUNCTION public.auto_match_on_imovel();

-- ============ Trigger para criar matches quando um lead novo entra ============
DROP TRIGGER IF EXISTS trg_auto_match_on_lead ON public.leads_maria;
CREATE TRIGGER trg_auto_match_on_lead
  AFTER INSERT OR UPDATE OF bairro_interesse, tipo_imovel, faixa_preco, mensagem_original
  ON public.leads_maria
  FOR EACH ROW EXECUTE FUNCTION public.auto_match_on_lead();

-- ============ Marca alerta como atendido quando vira match ============
CREATE OR REPLACE FUNCTION public.mark_alert_attended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lead_alerts
     SET status = 'atendido', last_matched_at = now()
   WHERE lead_id = NEW.lead_id
     AND status = 'ativo';
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_alert_attended() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_mark_alert_attended ON public.lead_matches;
CREATE TRIGGER trg_mark_alert_attended
  AFTER INSERT ON public.lead_matches
  FOR EACH ROW EXECUTE FUNCTION public.mark_alert_attended();
