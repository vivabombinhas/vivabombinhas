
-- Create status enum for submissions
CREATE TYPE public.status_submission AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- Create submissions table mirroring imoveis structure
CREATE TABLE public.imoveis_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_submission status_submission NOT NULL DEFAULT 'pendente',
  -- Property fields (same as imoveis)
  titulo text NOT NULL,
  descricao text,
  finalidade finalidade_imovel NOT NULL,
  tipo tipo_imovel NOT NULL,
  cidade text NOT NULL DEFAULT 'Bombinhas',
  bairro text,
  endereco text,
  quartos integer DEFAULT 0,
  suites integer DEFAULT 0,
  banheiros integer DEFAULT 0,
  vagas_garagem integer DEFAULT 0,
  area_m2 numeric,
  capacidade_pessoas integer,
  mobiliado boolean DEFAULT false,
  piscina boolean DEFAULT false,
  vista_mar boolean DEFAULT false,
  frente_mar boolean DEFAULT false,
  churrasqueira boolean DEFAULT false,
  ar_condicionado boolean DEFAULT false,
  aceita_pet boolean DEFAULT false,
  wifi boolean DEFAULT false,
  estacionamento boolean DEFAULT false,
  preco numeric,
  preco_temporada_diaria numeric,
  condominio numeric,
  iptu_anual numeric,
  fotos text[],
  link_anuncio text,
  anunciante_nome text,
  anunciante_telefone text,
  anunciante_email text,
  imobiliaria text,
  observacoes text,
  -- Track approval
  imovel_id uuid REFERENCES public.imoveis(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.imoveis_submissions ENABLE ROW LEVEL SECURITY;

-- Public insert
CREATE POLICY "Qualquer pessoa pode enviar submission"
  ON public.imoveis_submissions FOR INSERT TO public
  WITH CHECK (true);

-- Admin select
CREATE POLICY "Admins podem ver submissions"
  ON public.imoveis_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin update
CREATE POLICY "Admins podem atualizar submissions"
  ON public.imoveis_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
