
-- 1. Drop RLS policy that references status
DROP POLICY IF EXISTS "Imóveis ativos são públicos para leitura" ON public.imoveis;

-- 2. Drop default on status
ALTER TABLE public.imoveis ALTER COLUMN status DROP DEFAULT;

-- 3. Finalidade: venda → compra
ALTER TABLE public.imoveis ALTER COLUMN finalidade TYPE text;
UPDATE public.imoveis SET finalidade = 'compra' WHERE finalidade = 'venda';
DROP TYPE public.finalidade_imovel;
CREATE TYPE public.finalidade_imovel AS ENUM ('compra', 'aluguel_anual', 'temporada');
ALTER TABLE public.imoveis ALTER COLUMN finalidade TYPE public.finalidade_imovel USING finalidade::public.finalidade_imovel;

-- 4. Tipo: remove kitnet/duplex/triplex, rename comercial, add pousada/sala_comercial/outro
ALTER TABLE public.imoveis ALTER COLUMN tipo TYPE text;
UPDATE public.imoveis SET tipo = 'outro' WHERE tipo IN ('kitnet', 'duplex', 'triplex');
UPDATE public.imoveis SET tipo = 'sala_comercial' WHERE tipo = 'comercial';
DROP TYPE public.tipo_imovel;
CREATE TYPE public.tipo_imovel AS ENUM ('apartamento', 'casa', 'cobertura', 'terreno', 'sobrado', 'studio', 'pousada', 'sala_comercial', 'outro');
ALTER TABLE public.imoveis ALTER COLUMN tipo TYPE public.tipo_imovel USING tipo::public.tipo_imovel;

-- 5. Status: remove vendido/alugado
ALTER TABLE public.imoveis ALTER COLUMN status TYPE text;
UPDATE public.imoveis SET status = 'removido' WHERE status IN ('vendido', 'alugado');
DROP TYPE public.status_imovel;
CREATE TYPE public.status_imovel AS ENUM ('ativo', 'pausado', 'removido');
ALTER TABLE public.imoveis ALTER COLUMN status TYPE public.status_imovel USING status::public.status_imovel;
ALTER TABLE public.imoveis ALTER COLUMN status SET DEFAULT 'ativo'::public.status_imovel;

-- 6. Recreate RLS policy
CREATE POLICY "Imóveis ativos são públicos para leitura"
  ON public.imoveis FOR SELECT TO public
  USING (status = 'ativo'::public.status_imovel);
