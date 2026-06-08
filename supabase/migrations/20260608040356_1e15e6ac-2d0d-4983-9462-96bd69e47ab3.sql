ALTER FUNCTION public.check_maria_filter_spikes() SET search_path = public;
REVOKE ALL ON FUNCTION public.check_maria_filter_spikes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_maria_filter_spikes() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_maria_filter_spikes() TO authenticated;
