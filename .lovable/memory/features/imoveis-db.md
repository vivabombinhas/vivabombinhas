Tabela `imoveis` com enums padronizados. RLS: leitura pública para ativos, inserção pública.

## Enums
- finalidade_imovel: 'compra', 'aluguel_anual', 'temporada'
- tipo_imovel: 'apartamento', 'casa', 'cobertura', 'terreno', 'sobrado', 'studio', 'pousada', 'sala_comercial', 'outro'
- status_imovel: 'ativo', 'pausado', 'removido'
- origem_anuncio: 'manual', 'olx', 'zap_imoveis', 'imovel_web', 'viva_real', 'airbnb', 'booking', 'imobiliaria', 'whatsapp', 'outro'

## Campos principais
- Identificação: id, codigo, titulo, descricao
- Localização: cidade (default 'Bombinhas'), bairro, endereco
- Classificação: finalidade, tipo, status, origem
- Características: quartos, suites, banheiros, vagas_garagem, area_m2, capacidade_pessoas
- Amenidades (boolean): mobiliado, piscina, vista_mar, frente_mar, churrasqueira, ar_condicionado, aceita_pet, wifi, estacionamento
- Preço: preco, preco_temporada_diaria, condominio, iptu_anual
- Anunciante: anunciante_nome, anunciante_telefone, anunciante_email, imobiliaria
- Mídia: fotos (array), link_anuncio
- Controle: destaque, observacoes, created_at, updated_at

## RLS
- SELECT: público para status='ativo'
- INSERT: público (WITH CHECK true) para cadastro anônimo
