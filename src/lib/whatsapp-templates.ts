// Templates de mensagem WhatsApp para follow-up de leads
// Cada template recebe o lead e retorna a mensagem pronta para enviar

interface LeadLike {
  nome?: string | null;
  bairro_interesse?: string | null;
  tipo_imovel?: string | null;
  interesse?: string | null;
  faixa_preco?: string | null;
  // Campos enriquecidos pelo CRM/MarIA
  tipo_lead?: string | null;
  objetivo?: string | null;
  objetivo_investimento?: string | null;
  ["região_interesse"]?: string | null;
  regiao_interesse?: string | null;
  orcamento_min?: number | null;
  orcamento_max?: number | null;
  capital_disponivel?: number | null;
  prazo_compra?: string | null;
  bens_para_permuta?: string | null;
  resumo_ia?: string | null;
  proximo_passo_sugerido?: string | null;
}

export interface ViewedProperty {
  titulo?: string | null;
  bairro?: string | null;
  preco?: number | null;
  quartos?: number | null;
  tipo?: string | null;
}

const firstName = (full?: string | null) =>
  (full ?? "").trim().split(/\s+/)[0] || "tudo bem";

const fmtBRL = (n?: number | null) => {
  if (n == null || !isFinite(n)) return null;
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `R$ ${v.toFixed(v % 1 === 0 ? 0 : 1).replace(".", ",")} milhão`.replace("1 milhão", "1 milhão");
  }
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(0)} mil`;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
};

const orcamentoLabel = (l: LeadLike) => {
  const min = fmtBRL(l.orcamento_min);
  const max = fmtBRL(l.orcamento_max);
  if (min && max) return `de ${min} a ${max}`;
  if (max) return `até ${max}`;
  if (min) return `a partir de ${min}`;
  return l.faixa_preco?.trim() || null;
};

const describeProperty = (p: ViewedProperty) => {
  const parts: string[] = [];
  if (p.tipo) parts.push(String(p.tipo));
  if (p.quartos) parts.push(`${p.quartos} dorm.`);
  let head = parts.join(" ");
  if (p.titulo && !head) head = p.titulo;
  if (!head) head = "imóvel";
  const tail: string[] = [];
  if (p.bairro) tail.push(p.bairro);
  if (p.preco) tail.push(fmtBRL(p.preco) || "");
  return tail.filter(Boolean).length ? `${head} em ${tail.join(" por ")}` : head;
};

const detectKind = (l: LeadLike): "investimento" | "temporada" | "anuncio" | "compra" => {
  const blob = `${l.tipo_lead ?? ""} ${l.interesse ?? ""} ${l.objetivo ?? ""}`.toLowerCase();
  if (/(invest|renda|locac|aluguel.*temp|liquidez)/.test(blob) || l.capital_disponivel) return "investimento";
  if (/(temporada|f[eé]rias|aluguel.*temp|di[aá]ria)/.test(blob)) return "temporada";
  if (/(anunciar|vender|proprietari|cadastrar)/.test(blob)) return "anuncio";
  return "compra";
};

/**
 * Gera uma mensagem personalizada de WhatsApp para o consultor Daniel,
 * usando todos os dados disponíveis no CRM. Omite campos ausentes.
 */
export const buildPersonalizedMessage = (
  lead: LeadLike,
  viewed: ViewedProperty[] = []
): string => {
  const nome = firstName(lead.nome);
  const kind = detectKind(lead);
  const bairro = lead.bairro_interesse?.trim();
  const regiao = (lead as any)["região_interesse"] || lead.regiao_interesse;
  const local = bairro || regiao || "Bombinhas";
  const tipo = lead.tipo_imovel?.trim();
  const orc = orcamentoLabel(lead);
  const capital = fmtBRL(lead.capital_disponivel);
  const top = viewed[0] ? describeProperty(viewed[0]) : null;

  const apresentacao = lead.nome
    ? `Oi, Daniel. Sou o(a) ${lead.nome.split(/\s+/)[0]}.`
    : `Oi, Daniel.`;

  const linhas: string[] = [apresentacao];

  if (kind === "investimento") {
    const intro: string[] = [`Conversei com a MarIA sobre investimento em ${local}.`];
    const objetivos: string[] = [];
    if (lead.objetivo_investimento) objetivos.push(lead.objetivo_investimento);
    if (capital) objetivos.push(`tenho ${capital} disponível`);
    else if (orc) objetivos.push(`orçamento ${orc}`);
    if (tipo) objetivos.push(`avaliando ${tipo}${bairro ? " em " + bairro : ""}`);
    if (objetivos.length) intro.push(objetivos.join(", ") + ".");
    linhas.push(intro.join(" "));
    if (top) linhas.push(`A MarIA me mostrou ${top}.`);
    if (lead.bens_para_permuta) linhas.push(`Também tenho ${lead.bens_para_permuta} como possível permuta.`);
    linhas.push("Gostaria da sua opinião sobre liquidez, potencial de locação e se faz sentido para meu perfil.");
  } else if (kind === "temporada") {
    const intro: string[] = ["Conversei com a MarIA sobre temporada"];
    if (bairro) intro.push(`em ${bairro}`);
    if (lead.prazo_compra) intro.push(`para ${lead.prazo_compra}`);
    if (orc) intro.push(`com diária ${orc}`);
    linhas.push(intro.join(" ") + ".");
    if (top) linhas.push(`Vi a opção: ${top}.`);
    linhas.push("Gostaria de verificar disponibilidade e tirar dúvidas.");
  } else if (kind === "anuncio") {
    const intro: string[] = ["Conversei com a MarIA porque quero anunciar"];
    if (tipo) intro.push(tipo);
    if (bairro) intro.push(`em ${bairro}`);
    linhas.push(intro.join(" ") + ".");
    if (lead.objetivo) linhas.push(`Objetivo: ${lead.objetivo}.`);
    linhas.push("Pode me orientar sobre os próximos passos?");
  } else {
    // compra
    const intro: string[] = ["Conversei com a MarIA porque estou buscando"];
    if (tipo) intro.push(tipo);
    else intro.push("um imóvel");
    if (bairro) intro.push(`em ${bairro}`);
    if (orc) intro.push(orc);
    linhas.push(intro.join(" ") + ".");
    if (top) linhas.push(`Vi uma opção: ${top}.`);
    if (lead.prazo_compra) linhas.push(`Prazo: ${lead.prazo_compra}.`);
    linhas.push("Gostaria de receber mais detalhes e orientação.");
  }

  return linhas.join("\n\n");
};

export type WhatsappTemplate = {
  id: string;
  label: string;
  description: string;
  build: (lead: LeadLike, viewed?: ViewedProperty[]) => string;
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
  let phone = telefone.replace(/\D/g, "");
  
  // Se o número não começar com 55 (Brasil) e tiver 10 ou 11 dígitos, adicionamos o 55
  if (!phone.startsWith("55") && (phone.length === 10 || phone.length === 11)) {
    phone = `55${phone}`;
  }
  
  // Usamos wa.me por ser mais curto e amigável
  const baseUrl = `https://wa.me/${phone}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
};

/**
 * Abre o WhatsApp de forma segura, evitando erros de Cross-Origin (COOP) 
 * que podem ocorrer em ambientes de sandbox como o Lovable/StackBlitz.
 */
export const openWhatsapp = (telefone: string, message: string) => {
  const url = buildWhatsappLink(telefone, message);
  
  // Criamos um elemento <a> temporário para disparar o clique
  // Isso é mais resiliente que window.open em muitos navegadores/sandboxes
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer"; // Essencial para evitar bloqueios de Cross-Origin-Opener-Policy
  
  // Adiciona ao documento, clica e remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
