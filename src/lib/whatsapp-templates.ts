// Templates de mensagem WhatsApp para follow-up de leads
// Cada template recebe o lead e retorna a mensagem pronta para enviar

interface LeadLike {
  nome?: string | null;
  bairro_interesse?: string | null;
  tipo_imovel?: string | null;
  interesse?: string | null;
  faixa_preco?: string | null;
}

const firstName = (full?: string | null) =>
  (full ?? "").trim().split(/\s+/)[0] || "tudo bem";

export type WhatsappTemplate = {
  id: string;
  label: string;
  description: string;
  build: (lead: LeadLike) => string;
};

export const WHATSAPP_TEMPLATES: WhatsappTemplate[] = [
  {
    id: "primeiro_contato",
    label: "Primeiro contato",
    description: "Apresentação inicial após o lead chegar pela MarIA",
    build: (l) =>
      `Oi ${firstName(l.nome)}! 👋 Aqui é da Viva Bombinhas — vi que você conversou com a MarIA sobre ${
        l.tipo_imovel || "imóveis"
      }${l.bairro_interesse ? ` em ${l.bairro_interesse}` : " em Bombinhas"}.\n\nPosso te ajudar a achar a melhor opção? Quer que eu já te mande algumas sugestões hoje? 🏖️`,
  },
  {
    id: "follow_up_suave",
    label: "Follow-up suave (2-3 dias)",
    description: "Lembrete amigável quando o lead não respondeu",
    build: (l) =>
      `Oi ${firstName(l.nome)}, tudo bem? 😊\n\nSó passando aqui pra saber se a busca por ${
        l.tipo_imovel || "imóvel"
      }${l.bairro_interesse ? ` em ${l.bairro_interesse}` : ""} ainda está ativa. Apareceram novidades por aqui que podem te interessar!\n\nQuer que eu te mostre?`,
  },
  {
    id: "novidade_match",
    label: "Tenho um match novo",
    description: "Quando surgir um imóvel novo que combina com o lead",
    build: (l) =>
      `Oi ${firstName(l.nome)}! 🎯\n\nApareceu um imóvel novo que parece bem com o que você procura${
        l.bairro_interesse ? ` (${l.bairro_interesse})` : ""
      }${l.faixa_preco ? ` na faixa de ${l.faixa_preco}` : ""}. Posso te mandar agora?`,
  },
  {
    id: "agendar_visita",
    label: "Agendar visita",
    description: "Convidar para visitar um imóvel",
    build: (l) =>
      `Oi ${firstName(l.nome)}! Que tal marcarmos uma visita? Tenho horários disponíveis essa semana — me diz qual dia funciona melhor pra você. 📅`,
  },
  {
    id: "post_visita",
    label: "Pós-visita",
    description: "Acompanhamento depois de uma visita",
    build: (l) =>
      `Oi ${firstName(l.nome)}, e aí, o que achou da visita? Qualquer dúvida ou se quiser ver outras opções, é só me chamar! 😊`,
  },
  {
    id: "reativacao",
    label: "Reativação (lead frio)",
    description: "Para leads que sumiram há mais de 2 semanas",
    build: (l) =>
      `Oi ${firstName(l.nome)}! Faz um tempinho que não falamos. A busca por imóvel${
        l.bairro_interesse ? ` em ${l.bairro_interesse}` : " em Bombinhas"
      } ainda está de pé? Tenho novidades caso queira retomar. 🌊`,
  },
];

export const buildWhatsappLink = (telefone: string, message: string) => {
  const phone = telefone.replace(/\D/g, "");
  // Usamos api.whatsapp.com/send que é mais robusto para redirecionamentos e evita alguns bloqueios de Cross-Origin em navegadores específicos
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
};
