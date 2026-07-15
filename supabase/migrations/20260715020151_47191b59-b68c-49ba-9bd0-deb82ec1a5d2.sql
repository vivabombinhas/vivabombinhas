
-- 1. Restrict ai_config SELECT to admins
DROP POLICY IF EXISTS "Enable read access for all" ON public.ai_config;
CREATE POLICY "Admins can read AI config"
ON public.ai_config
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Enforce column-level revokes on sensitive anunciante fields
REVOKE SELECT (anunciante_nome, anunciante_telefone, anunciante_email)
  ON public.imoveis FROM anon, authenticated, PUBLIC;

-- 3. Revoke public execute on SECURITY DEFINER analytics function
REVOKE EXECUTE ON FUNCTION public.check_maria_filter_spikes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_maria_filter_spikes() TO service_role;
