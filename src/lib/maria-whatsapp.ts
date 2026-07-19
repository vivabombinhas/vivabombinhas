// Central helper para levar toda conversa pública com a MarIA ao WhatsApp.
// A experiência conversacional real acontece no WhatsApp — o site é vitrine.

const ENV_NUMBER = (import.meta as any).env?.VITE_MARIA_WHATSAPP as string | undefined;

// Número da MarIA no WhatsApp (DDI+DDD+número, apenas dígitos).
// Ajuste aqui ou defina VITE_MARIA_WHATSAPP no .env.
export const MARIA_WHATSAPP_NUMBER = (ENV_NUMBER || "554199992422").replace(/\D/g, "");

export type MariaIntent =
  | "temporada"
  | "compra"
  | "investimento"
  | "anunciar"
  | "turismo"
  | "geral";

export const MARIA_INTENT_MESSAGES: Record<MariaIntent, string> = {
  temporada:
    "Oi MarIA, quero encontrar uma casa ou apartamento de temporada em Bombinhas.",
  compra: "Oi MarIA, quero comprar um imóvel em Bombinhas.",
  investimento: "Oi MarIA, quero investir em imóveis em Bombinhas.",
  anunciar: "Oi MarIA, quero anunciar meu imóvel em Bombinhas.",
  turismo: "Oi MarIA, quero dicas de Bombinhas.",
  geral: "Oi! Quero saber mais sobre imóveis em Bombinhas.",
};

export const buildMariaWhatsappLink = (
  intentOrMessage: MariaIntent | string = "geral"
): string => {
  const message =
    (MARIA_INTENT_MESSAGES as Record<string, string>)[intentOrMessage] ??
    intentOrMessage;
  return `https://wa.me/${MARIA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export const openMariaWhatsapp = (
  intentOrMessage: MariaIntent | string = "geral"
) => {
  const url = buildMariaWhatsappLink(intentOrMessage);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
