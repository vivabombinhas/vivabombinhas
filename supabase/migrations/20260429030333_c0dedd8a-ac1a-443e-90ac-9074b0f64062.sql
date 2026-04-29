-- Atualiza find_matching_leads e auto_match_on_lead para considerar mais critérios
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
        (CASE WHEN l.bairro_interesse IS NOT NULL AND lower(l.bairro_interesse) = lower(coalesce(imv.bairro,'')) THEN 35 ELSE 0 END) +
        (CASE WHEN l.tipo_imovel IS NOT NULL AND lower(l.tipo_imovel) LIKE '%' || lower(imv.tipo::text) || '%' THEN 25 ELSE 0 END) +
        (CASE
          WHEN imv.preco IS NOT NULL AND (parse_faixa_preco(l.faixa_preco))[2] IS NOT NULL
               AND imv.preco <= (parse_faixa_preco(l.faixa_preco))[2]
               AND ((parse_faixa_preco(l.faixa_preco))[1] IS NULL OR imv.preco >= (parse_faixa_preco(l.faixa_preco))[1])
          THEN 25 ELSE 0 END) +
        (CASE WHEN l.mensagem_original ~* '(\d+)\s*(quarto|dormit)' AND imv.quartos >= (regexp_match(l.mensagem_original, '(\d+)\s*(quarto|dormit)', 'i'))[1]::int THEN 5 ELSE 0 END) +
        (CASE WHEN imv.vista_mar = true AND l.mensagem_original ~* 'vista.*mar' THEN 5 ELSE 0 END) +
        (CASE WHEN imv.aceita_pet = true AND l.mensagem_original ~* '(pet|cachorr|gato|animal)' THEN 3 ELSE 0 END) +
        (CASE WHEN imv.mobiliado = true AND l.mensagem_original ~* 'mobili' THEN 2 ELSE 0 END)
      )::INTEGER AS score,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN l.bairro_interesse IS NOT NULL AND lower(l.bairro_interesse) = lower(coalesce(imv.bairro,'')) THEN 'Bairro: ' || imv.bairro END,
        CASE WHEN l.tipo_imovel IS NOT NULL AND lower(l.tipo_imovel) LIKE '%' || lower(imv.tipo::text) || '%' THEN 'Tipo: ' || imv.tipo::text END,
        CASE
          WHEN imv.preco IS NOT NULL AND (parse_faixa_preco(l.faixa_preco))[2] IS NOT NULL
               AND imv.preco <= (parse_faixa_preco(l.faixa_preco))[2]
          THEN 'Preço dentro da faixa' END,
        CASE WHEN l.mensagem_original ~* '(\d+)\s*(quarto|dormit)' AND imv.quartos >= (regexp_match(l.mensagem_original, '(\d+)\s*(quarto|dormit)', 'i'))[1]::int THEN 'Quartos suficientes (' || imv.quartos || ')' END,
        CASE WHEN imv.vista_mar = true AND l.mensagem_original ~* 'vista.*mar' THEN 'Vista mar' END,
        CASE WHEN imv.aceita_pet = true AND l.mensagem_original ~* '(pet|cachorr|gato|animal)' THEN 'Aceita pet' END,
        CASE WHEN imv.mobiliado = true AND l.mensagem_original ~* 'mobili' THEN 'Mobiliado' END
      ], NULL) AS reasons
    FROM public.leads_maria l
    WHERE l.status NOT IN ('convertido', 'descartado')
  ) sub
  WHERE sub.score >= 30;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_match_on_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  imv RECORD;
  faixa NUMERIC[];
  s INTEGER;
  reasons TEXT[];
  qreq INTEGER;
BEGIN
  faixa := parse_faixa_preco(NEW.faixa_preco);
  qreq := NULL;
  IF NEW.mensagem_original ~* '(\d+)\s*(quarto|dormit)' THEN
    qreq := (regexp_match(NEW.mensagem_original, '(\d+)\s*(quarto|dormit)', 'i'))[1]::int;
  END IF;

  FOR imv IN SELECT * FROM public.imoveis WHERE status = 'ativo' LOOP
    s := 0;
    reasons := ARRAY[]::TEXT[];

    IF NEW.bairro_interesse IS NOT NULL AND lower(NEW.bairro_interesse) = lower(coalesce(imv.bairro,'')) THEN
      s := s + 35; reasons := array_append(reasons, 'Bairro: ' || imv.bairro);
    END IF;
    IF NEW.tipo_imovel IS NOT NULL AND lower(NEW.tipo_imovel) LIKE '%' || lower(imv.tipo::text) || '%' THEN
      s := s + 25; reasons := array_append(reasons, 'Tipo: ' || imv.tipo::text);
    END IF;
    IF imv.preco IS NOT NULL AND faixa[2] IS NOT NULL AND imv.preco <= faixa[2]
       AND (faixa[1] IS NULL OR imv.preco >= faixa[1]) THEN
      s := s + 25; reasons := array_append(reasons, 'Preço dentro da faixa');
    END IF;
    IF qreq IS NOT NULL AND imv.quartos >= qreq THEN
      s := s + 5; reasons := array_append(reasons, 'Quartos suficientes (' || imv.quartos || ')');
    END IF;
    IF imv.vista_mar = true AND NEW.mensagem_original ~* 'vista.*mar' THEN
      s := s + 5; reasons := array_append(reasons, 'Vista mar');
    END IF;
    IF imv.aceita_pet = true AND NEW.mensagem_original ~* '(pet|cachorr|gato|animal)' THEN
      s := s + 3; reasons := array_append(reasons, 'Aceita pet');
    END IF;
    IF imv.mobiliado = true AND NEW.mensagem_original ~* 'mobili' THEN
      s := s + 2; reasons := array_append(reasons, 'Mobiliado');
    END IF;

    IF s >= 30 THEN
      INSERT INTO public.lead_matches (lead_id, imovel_id, score, match_reasons)
      VALUES (NEW.id, imv.id, s, reasons)
      ON CONFLICT (lead_id, imovel_id) DO UPDATE
        SET score = EXCLUDED.score, match_reasons = EXCLUDED.match_reasons, updated_at = now();
    END IF;
  END LOOP;
  RETURN NEW;
END;
$function$;

-- Recalcular matches existentes para leads ativos (sem alterar status já decidido)
DELETE FROM public.lead_matches WHERE status = 'pending';

INSERT INTO public.lead_matches (lead_id, imovel_id, score, match_reasons)
SELECT m.lead_id, i.id, m.score, m.reasons
FROM public.imoveis i
CROSS JOIN LATERAL public.find_matching_leads(i.id) m
WHERE i.status = 'ativo'
ON CONFLICT (lead_id, imovel_id) DO NOTHING;