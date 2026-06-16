REVOKE ALL ON FUNCTION public.admin_list_imoveis() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_imoveis() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_imoveis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_imoveis() TO service_role;