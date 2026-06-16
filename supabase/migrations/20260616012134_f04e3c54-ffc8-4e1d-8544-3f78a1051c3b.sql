
ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS distancia_praia_m integer,
  ADD COLUMN IF NOT EXISTS micro_regiao text,
  ADD COLUMN IF NOT EXISTS condicao text,
  ADD COLUMN IF NOT EXISTS aceita_financiamento boolean,
  ADD COLUMN IF NOT EXISTS aceita_permuta boolean,
  ADD COLUMN IF NOT EXISTS permuta_descricao text,
  ADD COLUMN IF NOT EXISTS pontos_fortes text[],
  ADD COLUMN IF NOT EXISTS pontos_atencao text[],
  ADD COLUMN IF NOT EXISTS perfil_lead_ideal text,
  ADD COLUMN IF NOT EXISTS argumentos_venda text,
  ADD COLUMN IF NOT EXISTS tags_maria text[],
  ADD COLUMN IF NOT EXISTS resumo_estrategico_ia text,
  ADD COLUMN IF NOT EXISTS observacoes_internas_daniel text,
  ADD COLUMN IF NOT EXISTS qualidade_score integer;

COMMENT ON COLUMN public.imoveis.distancia_praia_m IS 'Distância até a praia em metros (curadoria)';
COMMENT ON COLUMN public.imoveis.micro_regiao IS 'Micro-região: orla, miolo, alto, beira-rodovia, etc.';
COMMENT ON COLUMN public.imoveis.condicao IS 'planta | em_obra | pronto_novo | usado_conservado | reforma';
COMMENT ON COLUMN public.imoveis.qualidade_score IS 'Score 0-100 calculado a partir da completude da curadoria';
