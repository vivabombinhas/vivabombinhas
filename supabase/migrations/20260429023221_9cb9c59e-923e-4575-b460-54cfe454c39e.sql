DROP POLICY IF EXISTS "Publico cadastra imoveis validos" ON public.imoveis;
DROP POLICY IF EXISTS "Qualquer pessoa pode cadastrar imóvel" ON public.imoveis;

DROP POLICY IF EXISTS "Admins podem cadastrar imoveis" ON public.imoveis;
CREATE POLICY "Admins podem cadastrar imoveis"
ON public.imoveis
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Publico registra conversas validas" ON public.lead_conversations;
DROP POLICY IF EXISTS "Público registra conversa" ON public.lead_conversations;