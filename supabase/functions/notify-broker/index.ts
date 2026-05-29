import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

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
      .select("id, lead_score, objetivo, resumo_ia")
      .eq("session_id", session_id)
      .maybeSingle();

    const scorePrefix = lead?.lead_score ? `[${lead.lead_score}] ` : "";
    const goalInfo = lead?.objetivo ? ` Objetivo: ${lead.objetivo}.` : "";

    // 2. Criar notificação na tabela broker_notifications
    const { error: notifError } = await supabase
      .from("broker_notifications")
      .insert({
        title: `${scorePrefix}Novo Lead: ${lead_name}! 🔥`,
        message: `${lead_name} (${lead_phone}) liberou o contato no chat.${goalInfo} ${lead?.resumo_ia || ""}`,
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