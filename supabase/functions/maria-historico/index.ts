import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-core-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const provided = req.headers.get("x-core-secret");
  const expected = Deno.env.get("CORE_EDGE_SECRET");
  if (!expected || provided !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: { phone?: string; limit?: number } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const phone = body.phone?.toString().trim();
  if (!phone) {
    return json({ error: "phone required" }, 400);
  }
  const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 200);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Encontra leads com esse telefone
  const { data: leads, error: leadsErr } = await supabase
    .from("leads_maria")
    .select("id")
    .eq("telefone", phone);

  if (leadsErr) {
    console.error("[maria-historico] leads lookup error", leadsErr);
    return json({ error: leadsErr.message }, 500);
  }

  const leadIds = (leads ?? []).map((l: any) => l.id);
  if (leadIds.length === 0) {
    return json({ messages: [] });
  }

  // Busca últimas N mensagens desses leads (canal whatsapp / atendente_whatsapp / null)
  const { data: msgs, error: msgsErr } = await supabase
    .from("maria_messages")
    .select("role, content, created_at, mode")
    .in("lead_id", leadIds)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (msgsErr) {
    console.error("[maria-historico] messages error", msgsErr);
    return json({ error: msgsErr.message }, 500);
  }

  const ordered = (msgs ?? [])
    .slice()
    .reverse()
    .map((m: any) => ({ role: m.role, content: m.content }));

  return json({ messages: ordered });
});
