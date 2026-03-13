
CREATE TABLE public.leads_maria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text NOT NULL,
  email text,
  interesse text,
  bairro_interesse text,
  tipo_imovel text,
  faixa_preco text,
  mensagem_original text,
  origem text NOT NULL DEFAULT 'maria_chat',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_maria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode cadastrar lead via MarIA"
ON public.leads_maria
FOR INSERT
TO public
WITH CHECK (true);
