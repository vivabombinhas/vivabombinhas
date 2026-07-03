// ============================================================
// MarIA — Busca determinística de TEMPORADA
// ============================================================
// Regras de negócio isoladas do LLM. O modelo de linguagem cuida do texto,
// mas a decisão de perguntar, buscar ou mostrar cards vem daqui.
// ============================================================

export type BudgetMode = "max" | "around" | "min" | "unknown";

export interface SeasonSearchState {
  finalidade: "temporada";
  bairros: string[];
  tipos: string[];               // valores do enum tipo_imovel
  pessoas: number | null;
  preco_min: number | null;
  preco_max: number | null;
  budget_mode: BudgetMode;
  periodo: string | null;
  explicit_show_request: boolean;
  raw_summary: string;
}

export interface SeasonValidation {
  ok: boolean;
  missing: Array<"pessoas" | "orcamento" | "periodo">;
  ask: string | null;             // pergunta única a fazer (uma coisa por vez)
}

export type SeasonLayer =
  | "exact"
  | "same_bairro_flex_price"
  | "same_bairro_any_type_flex_price"
  | "same_bairro_any_type_lowest"
  | "nearby_any_type_ranked"
  | "no_results"
  | "empty_inventory";

export interface SeasonSearchResult {
  properties: any[];
  exact_count: number;
  fallback_count: number;
  layer: SeasonLayer;
  is_fallback: boolean;
  total_active_temporada: number;
}

const BAIRROS_BOMBINHAS = [
  "Centro",
  "Bombas",
  "Bombinhas",
  "José Amândio",
  "Quatro Ilhas",
  "Mariscal",
  "Canto Grande",
  "Morrinhos",
  "Zimbros",
  "Praia de Fora",
  "Sertãozinho",
  "Praia da Conceição",
];

const BAIRROS_PROXIMOS: Record<string, string[]> = {
  mariscal: ["Canto Grande", "Morrinhos", "Zimbros"],
  "canto grande": ["Mariscal", "Morrinhos", "Zimbros"],
  morrinhos: ["Canto Grande", "Zimbros", "Mariscal"],
  zimbros: ["Morrinhos", "Canto Grande"],
  bombas: ["Centro", "José Amândio", "Bombinhas"],
  centro: ["Bombas", "Bombinhas", "Quatro Ilhas"],
  bombinhas: ["Centro", "Quatro Ilhas", "Bombas"],
  "quatro ilhas": ["Bombinhas", "Centro", "Mariscal"],
  "jose amandio": ["Bombas", "Centro"],
  "praia de fora": ["Zimbros", "Morrinhos"],
  sertaozinho: ["Zimbros", "Morrinhos"],
  "praia da conceicao": ["Zimbros", "Morrinhos"],
};

const TIPO_ENUM = [
  "apartamento", "casa", "cobertura", "terreno",
  "sobrado", "studio", "pousada", "sala_comercial", "outro",
] as const;

