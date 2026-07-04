
-- Passo 3A: migrations observacionais (aditivas)

-- 1. leads_maria: novas colunas
ALTER TABLE public.leads_maria ADD COLUMN IF NOT EXISTS finalidade text;
ALTER TABLE public.leads_maria ADD COLUMN IF NOT EXISTS perfil_anunciante text;
ALTER TABLE public.leads_maria ADD COLUMN IF NOT EXISTS quer_falar_daniel boolean DEFAULT false;
ALTER TABLE public.leads_maria ADD COLUMN IF NOT EXISTS maria_core_session_id text;
ALTER TABLE public.leads_maria ADD COLUMN IF NOT EXISTS next_action_suggested text;

-- 2. maria_messages: novas colunas
ALTER TABLE public.maria_messages ADD COLUMN IF NOT EXISTS mode text;
ALTER TABLE public.maria_messages ADD COLUMN IF NOT EXISTS latency_ms integer;

-- 3. maria_core_events: tabela nova
CREATE TABLE IF NOT EXISTS public.maria_core_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  lead_id uuid,
  tipo text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.maria_core_events TO authenticated;
GRANT ALL ON public.maria_core_events TO service_role;

ALTER TABLE public.maria_core_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'maria_core_events' AND policyname = 'Admins can view maria_core_events'
  ) THEN
    CREATE POLICY "Admins can view maria_core_events"
      ON public.maria_core_events
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'maria_core_events' AND policyname = 'Service role manages maria_core_events'
  ) THEN
    CREATE POLICY "Service role manages maria_core_events"
      ON public.maria_core_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_maria_core_events_session ON public.maria_core_events(session_id);
CREATE INDEX IF NOT EXISTS idx_maria_core_events_lead ON public.maria_core_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_maria_core_events_created ON public.maria_core_events(created_at DESC);
