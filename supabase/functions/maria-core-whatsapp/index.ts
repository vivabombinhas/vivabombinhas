// Proxy para as rotas de WhatsApp do MarIA Core.
// Nunca expõe MARIA_CORE_API_KEY ao navegador.
import { createClient } from "npm:@supabase/supabase-js@2";
import { callMariaCore, isMariaCoreConfigured } from "../_shared/mariaCore.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action = "send" | "get_mode" | "set_mode";

interface Body {
  action: Action;
  phone?: string;
  message?: string;
  paused?: boolean;
}

async function requireAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!(await requireAdmin(req))) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isMariaCoreConfigured()) {
      return new Response(
        JSON.stringify({ error: "not_configured", message: "MarIA Core não configurado" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Body;
    const phone = body.phone?.toString().trim();

    if (body.action === "send") {
      if (!phone || !body.message?.trim()) {
        return new Response(JSON.stringify({ error: "phone e message obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await callMariaCore("/whatsapp/send", {
        method: "POST",
        body: { phone, message: body.message },
      });
      return new Response(JSON.stringify(result), {
        status: result.status === "ok" ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "get_mode") {
      if (!phone) {
        return new Response(JSON.stringify({ error: "phone obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await callMariaCore(
        `/whatsapp/mode?phone=${encodeURIComponent(phone)}`,
        { method: "GET" },
      );
      return new Response(JSON.stringify(result), {
        status: result.status === "ok" ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "set_mode") {
      if (!phone || typeof body.paused !== "boolean") {
        return new Response(JSON.stringify({ error: "phone e paused obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await callMariaCore("/whatsapp/mode", {
        method: "POST",
        body: { phone, paused: body.paused },
      });
      return new Response(JSON.stringify(result), {
        status: result.status === "ok" ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "action inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[maria-core-whatsapp] error", err);
    return new Response(
      JSON.stringify({ error: "internal_error", detail: String((err as Error).message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
