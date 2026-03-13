
-- Add status column to leads_maria
CREATE TYPE public.status_lead AS ENUM ('novo', 'contatado', 'convertido', 'descartado');

ALTER TABLE public.leads_maria ADD COLUMN status status_lead NOT NULL DEFAULT 'novo';

-- Allow public SELECT on leads_maria (for admin dashboard - no auth yet)
CREATE POLICY "Leads são visíveis para leitura"
ON public.leads_maria FOR SELECT TO public
USING (true);

-- Allow public UPDATE on leads_maria (for status changes)
CREATE POLICY "Leads podem ser atualizados"
ON public.leads_maria FOR UPDATE TO public
USING (true) WITH CHECK (true);
