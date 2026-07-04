import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { callMariaCore, isMariaCoreConfigured } from "../_shared/mariaCore.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const configured = isMariaCoreConfigured();
    if (!configured) {
      return new Response(
        JSON.stringify({
          configured: false,
          status: "not_configured",
          message: "MarIA Core não configurado. Configuração local ativa.",
          config: null,
          checked_at: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await callMariaCore<Record<string, unknown>>("/config", {
      method: "GET",
      timeoutMs: 5_000,
    });

    // Sanitiza payload: remove qualquer campo que pareça segredo.
    let safeConfig: Record<string, unknown> | null = null;
    if (result.status === "ok" && result.data && typeof result.data === "object") {
      safeConfig = {};
      for (const [k, v] of Object.entries(result.data as Record<string, unknown>)) {
        if (/key|secret|token|password|authorization/i.test(k)) continue;
        safeConfig[k] = v;
      }
    }

    return new Response(
      JSON.stringify({
        configured: true,
        status: result.status,
        message: result.status === "ok"
          ? "Config do MarIA Core carregada."
          : result.error ?? "Falha ao consultar Core.",
        config: safeConfig,
        latency_ms: result.latency_ms ?? null,
        http_status: result.http_status ?? null,
        checked_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
