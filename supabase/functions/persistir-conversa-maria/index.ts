import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-core-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  session_id?: string;
  channel?: string;
  phone?: string | null;
  name?: string | null;
  finalidade?: string | null;
  status?: string | null;
  resumo_ia?: string | null;
  next_action?: string | null;
  handoff?: boolean | null;
  mode?: string | null;
  extracted_fields?: {
    budget_max?: number | null;
    budget_min?: number | null;
    neighborhood?: string | null;
    guest_count?: number | null;
    property_type?: string | null;
  } | null;
  messages?: Message[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const provided = req.headers.get("x-core-secret");
  const expected = Deno.env.get("CORE_EDGE_SECRET");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sessionId = body.session_id?.trim();
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "session_id required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ef = body.extracted_fields ?? {};
  const channel = (body.channel ?? "whatsapp").toLowerCase();
  const origem = channel === "whatsapp" ? "whatsapp" : "maria_chat";

  // Build patch — omit empty strings so we never overwrite existing contact with blank
  const patch: Record<string, unknown> = {
    maria_core_session_id: sessionId,
    origem,
    last_contact_at: new Date().toISOString(),
  };
  if (body.name && body.name.trim()) patch.nome = body.name.trim();
  if (body.phone && body.phone.trim()) patch.telefone = body.phone.trim();
  if (body.finalidade) patch.finalidade = body.finalidade;
  if (body.resumo_ia) patch.resumo_ia = body.resumo_ia;
  if (body.next_action) patch.next_action_suggested = body.next_action;
  if (typeof body.handoff === "boolean") patch.quer_falar_daniel = body.handoff;
  if (ef.neighborhood) patch.bairro_interesse = ef.neighborhood;
  if (ef.property_type) patch.tipo_imovel = ef.property_type;
  if (ef.budget_max != null) patch.orcamento_max = ef.budget_max;
  if (ef.budget_min != null) patch.orcamento_min = ef.budget_min;

  try {
    // Lookup by maria_core_session_id first, then session_id, then telefone
    let existing: any = null;
    {
      const { data } = await supabase
        .from("leads_maria")
        .select("id, nome, telefone, status")
        .eq("maria_core_session_id", sessionId)
        .maybeSingle();
      existing = data;
    }
    if (!existing) {
      const { data } = await supabase
        .from("leads_maria")
        .select("id, nome, telefone, status")
        .eq("session_id", sessionId)
        .maybeSingle();
      existing = data;
    }
    if (!existing && patch.telefone) {
      const { data } = await supabase
        .from("leads_maria")
        .select("id, nome, telefone, status")
        .eq("telefone", patch.telefone as string)
        .limit(1)
        .maybeSingle();
      existing = data;
    }

    let leadId: string | null = null;

    if (existing?.id) {
      // Do not overwrite existing contact fields with new empty values (already filtered above)
      // Promote status anonimo → novo if we now have both name and phone
      const finalName = (patch.nome as string) ?? existing.nome;
      const finalPhone = (patch.telefone as string) ?? existing.telefone;
      if (existing.status === "anonimo" && finalName && finalPhone) {
        patch.status = "novo";
      } else if (body.status) {
        patch.status = body.status;
      }

      const { error: updateError } = await supabase
        .from("leads_maria")
        .update(patch)
        .eq("id", existing.id);
      if (updateError) throw updateError;
      leadId = existing.id;
    } else {
      const initialStatus =
        (patch.nome && patch.telefone) ? "novo" : (body.status || "anonimo");
      const { data: inserted, error: insertError } = await supabase
        .from("leads_maria")
        .insert({
          session_id: sessionId,
          status: initialStatus,
          ...patch,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      leadId = inserted?.id ?? null;
    }

    // Insert messages
    let messagesInserted = 0;
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      const rows = body.messages
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
        .map((m) => ({
          session_id: sessionId,
          lead_id: leadId,
          role: m.role,
          content: m.content,
          mode: body.mode ?? null,
        }));
      if (rows.length > 0) {
        const { error: msgErr } = await supabase.from("maria_messages").insert(rows);
        if (msgErr) {
          console.error("[persistir-conversa-maria] messages insert error:", msgErr);
        } else {
          messagesInserted = rows.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        lead_id: leadId,
        messages_inserted: messagesInserted,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[persistir-conversa-maria] error:", err);
    return new Response(
      JSON.stringify({ error: "internal_error", detail: String((err as Error).message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
