DROP POLICY IF EXISTS "Qualquer pessoa pode cadastrar imóvel" ON public.imoveis;
CREATE POLICY "Publico cadastra imoveis validos"
ON public.imoveis
FOR INSERT
TO public
WITH CHECK (
  status = 'ativo'::public.status_imovel
  AND cidade = 'Bombinhas'
  AND titulo IS NOT NULL
  AND length(btrim(titulo)) BETWEEN 3 AND 180
  AND finalidade IS NOT NULL
  AND tipo IS NOT NULL
  AND (
    link_anuncio IS NULL
    OR link_anuncio ~* '^https?://[^[:space:]]{4,}$'
  )
);

DROP POLICY IF EXISTS "Qualquer pessoa pode enviar submission" ON public.imoveis_submissions;
CREATE POLICY "Publico envia submissions validas"
ON public.imoveis_submissions
FOR INSERT
TO public
WITH CHECK (
  status_submission = 'pendente'::public.status_submission
  AND cidade = 'Bombinhas'
  AND titulo IS NOT NULL
  AND length(btrim(titulo)) BETWEEN 3 AND 180
  AND finalidade IS NOT NULL
  AND tipo IS NOT NULL
  AND (
    coalesce(btrim(anunciante_nome), '') <> ''
    OR coalesce(btrim(anunciante_telefone), '') <> ''
    OR coalesce(btrim(anunciante_email), '') <> ''
  )
  AND (
    link_anuncio IS NULL
    OR link_anuncio ~* '^https?://[^[:space:]]{4,}$'
  )
);

DROP POLICY IF EXISTS "Público registra conversa" ON public.lead_conversations;
CREATE POLICY "Publico registra conversas validas"
ON public.lead_conversations
FOR INSERT
TO public
WITH CHECK (
  lead_id IS NOT NULL
  AND role IN ('user', 'assistant', 'system')
  AND length(btrim(content)) BETWEEN 1 AND 4000
);