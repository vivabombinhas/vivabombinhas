import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { callMariaCore, isMariaCoreConfigured } from "../_shared/mariaCore.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { lead_name, lead_phone, session_id } = await req.json();

    // 1. Encontrar o lead e seus dados de qualificação
    const { data: lead } = await supabase
      .from("leads_maria")
      .select("id, lead_score, objetivo, resumo_ia, interesse, bairro_interesse, tipo_imovel, orcamento_max, capital_disponivel")
      .eq("session_id", session_id)
      .maybeSingle();

    const scorePrefix = lead?.lead_score ? `[${lead.lead_score}] ` : "";
    const goalInfo = lead?.objetivo ? ` Objetivo: ${lead.objetivo}.` : "";

    // Título/mensagem padrão (lógica local — fallback e baseline seguro)
    let title = `${scorePrefix}Novo Lead: ${lead_name}! 🔥`;
    let message = `${lead_name} (${lead_phone}) liberou o contato no chat.${goalInfo} ${lead?.resumo_ia || ""}`;

    // ============================================================
    // MarIA Core proxy — POST /notify-broker (apenas enriquecimento).
    // A DECISÃO local de notificar Daniel NÃO muda. O Core só pode
    // sugerir título/mensagem melhores. Qualquer falha do Core mantém
    // o comportamento atual intacto.
    // ============================================================
    if (!isMariaCoreConfigured()) {
      console.log(JSON.stringify({
        tag: "MarIA Core NotifyBroker",
        event: "skipped_not_configured",
        session_id,
        timestamp: new Date().toISOString(),
      }));
    } else {
      const hasMinimumLead = !!(lead_name && lead_phone);
      const coreResult = await callMariaCore<any>("/notify-broker", {
        method: "POST",
        body: {
          session_id,
          lead: {
            id: lead?.id ?? null,
            nome: lead_name ?? null,
            telefone: lead_phone ?? null,
            lead_score: lead?.lead_score ?? null,
            objetivo: lead?.objetivo ?? null,
            resumo_ia: lead?.resumo_ia ?? null,
            interesse: (lead as any)?.interesse ?? null,
            bairro_interesse: (lead as any)?.bairro_interesse ?? null,
            tipo_imovel: (lead as any)?.tipo_imovel ?? null,
            orcamento_max: (lead as any)?.orcamento_max ?? null,
            capital_disponivel: (lead as any)?.capital_disponivel ?? null,
          },
        },
      });

      console.log(JSON.stringify({
        tag: "MarIA Core NotifyBroker",
        event: "core_call",
        session_id,
        status: coreResult.status,
        http_status: coreResult.http_status ?? null,
        latency_ms: coreResult.latency_ms ?? null,
        error: coreResult.error ?? null,
        timestamp: new Date().toISOString(),
      }));

      const d: any = coreResult.data;
      const canUseCore =
        coreResult.status === "ok" &&
        d && typeof d === "object" &&
        hasMinimumLead; // regra 3: sem dados mínimos, ignoramos sugestão do Core

      if (canUseCore) {
        if (typeof d.title === "string" && d.title.trim().length > 0) {
          title = d.title.trim();
        }
        if (typeof d.message === "string" && d.message.trim().length > 0) {
          message = d.message.trim();
        }
      } else {
        const reason = coreResult.status !== "ok"
          ? coreResult.status
          : (!hasMinimumLead ? "missing_min_lead_data" : "invalid_payload");
        console.log(JSON.stringify({
          tag: "MarIA Core NotifyBroker",
          event: "fallback_local",
          session_id,
          reason,
          timestamp: new Date().toISOString(),
        }));
        // Passo 3B — persistência observacional (fire-and-forget)
        const tipo = coreResult.status === "timeout" ? "core_timeout"
          : coreResult.status === "error" ? "core_error"
          : "core_invalid_payload";
        (async () => {
          try {
            await supabase.from("maria_core_events").insert({
              session_id: session_id ?? null,
              lead_id: lead?.id ?? null,
              tipo,
              payload: {
                source: "notify-broker",
                reason,
                http_status: coreResult.http_status ?? null,
                latency_ms: coreResult.latency_ms ?? null,
                error: coreResult.error ?? null,
              },
            });
          } catch (e) {
            console.error("[NotifyBroker Core Event] insert failed:", e);
          }
        })();
      }
    }

    // 2. Criar notificação na tabela broker_notifications
    const { error: notifError } = await supabase
      .from("broker_notifications")
      .insert({
        title,
        message,
        lead_id: lead?.id,
        session_id: session_id,
        read: false
      });

    if (notifError) throw notifError;

    console.log(`[WhatsApp Simulation] Notificando Daniel: ${scorePrefix} ${lead_name} - ${lead?.resumo_ia || ""}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
