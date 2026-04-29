REVOKE EXECUTE ON FUNCTION public.auto_match_on_imovel() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.auto_match_on_lead() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.find_matching_leads(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.parse_faixa_preco(text) FROM anon, authenticated, public;