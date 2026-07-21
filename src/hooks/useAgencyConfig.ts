import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgencyConfig {
  id: string;
  nome: string;
  whatsapp: string;
  email: string | null;
  creci: string | null;
}

// Cache curto porque muda raramente. Public read (RLS permite anon SELECT).
export function useAgencyConfig() {
  return useQuery({
    queryKey: ["agency-config"],
    staleTime: 1000 * 60 * 30, // 30 min
    queryFn: async (): Promise<AgencyConfig | null> => {
      const { data, error } = await supabase
        .from("config_imobiliaria")
        .select("id, nome, whatsapp, email, creci")
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn("[useAgencyConfig] fallback (erro):", error.message);
        return null;
      }
      return data as AgencyConfig | null;
    },
  });
}

// Fallback caso a query ainda não tenha carregado ou falhe.
export const AGENCY_FALLBACK: AgencyConfig = {
  id: "fallback",
  nome: "Viva Bombinhas",
  whatsapp: "554199992422",
  email: null,
  creci: null,
};
