
-- Enums para padronização
CREATE TYPE public.finalidade_imovel AS ENUM ('venda', 'aluguel_anual', 'temporada');
CREATE TYPE public.tipo_imovel AS ENUM ('casa', 'apartamento', 'cobertura', 'kitnet', 'studio', 'terreno', 'comercial', 'sobrado', 'duplex', 'triplex');
CREATE TYPE public.status_imovel AS ENUM ('ativo', 'pausado', 'removido', 'vendido', 'alugado');
CREATE TYPE public.origem_anuncio AS ENUM ('manual', 'olx', 'zap_imoveis', 'imovel_web', 'viva_real', 'airbnb', 'booking', 'imobiliaria', 'whatsapp', 'outro');

-- Tabela principal de imóveis
CREATE TABLE public.imoveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificação
  codigo TEXT UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  
  -- Classificação
  finalidade finalidade_imovel NOT NULL,
  tipo tipo_imovel NOT NULL,
  
  -- Localização
  cidade TEXT NOT NULL DEFAULT 'Bombinhas',
  bairro TEXT,
  endereco TEXT,
  
  -- Características principais
  quartos INTEGER DEFAULT 0,
  suites INTEGER DEFAULT 0,
  banheiros INTEGER DEFAULT 0,
  vagas_garagem INTEGER DEFAULT 0,
  area_m2 NUMERIC(10,2),
  capacidade_pessoas INTEGER,
  
  -- Características booleanas
  mobiliado BOOLEAN DEFAULT false,
  piscina BOOLEAN DEFAULT false,
  vista_mar BOOLEAN DEFAULT false,
  frente_mar BOOLEAN DEFAULT false,
  churrasqueira BOOLEAN DEFAULT false,
  ar_condicionado BOOLEAN DEFAULT false,
  aceita_pet BOOLEAN DEFAULT false,
  wifi BOOLEAN DEFAULT false,
  estacionamento BOOLEAN DEFAULT false,
  
  -- Preço
  preco NUMERIC(12,2),
  preco_temporada_diaria NUMERIC(10,2),
  condominio NUMERIC(10,2),
  iptu_anual NUMERIC(10,2),
  
  -- Anúncio
  link_anuncio TEXT,
  fotos TEXT[], -- array de URLs
  origem origem_anuncio DEFAULT 'manual',
  
  -- Contato do anunciante
  anunciante_nome TEXT,
  anunciante_telefone TEXT,
  anunciante_email TEXT,
  imobiliaria TEXT,
  
  -- Controle
  status status_imovel NOT NULL DEFAULT 'ativo',
  destaque BOOLEAN DEFAULT false,
  observacoes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX idx_imoveis_finalidade ON public.imoveis(finalidade);
CREATE INDEX idx_imoveis_tipo ON public.imoveis(tipo);
CREATE INDEX idx_imoveis_bairro ON public.imoveis(bairro);
CREATE INDEX idx_imoveis_status ON public.imoveis(status);
CREATE INDEX idx_imoveis_preco ON public.imoveis(preco);
CREATE INDEX idx_imoveis_quartos ON public.imoveis(quartos);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_imoveis_updated_at
  BEFORE UPDATE ON public.imoveis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS: permitir leitura pública dos imóveis ativos
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Imóveis ativos são públicos para leitura"
  ON public.imoveis
  FOR SELECT
  USING (status = 'ativo');

-- Permitir inserção anônima (formulário público de anúncio)
CREATE POLICY "Qualquer pessoa pode cadastrar imóvel"
  ON public.imoveis
  FOR INSERT
  WITH CHECK (true);
