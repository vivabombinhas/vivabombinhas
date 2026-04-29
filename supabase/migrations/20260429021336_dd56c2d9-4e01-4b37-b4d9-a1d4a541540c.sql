CREATE OR REPLACE FUNCTION public.find_matching_leads(_imovel_id uuid)
 RETURNS TABLE(lead_id uuid, score integer, reasons text[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  imv RECORD;
BEGIN
  SELECT * INTO imv FROM public.imoveis WHERE id = _imovel_id;
  IF NOT FOUND THEN RETURN; END IF;

  RETURN QUERY
  SELECT * FROM (
    SELECT
      l.id AS lead_id,
      (
        (CASE WHEN l.bairro_interesse IS NOT NULL AND lower(l.bairro_interesse) = lower(coalesce(imv.bairro,'')) THEN 40 ELSE 0 END) +
        (CASE WHEN l.tipo_imovel IS NOT NULL AND lower(l.tipo_imovel) LIKE '%' || lower(imv.tipo::text) || '%' THEN 30 ELSE 0 END) +
        (CASE
          WHEN imv.preco IS NOT NULL AND (parse_faixa_preco(l.faixa_preco))[2] IS NOT NULL
               AND imv.preco <= (parse_faixa_preco(l.faixa_preco))[2]
               AND ((parse_faixa_preco(l.faixa_preco))[1] IS NULL OR imv.preco >= (parse_faixa_preco(l.faixa_preco))[1])
          THEN 30 ELSE 0 END)
      )::INTEGER AS score,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN l.bairro_interesse IS NOT NULL AND lower(l.bairro_interesse) = lower(coalesce(imv.bairro,'')) THEN 'Bairro: ' || imv.bairro END,
        CASE WHEN l.tipo_imovel IS NOT NULL AND lower(l.tipo_imovel) LIKE '%' || lower(imv.tipo::text) || '%' THEN 'Tipo: ' || imv.tipo::text END,
        CASE
          WHEN imv.preco IS NOT NULL AND (parse_faixa_preco(l.faixa_preco))[2] IS NOT NULL
               AND imv.preco <= (parse_faixa_preco(l.faixa_preco))[2]
          THEN 'Preço dentro da faixa' END
      ], NULL) AS reasons
    FROM public.leads_maria l
    WHERE l.status NOT IN ('convertido', 'descartado')
  ) sub
  WHERE sub.score >= 30;
END;
$function$;