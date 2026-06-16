CREATE OR REPLACE FUNCTION public.admin_list_imoveis()
RETURNS SETOF public.imoveis
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.*
  FROM public.imoveis i
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY i.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_imoveis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_imoveis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_imoveis() TO service_role;