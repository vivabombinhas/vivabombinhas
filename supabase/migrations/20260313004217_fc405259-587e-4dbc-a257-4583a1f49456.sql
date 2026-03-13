
-- Dados de exemplo
INSERT INTO public.imoveis (
  codigo, titulo, descricao, finalidade, tipo, cidade, bairro, endereco,
  quartos, suites, banheiros, vagas_garagem, area_m2, capacidade_pessoas,
  mobiliado, piscina, vista_mar, frente_mar, churrasqueira, ar_condicionado, aceita_pet, wifi, estacionamento,
  preco, preco_temporada_diaria, condominio, iptu_anual,
  link_anuncio, origem, anunciante_nome, anunciante_telefone, anunciante_email, imobiliaria,
  status, destaque, observacoes
) VALUES
(
  'MR-001', 'Casa com vista para o mar em Mariscal', 
  'Linda casa de 3 quartos com vista panorâmica para o mar, totalmente mobiliada, ideal para temporada ou moradia.',
  'temporada', 'casa', 'Bombinhas', 'Mariscal', 'Rua dos Pescadores, 123',
  3, 1, 2, 2, 180.00, 8,
  true, true, true, false, true, true, true, true, true,
  NULL, 850.00, NULL, NULL,
  'https://exemplo.com/imovel/mr001', 'manual', 'João Silva', '(47) 99999-1234', 'joao@email.com', NULL,
  'ativo', true, 'Disponível para temporada de verão 2025/2026'
),
(
  'MR-002', 'Apartamento 2 quartos no centro de Bombinhas',
  'Apartamento bem localizado, próximo ao comércio e praia central. Ótimo para aluguel anual.',
  'aluguel_anual', 'apartamento', 'Bombinhas', 'Centro', 'Av. Brasil, 456 - Apto 301',
  2, 0, 1, 1, 65.00, NULL,
  false, false, false, false, false, true, false, false, true,
  2500.00, NULL, 350.00, 1200.00,
  NULL, 'imobiliaria', 'Imobiliária Litoral', '(47) 3393-0000', 'contato@litoral.com.br', 'Imobiliária Litoral',
  'ativo', false, NULL
),
(
  'MR-003', 'Cobertura duplex frente mar em Bombas',
  'Cobertura espetacular com 4 suítes, piscina privativa e vista frontal para o mar. Oportunidade única.',
  'venda', 'cobertura', 'Bombinhas', 'Bombas', 'Rua Atlântica, 789 - Cobertura',
  4, 4, 5, 3, 320.00, NULL,
  true, true, true, true, true, true, false, true, true,
  2800000.00, NULL, 1800.00, 8500.00,
  'https://exemplo.com/imovel/mr003', 'zap_imoveis', 'Maria Souza', '(47) 98888-5678', 'maria@email.com', 'Premium Imóveis',
  'ativo', true, 'Aceita financiamento bancário'
);
