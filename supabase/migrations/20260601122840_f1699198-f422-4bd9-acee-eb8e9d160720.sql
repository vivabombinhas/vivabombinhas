
-- 1. ai_config: restrict write to admins
DROP POLICY IF EXISTS "Admins can update AI config" ON public.ai_config;
DROP POLICY IF EXISTS "Admins can delete AI config" ON public.ai_config;
DROP POLICY IF EXISTS "Admins can insert AI config" ON public.ai_config;

CREATE POLICY "Admins can update AI config" ON public.ai_config
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete AI config" ON public.ai_config
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert AI config" ON public.ai_config
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. imoveis_submissions: drop overly permissive duplicate insert policy
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.imoveis_submissions;

-- 3. broker_notifications: restrict SELECT to admins
DROP POLICY IF EXISTS "Brokers can view notifications" ON public.broker_notifications;
CREATE POLICY "Admins can view notifications" ON public.broker_notifications
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Storage policies: restrict update/delete to file owner
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;

CREATE POLICY "Owners can delete their photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'imoveis' AND owner = auth.uid());

CREATE POLICY "Owners can update their photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'imoveis' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'imoveis' AND owner = auth.uid());

-- 5. Re-apply column-level revoke on imoveis contact columns (anon + authenticated)
REVOKE SELECT ON public.imoveis FROM anon, authenticated;

GRANT SELECT (
  id, codigo, titulo, descricao, finalidade, tipo, cidade, bairro, endereco,
  quartos, suites, banheiros, vagas_garagem, area_m2, capacidade_pessoas,
  mobiliado, piscina, vista_mar, frente_mar, churrasqueira, ar_condicionado,
  aceita_pet, wifi, estacionamento, preco, preco_temporada_diaria, condominio,
  iptu_anual, link_anuncio, fotos, origem, imobiliaria, status, destaque,
  observacoes, created_at, updated_at, gestao_propria, destaque_pago,
  destaque_ate, destaque_valor, user_id, destaque_premium, oculta_para_maria,
  last_curated_at, curador_id
) ON public.imoveis TO anon, authenticated;

-- service_role keeps full access for edge functions
GRANT ALL ON public.imoveis TO service_role;

-- 6. Function search_path fix for get_qualified_leads_stats
CREATE OR REPLACE FUNCTION public.get_qualified_leads_stats()
 RETURNS TABLE(total bigint, unread bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY SELECT 
        count(*),
        count(*) FILTER (WHERE NOT read)
    FROM public.broker_notifications;
END;
$function$;

-- 7. Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.auto_match_on_imovel() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_match_on_lead() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.find_matching_leads(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_alert_attended() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.parse_faixa_preco(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_qualified_leads_stats() FROM anon, authenticated;
