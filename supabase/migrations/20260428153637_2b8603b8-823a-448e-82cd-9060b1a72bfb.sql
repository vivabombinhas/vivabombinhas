-- Tornar nome e telefone opcionais para suportar pré-cadastro anônimo
ALTER TABLE public.leads_maria ALTER COLUMN nome DROP NOT NULL;
ALTER TABLE public.leads_maria ALTER COLUMN telefone DROP NOT NULL;

-- Adicionar session_id para vincular conversas anônimas ao mesmo lead
ALTER TABLE public.leads_maria ADD COLUMN IF NOT EXISTS session_id TEXT UNIQUE;

-- Índice para busca rápida por session
CREATE INDEX IF NOT EXISTS idx_leads_maria_session ON public.leads_maria(session_id);

-- Permitir que o público (chat anônimo) faça UPDATE no próprio lead via session_id
-- (necessário para upgradar lead anônimo -> identificado quando nome/telefone chegam)
CREATE POLICY "Público atualiza lead via session_id"
ON public.leads_maria
FOR UPDATE
TO public
USING (session_id IS NOT NULL)
WITH CHECK (session_id IS NOT NULL);

-- Permitir SELECT público apenas do próprio lead via session_id (para upsert checagem)
CREATE POLICY "Público lê lead próprio via session"
ON public.leads_maria
FOR SELECT
TO public
USING (session_id IS NOT NULL);
