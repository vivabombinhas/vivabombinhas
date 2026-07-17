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
  session_id?: string | null;
  lead_id?: string | null;
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
      return json({ error: "unauthorized" }, 401);
    }

    if (!isMariaCoreConfigured()) {
      return json({ error: "not_configured", message: "MarIA Core não configurado" }, 503);
    }

    const body = (await req.json()) as Body;
    const phone = body.phone?.toString().trim();

    if (body.action === "send") {
      if (!phone || !body.message?.trim()) {
        return json({ error: "phone e message obrigatórios" }, 400);
      }
      const message = body.message.trim();
      const result = await callMariaCore("/whatsapp/send", {
        method: "POST",
        body: { phone, message },
      });

      if (result.status !== "ok") {
        return json(result as unknown as Record<string, unknown>, 502);
      }

      const service = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      let leadId = body.lead_id?.toString().trim() || null;
      let sessionId = body.session_id?.toString().trim() || null;

      if (!sessionId || !leadId) {
        const { data: lead, error: leadError } = await service
          .from("leads_maria")
          .select("id, session_id, maria_core_session_id")
          .eq("telefone", phone)
          .order("last_contact_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (leadError) {
          console.error("[maria-core-whatsapp] lead lookup error", leadError);
        }

        leadId = leadId ?? lead?.id ?? null;
        sessionId = sessionId ?? lead?.maria_core_session_id ?? lead?.session_id ?? null;
      }

      if (!sessionId) {
        return json(
          {
            error:
              "Mensagem enviada ao cliente, mas não foi registrada no CRM: lead sem sessão vinculada.",
            sent: true,
            message_recorded: false,
          },
          500,
        );
      }

      const { data: inserted, error: insertError } = await service
        .from("maria_messages")
        .insert({
          session_id: sessionId,
          lead_id: leadId,
          role: "assistant",
          content: message,
          mode: "atendente_whatsapp",
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[maria-core-whatsapp] maria_messages insert error", insertError);
        return json(
          {
            error:
              "Mensagem enviada ao cliente, mas não foi registrada no CRM. Não reenvie automaticamente; verifique o histórico antes de tentar novamente.",
            detail: insertError.message,
            sent: true,
            message_recorded: false,
          },
          500,
        );
      }

      if (leadId) {
        const { error: touchError } = await service
          .from("leads_maria")
          .update({ last_contact_at: new Date().toISOString() })
          .eq("id", leadId);

        if (touchError) {
          console.warn("[maria-core-whatsapp] last_contact_at update warning", touchError);
        }
      }

      return json({
        status: "ok",
        data: result.data,
        sent: true,
        message_recorded: true,
        message_id: inserted?.id,
      });
    }

    if (body.action === "get_mode") {
      if (!phone) {
        return json({ error: "phone obrigatório" }, 400);
      }
      const result = await callMariaCore(
        `/whatsapp/mode?phone=${encodeURIComponent(phone)}`,
        { method: "GET" },
      );
      return json(result as unknown as Record<string, unknown>, result.status === "ok" ? 200 : 502);
    }

    if (body.action === "set_mode") {
      if (!phone || typeof body.paused !== "boolean") {
        return json({ error: "phone e paused obrigatórios" }, 400);
      }
      const result = await callMariaCore("/whatsapp/mode", {
        method: "POST",
        body: { phone, paused: body.paused },
      });
      return json(result as unknown as Record<string, unknown>, result.status === "ok" ? 200 : 502);
    }

    return json({ error: "action inválida" }, 400);
  } catch (err) {
    console.error("[maria-core-whatsapp] error", err);
    return json({ error: "internal_error", detail: String((err as Error).message ?? err) }, 500);
  }
});
