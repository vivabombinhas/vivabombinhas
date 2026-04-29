-- Revoke direct anon/authenticated read access to advertiser PII columns on public.imoveis.
-- Public listings remain readable (status='ativo'), but contact data is only accessible via
-- the maria-search edge function (service role) which mediates contact through the agency.

REVOKE SELECT (anunciante_nome, anunciante_telefone, anunciante_email)
  ON public.imoveis FROM anon, authenticated;