
REVOKE EXECUTE ON FUNCTION public.auto_match_on_imovel() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.auto_match_on_lead() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.find_matching_leads(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.mark_alert_attended() FROM anon, authenticated, public;
