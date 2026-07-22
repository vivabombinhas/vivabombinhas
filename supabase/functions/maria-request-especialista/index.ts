// Marca um lead como "quer falar com especialista" a partir do MarIA Core (WhatsApp).
// Autenticado por x-core-secret.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-core-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  phone?: string;
  session_id?: string | null;
  lead_id?: string | null;
  imovel_id?: string | null;
  motivo?: string | null;
}

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

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const phone = body.phone?.toString().trim();
  const leadIdIn = body.lead_id?.toString().trim() || null;
  const sessionId = body.session_id?.toString().trim() || null;

  if (!phone && !leadIdIn && !sessionId) {
    return json({ error: "phone, lead_id ou session_id obrigatório" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Localizar lead
  let lead: { id: string; session_id: string | null; maria_core_session_id: string | null; nome: string | null } | null = null;

  if (leadIdIn) {
    const { data } = await supabase
      .from("leads_maria")
      .select("id, session_id, maria_core_session_id, nome")
      .eq("id", leadIdIn)
      .maybeSingle();
    lead = data ?? null;
  }
  if (!lead && sessionId) {
    const { data } = await supabase
      .from("leads_maria")
      .select("id, session_id, maria_core_session_id, nome")
      .or(`session_id.eq.${sessionId},maria_core_session_id.eq.${sessionId}`)
      .order("last_contact_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    lead = data ?? null;
  }
  if (!lead && phone) {
    const { data } = await supabase
      .from("leads_maria")
      .select("id, session_id, maria_core_session_id, nome")
      .eq("telefone", phone)
      .order("last_contact_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    lead = data ?? null;
  }

  // Auto-create lead if not found (must have phone or session_id)
  let autoCreated = false;
  if (!lead) {
    if (!phone && !sessionId) {
      return json({ error: "lead não encontrado e sem phone/session_id para criar" }, 404);
    }
    const { data: created, error: createErr } = await supabase
      .from("leads_maria")
      .insert({
        session_id: sessionId,
        maria_core_session_id: sessionId,
        telefone: phone ?? null,
        origem: "whatsapp",
        status: "anonimo",
        quer_falar_daniel: true,
        last_contact_at: new Date().toISOString(),
      })
      .select("id, session_id, maria_core_session_id, nome")
      .single();
    if (createErr || !created) {
      console.error("[maria-request-especialista] auto-create error", createErr);
      return json({ error: createErr?.message ?? "falha ao criar lead" }, 500);
    }
    lead = created;
    autoCreated = true;
  }

  const { error: updErr } = await supabase
    .from("leads_maria")
    .update({
      quer_falar_daniel: true,
      status: "contatado",
      last_contact_at: new Date().toISOString(),
      next_action_suggested: body.motivo ?? "Cliente pediu falar com especialista",
    })
    .eq("id", lead.id);

  if (updErr) {
    console.error("[maria-request-especialista] update error", updErr);
    return json({ error: updErr.message }, 500);
  }

  // Auditoria
  try {
    await supabase.from("lead_status_audit").insert({
      lead_id: lead.id,
      trigger_message: body.motivo ?? "Pediu especialista via WhatsApp (menu textual)",
      source: "maria_extraction",
      new_status: "contatado",
    });
  } catch (e) {
    console.warn("[maria-request-especialista] audit warning:", (e as Error).message);
  }

  try {
    await supabase.from("maria_core_events").insert({
      session_id: sessionId ?? lead.maria_core_session_id ?? lead.session_id,
      lead_id: lead.id,
      tipo: "especialista_requested",
      payload: {
        phone: phone ?? null,
        imovel_id: body.imovel_id ?? null,
        motivo: body.motivo ?? null,
      },
    });
  } catch (e) {
    console.warn("[maria-request-especialista] event warning:", (e as Error).message);
  }

  const nome = lead.nome?.split(" ")[0] ?? "";
  const confirmMessage = nome
    ? `Perfeito, ${nome}! Já avisei nosso especialista aqui em Bombinhas. Em instantes ele entra em contato por aqui mesmo. 🙌`
    : "Perfeito! Já avisei nosso especialista aqui em Bombinhas. Em instantes ele entra em contato por aqui mesmo. 🙌";

  return json({
    ok: true,
    lead_id: lead.id,
    auto_created: autoCreated,
    confirm_message: confirmMessage,
  });
});
