-- Restore explicit relationships used by the admin Matches screen
ALTER TABLE public.lead_matches
  ADD CONSTRAINT lead_matches_lead_id_fkey
  FOREIGN KEY (lead_id)
  REFERENCES public.leads_maria(id)
  ON DELETE CASCADE;

ALTER TABLE public.lead_matches
  ADD CONSTRAINT lead_matches_imovel_id_fkey
  FOREIGN KEY (imovel_id)
  REFERENCES public.imoveis(id)
  ON DELETE CASCADE;

-- Recreate triggers that keep matches current and timestamps updated
DROP TRIGGER IF EXISTS update_lead_matches_updated_at ON public.lead_matches;
CREATE TRIGGER update_lead_matches_updated_at
  BEFORE UPDATE ON public.lead_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_auto_match_on_imovel ON public.imoveis;
CREATE TRIGGER trg_auto_match_on_imovel
  AFTER INSERT OR UPDATE OF status ON public.imoveis
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_match_on_imovel();

DROP TRIGGER IF EXISTS trg_auto_match_on_lead ON public.leads_maria;
CREATE TRIGGER trg_auto_match_on_lead
  AFTER INSERT ON public.leads_maria
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_match_on_lead();

-- SECURITY DEFINER trigger/helper functions are internal implementation details.
-- They should not be callable through public RPC endpoints.
REVOKE EXECUTE ON FUNCTION public.auto_match_on_imovel() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_match_on_lead() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.find_matching_leads(uuid) FROM authenticated;

-- Keep admin role checks usable by authenticated RLS policies, but do not allow anonymous calls.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- Utility function is not security definer, but it does not need anonymous RPC access.
REVOKE EXECUTE ON FUNCTION public.parse_faixa_preco(text) FROM PUBLIC, anon;