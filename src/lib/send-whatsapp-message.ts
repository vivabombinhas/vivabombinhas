import { supabase } from "@/integrations/supabase/client";

export interface SendWhatsappParams {
  phone: string;
  message: string;
  leadId?: string | null;
  sessionId?: string | null;
}

export interface SendWhatsappResult {
  sent: boolean;
  messageRecorded: boolean;
  messageId?: string;
  warning?: string;
}

/**
 * Envia mensagem via WhatsApp através do MarIA Core e registra no CRM (maria_messages).
 *
 * Tudo é feito na edge function `maria-core-whatsapp` usando service_role,
 * evitando o erro "permission denied for table maria_messages" no navegador.
 *
 * Este helper deve ser o ÚNICO caminho de envio a partir do painel admin
 * (usado tanto pelo cockpit Atendimento quanto pelo painel de Leads/Funil).
 */
export async function sendWhatsappMessage({
  phone,
  message,
  leadId,
  sessionId,
}: SendWhatsappParams): Promise<SendWhatsappResult> {
  const trimmed = message.trim();
  if (!trimmed) throw new Error("Mensagem vazia");
  if (!phone?.trim()) throw new Error("Lead sem telefone");

  const { data, error } = await supabase.functions.invoke("maria-core-whatsapp", {
    body: {
      action: "send",
      phone: phone.trim(),
      message: trimmed,
      lead_id: leadId ?? null,
      session_id: sessionId ?? null,
    },
  });

  if (error) {
    // Tenta extrair mensagem humana do corpo da resposta (edge devolve 4xx/5xx)
    let humano = "";
    let partial: { sent?: boolean; message_recorded?: boolean } = {};
    try {
      const ctx: any = (error as any).context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        humano = parsed?.error || parsed?.message || "";
        partial = parsed ?? {};
      } else if (ctx && typeof ctx.text === "function") {
        const raw = await ctx.text();
        try {
          const parsed = JSON.parse(raw);
          humano = parsed?.error || raw;
          partial = parsed ?? {};
        } catch {
          humano = raw;
        }
      }
    } catch {
      /* ignore */
    }

    // Se o Core confirmou envio mas o registro no CRM falhou, sinaliza sem quebrar.
    if (partial.sent && partial.message_recorded === false) {
      return {
        sent: true,
        messageRecorded: false,
        warning:
          humano ||
          "Mensagem enviada ao cliente, mas não foi registrada no CRM. Não reenvie automaticamente; verifique o histórico.",
      };
    }

    throw new Error(humano || error.message || "Falha ao enviar mensagem via MarIA Core");
  }

  const payload: any = data ?? {};
  if (payload.status && payload.status !== "ok" && !payload.sent) {
    throw new Error(payload.error || "MarIA Core recusou a operação");
  }

  return {
    sent: payload.sent !== false,
    messageRecorded: payload.message_recorded !== false,
    messageId: payload.message_id,
    warning:
      payload.message_recorded === false
        ? "Mensagem enviada, mas não foi registrada no CRM."
        : undefined,
  };
}
