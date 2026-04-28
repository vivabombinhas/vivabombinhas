DROP POLICY IF EXISTS "Público lê lead próprio via session" ON public.leads_maria;
DROP POLICY IF EXISTS "Público atualiza lead via session_id" ON public.leads_maria;

DROP POLICY IF EXISTS "Qualquer pessoa pode cadastrar lead via MarIA" ON public.leads_maria;
CREATE POLICY "Backend da MarIA registra leads"
ON public.leads_maria
FOR INSERT
TO public
WITH CHECK (
  origem = 'maria_chat'
  AND session_id IS NOT NULL
  AND length(session_id) BETWEEN 20 AND 80
);