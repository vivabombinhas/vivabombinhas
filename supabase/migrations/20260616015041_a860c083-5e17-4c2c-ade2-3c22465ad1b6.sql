DROP FUNCTION IF EXISTS public.admin_list_imoveis();

DROP POLICY IF EXISTS "Anyone can view active properties" ON public.imoveis;
DROP POLICY IF EXISTS "Imóveis ativos são públicos para leitura" ON public.imoveis;
DROP POLICY IF EXISTS "Imóveis ativos são públicos para leitura anon" ON public.imoveis;
DROP POLICY IF EXISTS "Admins can view all imoveis" ON public.imoveis;

CREATE POLICY "Imóveis ativos são públicos para leitura anon"
ON public.imoveis
FOR SELECT
TO anon
USING (status = 'ativo'::public.status_imovel);

CREATE POLICY "Admins can view all imoveis"
ON public.imoveis
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE SELECT ON TABLE public.imoveis FROM anon, authenticated;

GRANT SELECT (
  id, codigo, titulo, descricao, finalidade, tipo, origem, cidade, bairro, endereco,
  quartos, suites, banheiros, vagas_garagem, area_m2, capacidade_pessoas,
  mobiliado, piscina, vista_mar, frente_mar, churrasqueira, ar_condicionado,
  aceita_pet, wifi, estacionamento, fotos, preco, preco_temporada_diaria,
  condominio, iptu_anual, link_anuncio, imobiliaria, destaque,
  observacoes, gestao_propria, status, created_at, updated_at,
  destaque_pago, destaque_ate, destaque_valor, destaque_premium,
  oculta_para_maria, last_curated_at, curador_id, user_id,
  distancia_praia_m, micro_regiao, condicao, aceita_financiamento,
  aceita_permuta, permuta_descricao, pontos_fortes, pontos_atencao,
  perfil_lead_ideal, argumentos_venda, tags_maria, resumo_estrategico_ia,
  observacoes_internas_daniel, qualidade_score
) ON TABLE public.imoveis TO anon;

GRANT SELECT ON TABLE public.imoveis TO authenticated;
GRANT ALL ON TABLE public.imoveis TO service_role;