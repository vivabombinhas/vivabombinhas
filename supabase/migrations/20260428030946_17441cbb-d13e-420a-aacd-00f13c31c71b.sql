-- 1. Adiciona coluna gestao_propria
ALTER TABLE public.imoveis 
ADD COLUMN IF NOT EXISTS gestao_propria boolean NOT NULL DEFAULT false;

ALTER TABLE public.imoveis_submissions
ADD COLUMN IF NOT EXISTS gestao_propria boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_imoveis_gestao_propria ON public.imoveis(gestao_propria) WHERE gestao_propria = true;

-- 2. Tabela de configuração da imobiliária
CREATE TABLE IF NOT EXISTS public.config_imobiliaria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  creci text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.config_imobiliaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config imobiliária é pública para leitura"
ON public.config_imobiliaria FOR SELECT
USING (ativo = true);

CREATE POLICY "Admins podem inserir config"
ON public.config_imobiliaria FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar config"
ON public.config_imobiliaria FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar config"
ON public.config_imobiliaria FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_config_imobiliaria_updated_at
BEFORE UPDATE ON public.config_imobiliaria
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Insere dados da Viva Bombinhas
INSERT INTO public.config_imobiliaria (nome, whatsapp, email, ativo)
VALUES ('Viva Bombinhas', '41998251888', 'contato@vivabombinhas.com.br', true);