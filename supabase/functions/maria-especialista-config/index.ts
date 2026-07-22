// Retorna o contato do especialista (Daniel) a partir de config_imobiliaria.
// Fonte única de verdade — o Core chama uma vez por sessão e cacheia.
// Autenticado por x-core-secret (não expor ao browser).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-core-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const provided = req.headers.get("x-core-secret");
  const expected = Deno.env.get("CORE_EDGE_SECRET");
  if (!expected || provided !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("config_imobiliaria")
    .select("nome, whatsapp, email, creci")
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[maria-especialista-config] db error", error);
    return json({ error: error.message }, 500);
  }
  if (!data) {
    return json({ error: "config_imobiliaria não configurada" }, 404);
  }

  const rawPhone = (data.whatsapp ?? "").toString().replace(/\D/g, "");
  // Normaliza para formato internacional (55 + DDD + número) quando vier só com DDD
  const phone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;

  return json({
    phone,
    phone_raw: data.whatsapp,
    nome: data.nome,
    email: data.email,
    creci: data.creci,
    label: "Especialista VIV Bombinhas",
  });
});
