-- Status enum for matches
CREATE TYPE public.match_status AS ENUM ('pending', 'sent', 'converted', 'dismissed');

-- Matches table
CREATE TABLE public.lead_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  imovel_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  match_reasons TEXT[] DEFAULT '{}',
  status public.match_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lead_id, imovel_id)
);

CREATE INDEX idx_lead_matches_status ON public.lead_matches(status);
CREATE INDEX idx_lead_matches_lead ON public.lead_matches(lead_id);
CREATE INDEX idx_lead_matches_imovel ON public.lead_matches(imovel_id);

ALTER TABLE public.lead_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem matches" ON public.lead_matches
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins criam matches" ON public.lead_matches
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins atualizam matches" ON public.lead_matches
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins deletam matches" ON public.lead_matches
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_lead_matches_updated_at
  BEFORE UPDATE ON public.lead_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Helper: parse "R$ 1.500 - R$ 3.000" / "ate 2000" / "1500-3000" into [min, max]
CREATE OR REPLACE FUNCTION public.parse_faixa_preco(faixa TEXT)
RETURNS NUMERIC[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  cleaned TEXT;
  nums NUMERIC[];
  matches TEXT[];
  m TEXT;
BEGIN
  IF faixa IS NULL OR faixa = '' THEN
    RETURN ARRAY[NULL, NULL]::NUMERIC[];
  END IF;
  cleaned := lower(faixa);
  nums := ARRAY[]::NUMERIC[];
  FOR m IN SELECT unnest(regexp_matches(cleaned, '(\d+(?:[\.,]\d+)*)', 'g')) LOOP
    nums := array_append(nums, replace(replace(m, '.', ''), ',', '.')::NUMERIC);
  END LOOP;
  IF array_length(nums, 1) IS NULL THEN
    RETURN ARRAY[NULL, NULL]::NUMERIC[];
  ELSIF array_length(nums, 1) = 1 THEN
    IF cleaned LIKE '%ate%' OR cleaned LIKE '%até%' OR cleaned LIKE '%max%' THEN
      RETURN ARRAY[NULL, nums[1]]::NUMERIC[];
    ELSIF cleaned LIKE '%partir%' OR cleaned LIKE '%min%' OR cleaned LIKE '%acima%' THEN
      RETURN ARRAY[nums[1], NULL]::NUMERIC[];
    ELSE
      RETURN ARRAY[nums[1] * 0.8, nums[1] * 1.2]::NUMERIC[];
    END IF;
  ELSE
    RETURN ARRAY[nums[1], nums[2]]::NUMERIC[];
  END IF;
END;
$$;

-- Find matching leads for a given imovel
CREATE OR REPLACE FUNCTION public.find_matching_leads(_imovel_id UUID)
RETURNS TABLE (
  lead_id UUID,
  score INTEGER,
  reasons TEXT[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  imv RECORD;
BEGIN
  SELECT * INTO imv FROM public.imoveis WHERE id = _imovel_id;
  IF NOT FOUND THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    l.id,
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
  HAVING (
    (CASE WHEN l.bairro_interesse IS NOT NULL AND lower(l.bairro_interesse) = lower(coalesce(imv.bairro,'')) THEN 40 ELSE 0 END) +
    (CASE WHEN l.tipo_imovel IS NOT NULL AND lower(l.tipo_imovel) LIKE '%' || lower(imv.tipo::text) || '%' THEN 30 ELSE 0 END) +
    (CASE
      WHEN imv.preco IS NOT NULL AND (parse_faixa_preco(l.faixa_preco))[2] IS NOT NULL
           AND imv.preco <= (parse_faixa_preco(l.faixa_preco))[2]
           AND ((parse_faixa_preco(l.faixa_preco))[1] IS NULL OR imv.preco >= (parse_faixa_preco(l.faixa_preco))[1])
      THEN 30 ELSE 0 END)
  ) >= 30;
END;
$$;

-- Trigger to auto-create matches when a new ACTIVE imovel is inserted/activated
CREATE OR REPLACE FUNCTION public.auto_match_on_imovel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'ativo' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'ativo') THEN
    INSERT INTO public.lead_matches (lead_id, imovel_id, score, match_reasons)
    SELECT m.lead_id, NEW.id, m.score, m.reasons
    FROM public.find_matching_leads(NEW.id) m
    ON CONFLICT (lead_id, imovel_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_match_on_imovel
  AFTER INSERT OR UPDATE OF status ON public.imoveis
  FOR EACH ROW EXECUTE FUNCTION public.auto_match_on_imovel();

-- Also: when a new lead is created, match against existing active properties
CREATE OR REPLACE FUNCTION public.auto_match_on_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  imv RECORD;
  faixa NUMERIC[];
  s INTEGER;
  reasons TEXT[];
BEGIN
  faixa := parse_faixa_preco(NEW.faixa_preco);
  FOR imv IN SELECT * FROM public.imoveis WHERE status = 'ativo' LOOP
    s := 0;
    reasons := ARRAY[]::TEXT[];
    IF NEW.bairro_interesse IS NOT NULL AND lower(NEW.bairro_interesse) = lower(coalesce(imv.bairro,'')) THEN
      s := s + 40; reasons := array_append(reasons, 'Bairro: ' || imv.bairro);
    END IF;
    IF NEW.tipo_imovel IS NOT NULL AND lower(NEW.tipo_imovel) LIKE '%' || lower(imv.tipo::text) || '%' THEN
      s := s + 30; reasons := array_append(reasons, 'Tipo: ' || imv.tipo::text);
    END IF;
    IF imv.preco IS NOT NULL AND faixa[2] IS NOT NULL AND imv.preco <= faixa[2]
       AND (faixa[1] IS NULL OR imv.preco >= faixa[1]) THEN
      s := s + 30; reasons := array_append(reasons, 'Preço dentro da faixa');
    END IF;
    IF s >= 30 THEN
      INSERT INTO public.lead_matches (lead_id, imovel_id, score, match_reasons)
      VALUES (NEW.id, imv.id, s, reasons)
      ON CONFLICT (lead_id, imovel_id) DO NOTHING;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_match_on_lead
  AFTER INSERT ON public.leads_maria
  FOR EACH ROW EXECUTE FUNCTION public.auto_match_on_lead();