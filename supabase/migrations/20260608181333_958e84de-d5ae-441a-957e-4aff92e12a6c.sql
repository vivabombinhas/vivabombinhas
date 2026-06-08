
CREATE TABLE public.lead_status_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads_maria(id) ON DELETE CASCADE,
  session_id TEXT,
  old_status TEXT,
  new_status TEXT,
  old_score TEXT,
  new_score TEXT,
  trigger_message TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_status_audit_lead ON public.lead_status_audit(lead_id, created_at DESC);

GRANT SELECT ON public.lead_status_audit TO authenticated;
GRANT ALL ON public.lead_status_audit TO service_role;

ALTER TABLE public.lead_status_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit" ON public.lead_status_audit
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role inserts audit" ON public.lead_status_audit
  FOR INSERT TO service_role
  WITH CHECK (true);