function norm(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

function canonicalBairro(raw: string): string | null {
  const n = norm(raw);
  if (!n) return null;
  return BAIRROS_BOMBINHAS.find((b) => {
    const bn = norm(b);
    return bn === n || n.includes(bn) || bn.includes(n);
  }) ?? null;
}

function extractBairros(userText: string): string[] {
  const t = norm(userText);
  const found: string[] = [];
  for (const b of BAIRROS_BOMBINHAS) {
    // "Bombinhas" sozinha costuma ser a cidade — só considera se veio explícito
    // com contexto de bairro (evitamos falso positivo simples).
    if (b === "Bombinhas") continue;
    const key = norm(b);
    const re = new RegExp(`(^|\\W)${key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(\\W|$)`, "i");
    if (re.test(t)) found.push(b);
  }
  return uniq(found);
}

function extractTipos(userText: string): string[] {
  const t = norm(userText);
  const synonyms: Record<string, string> = {
    apartamento: "apartamento", apartamentos: "apartamento", apto: "apartamento",
    aptos: "apartamento", ap: "apartamento", flat: "apartamento",
    casa: "casa", casas: "casa",
    cobertura: "cobertura", coberturas: "cobertura",
    sobrado: "sobrado", sobrados: "sobrado", geminado: "sobrado",
    studio: "studio", studios: "studio", kitnet: "studio", kitinete: "studio",
    pousada: "pousada", pousadas: "pousada",
  };
  const found = new Set<string>();
  for (const k of Object.keys(synonyms).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${k}\\b`, "i");
    if (re.test(t)) found.add(synonyms[k]);
  }
  // "casa" também aceita "sobrado" como tipo preferencial
  if (found.has("casa")) found.add("sobrado");
  // "apartamento" aceita "cobertura" como preferencial
  if (found.has("apartamento")) found.add("cobertura");
  return Array.from(found).filter((t) => (TIPO_ENUM as readonly string[]).includes(t));
}

function extractPessoas(userText: string): number | null {
  const t = norm(userText);
  const m1 = t.match(/\b(\d{1,2})\s*(pessoas|pessoa|adultos|hospedes|gente)\b/);
  if (m1) return Number(m1[1]);
  const m2 = t.match(/\bpara\s+(\d{1,2})\b/);
  if (m2) return Number(m2[1]);
  const m3 = t.match(/(?:quantas pessoas|numero de pessoas|pessoas\?|hospedes\?)[\s\S]{0,60}\b(\d{1,2})\b/);
  if (m3) {
    const v = Number(m3[1]);
    if (v > 0 && v <= 30) return v;
  }
  if (/\bcasal\b/.test(t)) return 2;
  // resposta seca "5" logo após pergunta de capacidade
  const lastLine = t.split(/\n|\./).pop() || "";
  const solo = lastLine.trim().match(/^(\d{1,2})$/);
  if (solo) {
    const v = Number(solo[1]);
    if (v >= 1 && v <= 30) return v;
  }
  return null;
}

function extractBudget(userText: string): { min: number | null; max: number | null; mode: BudgetMode } {
  const t = norm(userText);
  const mode: BudgetMode =
    /\b(a partir|partir de|desde|barato|econom|mais barato|menor)\b/.test(t) ? "min" :
    /\b(ate|no maximo|maximo|limite|teto)\b/.test(t) ? "max" :
    /\b(media|em media|por volta|cerca|aprox|aproximad[ao]|em torno)\b/.test(t) ? "around" :
    "unknown";

  let value: number | null = null;
  const matches = Array.from(t.matchAll(/\b(?:r\$\s*)?(\d{2,6})(?:[\.,]\d{1,2})?\b/g));
  for (const m of matches) {
    const start = Math.max(0, (m.index ?? 0) - 35);
    const end = Math.min(t.length, (m.index ?? 0) + m[0].length + 45);
    const window = t.slice(start, end);
    const hasCue = /r\$|reais|real|diaria|di[áa]ria|dia\b|noite|orcamento|valor|media|por volta|cerca|aprox|ate|maximo|limite|partir|barato/.test(window);
    const looksLikeDate = /dia\s+\d{1,2}|\d{1,2}\s+(dias|noites)/.test(window);
    if (hasCue && !looksLikeDate) value = Number(m[1]);
  }

  if (value === null) return { min: null, max: null, mode };

  if (mode === "min") return { min: value, max: null, mode };
  if (mode === "max") return { min: null, max: value, mode };
  if (mode === "around") return { min: null, max: value, mode }; // aplicaremos margem no filtro
  return { min: null, max: value, mode: "max" }; // valor solto → tratar como teto
}

function extractPeriodo(userText: string): string | null {
  // Só extrai o período se aparecer explicitamente no histórico atual.
  const t = norm(userText);
  const re = /(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|carnaval|reveillon|natal|feriad[oa]|alta temporada|baixa temporada)|dia\s+\d{1,2}[^\n]{0,40}|(\d{1,2})\s*(dias|noites|di[áa]rias|semanas?)/i;
  const m = t.match(re);
  return m ? m[0] : null;
}

function isExplicitShowRequest(lastUserMsg: string): boolean {
  const t = norm(lastUserMsg);
  return /(me mostre|mostre|mostrar|ver opcoes|ver opções|ver imoveis|ver imóveis|quero ver|pode mostrar|manda as opcoes|manda opcoes|tem algo|tem opcao|tem opção|mostrar opcoes|mostre alternativas)/.test(t);
}

function isSeasonContext(userText: string, finalidade_hint?: string | null): boolean {
  if (finalidade_hint === "temporada") return true;
  const t = norm(userText);
  return /\b(temporada|ferias|diaria|di[áa]ria|alugar por dia|passar (o|as) (final de semana|feriado|ferias)|hospedar|hospedagem|reveillon|carnaval|passar (uma )?semana|pra ficar|para ficar\b)/.test(t);
}

// ============================================================
// Interpretação contextual de respostas curtas
// ============================================================
// Se a assistente perguntou X e o usuário respondeu um valor "solto"
// (ex: "5", "500", "janeiro"), devolvemos o tipo semântico da resposta.
type ShortAnswerKind = "pessoas" | "orcamento" | "periodo" | null;

function classifyAssistantQuestion(assistantText: string): ShortAnswerKind {
  const t = norm(assistantText);
  if (!t) return null;
  if (/(quantas pessoas|quantidade de pessoas|numero de pessoas|para quantas|quantos hospedes|quantos adultos|capacidade)/.test(t)) {
    return "pessoas";
  }
  if (/(orcamento|faixa de valor|faixa de preco|valor por diaria|valor da diaria|diaria|budget|quanto pretende|quanto por dia)/.test(t)) {
    return "orcamento";
  }
  if (/(quando|que datas|qual periodo|quais datas|qual data|tem datas|periodo|quantos dias|quantas noites|mes)/.test(t)) {
    return "periodo";
  }
  return null;
}

interface ShortAnswer {
  kind: ShortAnswerKind;
  numeric?: number;
  text?: string;
}

function parseShortUserAnswer(userText: string, expected: ShortAnswerKind): ShortAnswer | null {
  const t = norm(userText).replace(/[\.!\?]+$/g, "").trim();
  if (!t || !expected) return null;
  // Curta = até ~4 tokens sem verbo forte
  const tokens = t.split(/\s+/);
  if (tokens.length > 4) return null;

  if (expected === "pessoas") {
    const m = t.match(/\b(\d{1,2})\b/);
    if (m) {
      const v = Number(m[1]);
      if (v >= 1 && v <= 30) return { kind: "pessoas", numeric: v };
    }
    if (/\bcasal\b/.test(t)) return { kind: "pessoas", numeric: 2 };
  }

  if (expected === "orcamento") {
    const m = t.match(/\b(\d{2,6})\b/);
    if (m) return { kind: "orcamento", numeric: Number(m[1]) };
  }

  if (expected === "periodo") {
    if (/(janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|carnaval|reveillon|réveillon|natal|feriad[oa])/.test(t)) {
      return { kind: "periodo", text: t };
    }
    if (/\b\d{1,2}\s*(dias|noites|semanas?)\b/.test(t)) return { kind: "periodo", text: t };
    if (/\bdia\s+\d{1,2}\b/.test(t)) return { kind: "periodo", text: t };
  }

  return null;
}

function collectShortAnswers(messages: Array<{ role: string; content: string }>) {
  const answers: ShortAnswer[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role !== "user") continue;
    // encontra a última mensagem do assistente ANTES desta do usuário
    let prevAssistant = "";
    for (let j = i - 1; j >= 0; j--) {
      if (messages[j].role === "assistant") { prevAssistant = String(messages[j].content ?? ""); break; }
    }
    const expected = classifyAssistantQuestion(prevAssistant);
    if (!expected) continue;
    const parsed = parseShortUserAnswer(String(m.content ?? ""), expected);
    if (parsed) answers.push(parsed);
  }
  return answers;
}

// ============================================================
// 1. buildSeasonSearchState
// ============================================================
export function buildSeasonSearchState(
  messages: Array<{ role: string; content: string }>,
  finalidade_hint?: string | null,
): SeasonSearchState | null {
  const userMsgs = messages.filter((m) => m.role === "user").map((m) => String(m.content ?? ""));
  const userText = userMsgs.join("\n");
  const lastUser = userMsgs[userMsgs.length - 1] ?? "";

  if (!isSeasonContext(userText, finalidade_hint) && finalidade_hint !== "temporada") {
    return null;
  }

  const bairros = extractBairros(userText);
  const tipos = extractTipos(userText);
  let pessoas = extractPessoas(userText);
  let { min, max, mode } = extractBudget(userText);
  let periodo = extractPeriodo(userText);

  // Preenche lacunas com respostas curtas contextuais (turno anterior da assistente).
  // Prioridade: valor explícito completo já extraído acima ganha; short answers só preenchem NULL.
  const shortAnswers = collectShortAnswers(messages);
  for (const a of shortAnswers) {
    if (a.kind === "pessoas" && !pessoas && a.numeric) pessoas = a.numeric;
    if (a.kind === "orcamento" && !min && !max && a.numeric) {
      max = a.numeric;
      if (mode === "unknown") mode = "max";
    }
    if (a.kind === "periodo" && !periodo && a.text) periodo = a.text;
  }

  const explicit = isExplicitShowRequest(lastUser) || /me mostre opcoes|me mostre opções/.test(norm(userText));

  const raw_summary = [
    bairros.length ? `bairros=${bairros.join("|")}` : null,
    tipos.length ? `tipos=${tipos.join("|")}` : null,
    pessoas ? `pessoas=${pessoas}` : null,
    (min || max) ? `budget=${min ?? ""}-${max ?? ""}/${mode}` : null,
    periodo ? `periodo=${periodo}` : null,
    explicit ? "explicit_show" : null,
    shortAnswers.length ? `short_answers=${shortAnswers.length}` : null,
  ].filter(Boolean).join(" ");

  return {
    finalidade: "temporada",
    bairros,
    tipos,
    pessoas,
    preco_min: min,
    preco_max: max,
    budget_mode: mode,
    periodo,
    explicit_show_request: explicit,
    raw_summary,
  };
}


// ============================================================
// 2. validateSeasonSearchState
// ============================================================
export function validateSeasonSearchState(state: SeasonSearchState): SeasonValidation {
  const missing: SeasonValidation["missing"] = [];
  if (!state.pessoas) missing.push("pessoas");
  if (!state.preco_min && !state.preco_max) missing.push("orcamento");
  if (!state.periodo) missing.push("periodo");

  // Regra determinística de bloqueio:
  // - período NUNCA bloqueia;
  // - pessoas SÓ bloqueia quando o usuário não pediu cards explicitamente E não temos bairro/tipo suficientes;
  // - orçamento SÓ bloqueia quando não temos bairro nem tipo (sinal fraco) e o usuário não pediu explicitamente.
  const hasStrongSignal = state.bairros.length > 0 || state.tipos.length > 0;
  const blocking: SeasonValidation["missing"] = [];
  if (!state.pessoas && !state.explicit_show_request && !hasStrongSignal) blocking.push("pessoas");
  if (!state.preco_min && !state.preco_max && !state.explicit_show_request && !hasStrongSignal) blocking.push("orcamento");

  if (blocking.length === 0) return { ok: true, missing, ask: null };

  const ask = blocking.includes("pessoas")
    ? "Para quantas pessoas você precisa?"
    : "Qual faixa de valor por diária faz sentido para você?";
  return { ok: false, missing, ask };
}

// ============================================================
// 3. searchAndRankSeasonProperties
// ============================================================
function nearbyBairros(bairros: string[]): string[] {
  const out = bairros.flatMap((b) => BAIRROS_PROXIMOS[norm(b)] ?? []);
  return uniq(out).filter((b) => !bairros.some((x) => norm(x) === norm(b)));
}

function dailyPrice(p: any): number {
  const v = Number(p?.preco_temporada_diaria ?? 0);
  return Number.isFinite(v) && v > 0 ? v : Number.POSITIVE_INFINITY;
}

function matchesBairro(p: any, bairros: string[]): boolean {
  if (bairros.length === 0) return true;
  const key = canonicalBairro(String(p?.bairro ?? ""));
  return !!key && bairros.some((b) => norm(b) === norm(key));
}

function matchesTipo(p: any, tipos: string[]): boolean {
  if (tipos.length === 0) return true;
  return tipos.includes(String(p?.tipo ?? ""));
}

function matchesCapacity(p: any, pessoas: number | null): boolean {
  if (!pessoas) return true;
  const cap = Number(p?.capacidade_pessoas ?? 0);
  return cap >= pessoas || cap <= 0; // 0/null não exclui, apenas ranqueia abaixo
}

function priceCeiling(state: SeasonSearchState, flexible: boolean): number | null {
  if (state.budget_mode === "min") return null; // "a partir de" — sem teto
  const base = state.preco_max;
  if (!base) return null;
  if (state.budget_mode === "around") return Math.ceil(base * (flexible ? 1.35 : 1.15));
  if (flexible) return Math.ceil(base * 1.3);
  return base;
}

function matchesPrice(p: any, state: SeasonSearchState, flexible: boolean): boolean {
  if (state.budget_mode === "min") return true;
  const ceil = priceCeiling(state, flexible);
  if (!ceil) return true;
  const daily = dailyPrice(p);
  if (!Number.isFinite(daily)) return false;
  return daily <= ceil;
}

function rank(p: any, state: SeasonSearchState): number {
  const sameBairro = matchesBairro(p, state.bairros);
  const nearby = matchesBairro(p, nearbyBairros(state.bairros));
  const tipoOk = matchesTipo(p, state.tipos);
  const cap = Number(p?.capacidade_pessoas ?? 0);
  const capScore = !state.pessoas ? 20 : cap >= state.pessoas ? 60 : cap <= 0 ? 8 : -60;
  const price = dailyPrice(p);
  const priceScore = state.preco_max && Number.isFinite(price)
    ? Math.max(0, 45 - Math.abs(price - state.preco_max) / 20)
    : (Number.isFinite(price) ? 20 : 0);
  const hasPhotos = Array.isArray(p?.fotos) ? p.fotos.length > 0 : !!p?.foto_capa;
  return (
    (sameBairro ? 220 : nearby ? 110 : 30) +
    (tipoOk ? 90 : 20) +
    capScore +
    priceScore +
    (hasPhotos ? 15 : 0) +
    (p?.destaque ? 8 : 0)
  );
}

export async function searchAndRankSeasonProperties(
  state: SeasonSearchState,
  supabase: any,
): Promise<SeasonSearchResult> {
  const { data, error } = await supabase
    .from("imoveis")
    .select("*")
    .eq("status", "ativo")
    .eq("finalidade", "temporada")
    .or("oculta_para_maria.is.null,oculta_para_maria.eq.false")
    .limit(200);

  if (error) {
    console.error("[MarIA Season] query error:", error);
    return { properties: [], exact_count: 0, fallback_count: 0, layer: "no_results", is_fallback: false, total_active_temporada: 0 };
  }

  const active: any[] = data || [];
  if (active.length === 0) {
    return { properties: [], exact_count: 0, fallback_count: 0, layer: "empty_inventory", is_fallback: false, total_active_temporada: 0 };
  }

  const base = active.filter((p) => matchesCapacity(p, state.pessoas));

  const exact = base.filter((p) =>
    matchesBairro(p, state.bairros) &&
    matchesTipo(p, state.tipos) &&
    matchesPrice(p, state, false),
  );

  const layers: Array<{ name: SeasonLayer; results: any[]; isFallback: boolean; sortByPrice?: boolean }> = [
    { name: "exact", results: exact, isFallback: false },
    {
      name: "same_bairro_flex_price",
      results: base.filter((p) => matchesBairro(p, state.bairros) && matchesTipo(p, state.tipos) && matchesPrice(p, state, true)),
      isFallback: true,
    },
    {
      name: "same_bairro_any_type_flex_price",
      results: base.filter((p) => matchesBairro(p, state.bairros) && matchesPrice(p, state, true)),
      isFallback: true,
    },
    {
      name: "same_bairro_any_type_lowest",
      results: base.filter((p) => matchesBairro(p, state.bairros)),
      isFallback: true,
      sortByPrice: true,
    },
    {
      name: "nearby_any_type_ranked",
      results: base.filter((p) => matchesBairro(p, nearbyBairros(state.bairros))),
      isFallback: true,
    },
  ];

  const chosen = layers.find((l) => l.results.length > 0);
  if (!chosen) {
    return {
      properties: [],
      exact_count: 0,
      fallback_count: 0,
      layer: "no_results",
      is_fallback: false,
      total_active_temporada: active.length,
    };
  }

  const sorted = chosen.sortByPrice
    ? [...chosen.results].sort((a, b) => dailyPrice(a) - dailyPrice(b))
    : [...chosen.results].sort((a, b) => rank(b, state) - rank(a, state));

  return {
    properties: sorted.slice(0, 40),
    exact_count: exact.length,
    fallback_count: chosen.isFallback ? sorted.length : 0,
    layer: chosen.name,
    is_fallback: chosen.isFallback,
    total_active_temporada: active.length,
  };
}

// ============================================================
// 4. buildSeasonReply
// ============================================================
export function buildSeasonReply(
  state: SeasonSearchState,
  validation: SeasonValidation,
  result: SeasonSearchResult,
): string {
  // Se ainda falta info obrigatória e o usuário não pediu explicitamente
  if (!validation.ok && validation.ask && !state.explicit_show_request) {
    return validation.ask;
  }

  if (result.layer === "empty_inventory") {
    return "No momento não temos imóveis de temporada ativos no portal. Assim que surgir algo, posso te avisar.";
  }

  if (result.properties.length === 0) {
    const bairrosTxt = state.bairros.length ? state.bairros.join(" ou ") : "Bombinhas";
    return `Não encontrei opções compatíveis em ${bairrosTxt} agora. Quer que eu ajuste o valor por diária ou considere bairros próximos dentro de Bombinhas?`;
  }

  if (result.is_fallback) {
    return "Não encontrei exatamente nesse perfil, mas encontrei alternativas reais próximas no portal. A disponibilidade precisa ser confirmada com o parceiro local.";
  }

  return "Encontrei opções compatíveis. A disponibilidade precisa ser confirmada com o parceiro local. Se você tiver datas em mente, posso ajudar a filtrar melhor.";
}
