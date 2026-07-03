import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PROMPTS, callAI, safeParseJSON } from "./maria-logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// MarIA v5.0 — Assistente Estratégica VIV Bombinhas
// ============================================================

// ---------- Helpers ----------
async function upsertLeadBySession(
  supabase: any,
  sessionId: string,
  patch: Record<string, unknown>,
  triggerMessage?: string,
  source: string = "maria_chat",
) {
  if (!sessionId) return null;
  console.log(`[MarIA Persistence] Upserting lead for session ${sessionId}:`, JSON.stringify(patch));
  try {
    const { data: existing, error: findError } = await supabase.from("leads_maria").select("id, lead_score, nome, telefone, status").eq("session_id", sessionId).maybeSingle();
    if (findError) {
      console.error(`[MarIA Persistence] Error finding lead:`, findError);
    }

    const updateData: any = { ...patch, last_contact_at: new Date().toISOString() };

    if (existing?.id) {
      // Logic to upgrade status to 'novo' if name and phone are now present
      if (existing.status === "anonimo" && (patch.nome || existing.nome) && (patch.telefone || existing.telefone)) {
        updateData.status = "novo";
      }

      // Don't allow downgrade of score for strategic leads
      const currentScore = (existing.lead_score || "").toLowerCase();
      const newScore = (patch.lead_score as string || "").toLowerCase();

      if (currentScore === "premium" && newScore !== "premium") {
        delete updateData.lead_score;
      }
      if (currentScore === "quente" && newScore === "frio") {
        delete updateData.lead_score;
      }

      const { error: updateError } = await supabase.from("leads_maria").update(updateData).eq("id", existing.id);
      if (updateError) {
        console.error(`[MarIA Persistence] Error updating lead ${existing.id}:`, updateError);
        throw updateError;
      }

      // AUDIT: registra mudanças de status / lead_score
      const statusChanged = updateData.status && updateData.status !== existing.status;
      const scoreChanged = updateData.lead_score && (updateData.lead_score as string).toLowerCase() !== currentScore;
      if (statusChanged || scoreChanged) {
        try {
          await supabase.from("lead_status_audit").insert({
            lead_id: existing.id,
            session_id: sessionId,
            old_status: existing.status ?? null,
            new_status: statusChanged ? updateData.status : existing.status,
            old_score: existing.lead_score ?? null,
            new_score: scoreChanged ? updateData.lead_score : existing.lead_score,
            trigger_message: triggerMessage?.slice(0, 2000) ?? null,
            source,
          });
          console.log(`[MarIA Audit] Logged change for ${existing.id}: status ${existing.status}→${updateData.status}, score ${existing.lead_score}→${updateData.lead_score}`);
        } catch (auditErr) {
          console.error(`[MarIA Audit] Failed to log:`, auditErr);
        }
      }
      return existing.id;
    }

    const initialStatus = (patch.nome && patch.telefone) ? "novo" : "anonimo";
    const { data: inserted, error: insertError } = await supabase.from("leads_maria").insert({
      session_id: sessionId,
      origem: "maria_chat",
      status: initialStatus,
      last_contact_at: new Date().toISOString(),
      ...patch,
    }).select("id").single();

    if (insertError) {
      console.error(`[MarIA Persistence] Error inserting lead:`, insertError);
      throw insertError;
    }

    // AUDIT: registra criação inicial
    if (inserted?.id) {
      try {
        await supabase.from("lead_status_audit").insert({
          lead_id: inserted.id,
          session_id: sessionId,
          old_status: null,
          new_status: (patch.status as string) || initialStatus,
          old_score: null,
          new_score: (patch.lead_score as string) ?? null,
          trigger_message: triggerMessage?.slice(0, 2000) ?? null,
          source,
        });
      } catch (auditErr) {
        console.error(`[MarIA Audit] Failed to log creation:`, auditErr);
      }
    }
    return inserted?.id || null;
  } catch (err) {
    console.error(`[MarIA Persistence] Critical error in upsertLeadBySession:`, err);
    return null;
  }
}


// Valores válidos do enum tipo_imovel no banco
const TIPO_ENUM = ["apartamento","casa","cobertura","terreno","sobrado","studio","pousada","sala_comercial","outro"] as const;

// Mapeia variações livres do usuário/IA para valores reais do enum tipo_imovel
function normalizeTipo(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];
  const text = raw.toLowerCase();
  const synonyms: Record<string, string> = {
    "apartamento": "apartamento", "apartamentos": "apartamento", "apto": "apartamento", "aptos": "apartamento", "ap": "apartamento", "flat": "apartamento",
    "casa": "casa", "casas": "casa",
    "cobertura": "cobertura", "coberturas": "cobertura",
    "terreno": "terreno", "terrenos": "terreno", "lote": "terreno", "lotes": "terreno",
    "sobrado": "sobrado", "sobrados": "sobrado", "geminado": "sobrado",
    "studio": "studio", "studios": "studio", "stúdio": "studio", "kitnet": "studio", "kitinete": "studio",
    "pousada": "pousada", "pousadas": "pousada",
    "sala comercial": "sala_comercial", "comercial": "sala_comercial", "sala_comercial": "sala_comercial",
    "outro": "outro",
  };
  const found = new Set<string>();
  // Match multi-palavra primeiro
  for (const key of Object.keys(synonyms).sort((a,b) => b.length - a.length)) {
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) found.add(synonyms[key]);
  }
  return Array.from(found).filter(t => (TIPO_ENUM as readonly string[]).includes(t));
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
  "josé amândio": ["Bombas", "Centro"],
  "praia de fora": ["Zimbros", "Morrinhos"],
  sertãozinho: ["Zimbros", "Morrinhos"],
};

type PriceContext = {
  value: number | null;
  mode: "rigid_max" | "around" | "economic_from" | "none";
  exactMax: number | null;
  flexibleMax: number | null;
};

type SeasonSearchContext = {
  bairros: string[];
  nearbyBairros: string[];
  requestedTipos: string[];
  primaryTipos: string[];
  expandedTipos: string[];
  releaseAllTypes: boolean;
  pessoas: number | null;
  price: PriceContext;
};

type SeasonSearchResult = {
  properties: any[];
  exactCount: number;
  fallbackCount: number;
  layer: string;
  isFallback: boolean;
  totalActive: number;
  context: SeasonSearchContext;
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function uniqueValues<T>(values: T[]): T[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function canonicalBairro(raw: string): string | null {
  const normalized = normalizeText(raw);
  if (!normalized || normalized === "bombinhas/sc" || normalized === "bombinhas sc") return null;
  return BAIRROS_BOMBINHAS.find((bairro) => normalizeText(bairro) === normalized || normalized.includes(normalizeText(bairro)) || normalizeText(bairro).includes(normalized)) ?? null;
}

function extractBairros(filters: any, extractedData: any, historyText: string): string[] {
  const chunks: string[] = [];
  const rawFilterBairro = filters?.bairro || extractedData?.bairro_preferencia;
  if (rawFilterBairro) chunks.push(...String(rawFilterBairro).split(/[,|/]+|\s+e\s+|\s+ou\s+/i));

  const normalizedHistory = normalizeText(historyText);
  for (const bairro of BAIRROS_BOMBINHAS) {
    // "Bombinhas" sozinho costuma ser a cidade; só usar como bairro se veio explicitamente no filtro.
    if (bairro === "Bombinhas" && !rawFilterBairro) continue;
    const key = normalizeText(bairro);
    const re = new RegExp(`(^|\\W)${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\W|$)`, "i");
    if (re.test(normalizedHistory)) chunks.push(bairro);
  }

  return uniqueValues(chunks.map((chunk) => canonicalBairro(chunk)).filter(Boolean) as string[]);
}

function getNearbyBairros(bairros: string[]): string[] {
  const nearby = bairros.flatMap((bairro) => BAIRROS_PROXIMOS[normalizeText(bairro)] ?? []);
  return uniqueValues(nearby).filter((bairro) => !bairros.some((b) => normalizeText(b) === normalizeText(bairro)));
}

function extractCapacity(filters: any, extractedData: any, historyText: string): number | null {
  const direct = Number(filters?.pessoas ?? filters?.capacidade_pessoas ?? extractedData?.pessoas ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const text = normalizeText(historyText);
  const explicit = text.match(/\b(?:para\s+)?(\d{1,2})\s*(?:pessoas|pessoa|adultos|hospedes|hospedes|gente)\b/);
  if (explicit) return Number(explicit[1]);
  if (/\bcasal\b/.test(text)) return 2;

  const afterQuestion = text.match(/(?:quantas pessoas|numero de pessoas|pessoas\?|hospedes\?)[\s\S]{0,120}\b(\d{1,2})\b/);
  if (afterQuestion) {
    const value = Number(afterQuestion[1]);
    if (value > 0 && value <= 30) return value;
  }

  return null;
}

function extractPriceContext(filters: any, extractedData: any, historyText: string): PriceContext {
  const text = normalizeText(historyText);
  let value = Number(filters?.preco_max ?? extractedData?.orcamento_max ?? 0) || null;

  if (!value) {
    const moneyMatches = Array.from(text.matchAll(/\b(?:r\$\s*)?(\d{2,6})(?:[\.,]\d{1,2})?\b/g));
    for (const match of moneyMatches) {
      const start = Math.max(0, (match.index ?? 0) - 35);
      const end = Math.min(text.length, (match.index ?? 0) + match[0].length + 45);
      const window = text.slice(start, end);
      const hasPriceCue = /r\$|reais|real|diaria|dia\b|noite|orcamento|valor|media|por volta|cerca|aprox|ate|maximo|limite|partir/.test(window);
      const looksLikeDate = /dia\s+\d{1,2}|\d{1,2}\s+(dias|noites)/.test(window);
      if (hasPriceCue && !looksLikeDate) {
        value = Number(match[1]);
      }
    }
  }

  const hasPrecoMinOnly = !!(filters?.preco_min || extractedData?.orcamento_min) && !(filters?.preco_max || extractedData?.orcamento_max);
  const isEconomic = /\b(a partir|partir de|desde)\b/.test(text) || hasPrecoMinOnly;
  const isRigid = /\b(ate|no maximo|limite|teto|maximo)\b/.test(text) && !isEconomic;
  const isAround = /\b(media|por volta|cerca|aprox|aproximad[ao]|em torno)\b/.test(text);

  if (!value) {
    const minValue = Number(filters?.preco_min ?? extractedData?.orcamento_min ?? 0) || null;
    value = minValue;
  }

  if (!value) return { value: null, mode: "none", exactMax: null, flexibleMax: null };
  if (isEconomic) return { value, mode: "economic_from", exactMax: null, flexibleMax: null };
  if (isRigid) return { value, mode: "rigid_max", exactMax: value, flexibleMax: Math.max(Math.ceil(value * 1.5), value + 250) };
  if (isAround) return { value, mode: "around", exactMax: Math.ceil(value * 1.15), flexibleMax: Math.max(Math.ceil(value * 1.25), value + 150) };

  return { value, mode: "around", exactMax: Math.ceil(value * 1.15), flexibleMax: Math.max(Math.ceil(value * 1.25), value + 150) };
}

function getSeasonTypeContext(filters: any, extractedData: any, historyText: string) {
  const text = normalizeText(`${filters?.tipo ?? ""} ${extractedData?.tipo_imovel ?? ""} ${historyText}`);
  const releaseAllTypes = /nem casa nem apartamento|qualquer tipo|todos os tipos|tanto faz o tipo|sem preferencia de tipo/.test(text);
  const requestedTipos = releaseAllTypes ? [] : uniqueValues([
    ...normalizeTipo(String(filters?.tipo ?? "")),
    ...normalizeTipo(String(extractedData?.tipo_imovel ?? "")),
    ...normalizeTipo(historyText),
  ]);

  let primaryTipos = requestedTipos;
  if (requestedTipos.includes("casa")) primaryTipos = uniqueValues(["casa", "sobrado", ...requestedTipos]);
  if (requestedTipos.includes("apartamento")) primaryTipos = uniqueValues(["apartamento", "cobertura", ...requestedTipos]);

  const expandedTipos = primaryTipos.length > 0 ? uniqueValues([...primaryTipos, "apartamento", "cobertura", "casa", "sobrado"]) : [];
  return { requestedTipos, primaryTipos, expandedTipos, releaseAllTypes };
}

function inferSeasonFilters(filters: any, extractedData: any, historyText: string) {
  const text = normalizeText(historyText);
  const bairros = extractBairros(filters, extractedData, historyText);
  const typeContext = getSeasonTypeContext(filters, extractedData, historyText);
  const price = extractPriceContext(filters, extractedData, historyText);
  const pessoas = extractCapacity(filters, extractedData, historyText);
  const isSeasonContext =
    filters?.finalidade === "temporada" ||
    extractedData?.finalidade === "temporada" ||
    /temporada|diaria|ferias|janeiro|fevereiro|carnaval|reveillon|natal|dias|noites/.test(text);

  if (!isSeasonContext) return filters;
  return {
    ...filters,
    finalidade: "temporada",
    bairro: filters?.bairro || extractedData?.bairro_preferencia || bairros.join(" ou ") || undefined,
    tipo: filters?.tipo || extractedData?.tipo_imovel || typeContext.requestedTipos[0] || undefined,
    preco_max: filters?.preco_max ?? extractedData?.orcamento_max ?? (price.mode !== "economic_from" ? price.value : undefined),
    preco_min: filters?.preco_min ?? extractedData?.orcamento_min ?? (price.mode === "economic_from" ? price.value : undefined),
    pessoas: filters?.pessoas ?? extractedData?.pessoas ?? pessoas ?? undefined,
    periodo: filters?.periodo ?? extractedData?.periodo ?? undefined,
  };
}

function buildSeasonSearchContext(filters: any, extractedData: any, historyText: string): SeasonSearchContext {
  const bairros = extractBairros(filters, extractedData, historyText);
  const typeContext = getSeasonTypeContext(filters, extractedData, historyText);
  return {
    bairros,
    nearbyBairros: getNearbyBairros(bairros),
    ...typeContext,
    pessoas: extractCapacity(filters, extractedData, historyText),
    price: extractPriceContext(filters, extractedData, historyText),
  };
}

function propertyBairroKey(property: any): string | null {
  return canonicalBairro(String(property?.bairro ?? ""));
}

function matchesBairro(property: any, bairros: string[]) {
  if (bairros.length === 0) return true;
  const key = propertyBairroKey(property);
  return !!key && bairros.some((bairro) => normalizeText(bairro) === normalizeText(key));
}

function matchesTipo(property: any, tipos: string[], releaseAllTypes: boolean) {
  if (releaseAllTypes || tipos.length === 0) return true;
  return tipos.includes(String(property?.tipo ?? ""));
}

function matchesCapacity(property: any, pessoas: number | null) {
  if (!pessoas) return true;
  const capacidade = Number(property?.capacidade_pessoas ?? 0);
  return capacidade >= pessoas || capacidade <= 0;
}

function dailyPrice(property: any) {
  const value = Number(property?.preco_temporada_diaria ?? 0);
  return Number.isFinite(value) && value > 0 ? value : Number.POSITIVE_INFINITY;
}

function matchesPrice(property: any, price: PriceContext, mode: "exact" | "flexible" | "none") {
  const daily = dailyPrice(property);
  if (mode === "none" || price.mode === "economic_from" || !price.value) return true;
  if (!Number.isFinite(daily)) return false;
  const max = mode === "exact" ? price.exactMax : price.flexibleMax;
  return !max || daily <= max;
}

function rankSeasonProperty(property: any, ctx: SeasonSearchContext) {
  const price = dailyPrice(property);
  const capacidade = Number(property?.capacidade_pessoas ?? 0);
  const sameBairro = matchesBairro(property, ctx.bairros);
  const nearby = matchesBairro(property, ctx.nearbyBairros);
  const primaryType = matchesTipo(property, ctx.primaryTipos, ctx.releaseAllTypes);
  const expandedType = matchesTipo(property, ctx.expandedTipos, ctx.releaseAllTypes);
  const capacityScore = !ctx.pessoas ? 30 : capacidade >= ctx.pessoas ? 60 : capacidade <= 0 ? 12 : -80;
  const priceScore = ctx.price.value && Number.isFinite(price)
    ? Math.max(0, 50 - Math.abs(price - ctx.price.value) / 20)
    : Number.isFinite(price) ? 25 : 0;

  return (
    (sameBairro ? 220 : nearby ? 120 : 40) +
    (primaryType ? 90 : expandedType ? 50 : 10) +
    capacityScore +
    priceScore +
    (property?.destaque ? 8 : 0)
  );
}

function sortSeasonProperties(properties: any[], ctx: SeasonSearchContext) {
  return [...properties].sort((a, b) => {
    const scoreDiff = rankSeasonProperty(b, ctx) - rankSeasonProperty(a, ctx);
    if (scoreDiff !== 0) return scoreDiff;
    return dailyPrice(a) - dailyPrice(b);
  });
}

async function searchSeasonPropertiesProgressive(supabase: any, filters: any, extractedData: any, historyText: string): Promise<SeasonSearchResult> {
  const ctx = buildSeasonSearchContext(filters, extractedData, historyText);
  const { data, error } = await supabase
    .from("imoveis")
    .select("*")
    .eq("status", "ativo")
    .eq("finalidade", "temporada")
    .or("oculta_para_maria.is.null,oculta_para_maria.eq.false")
    .limit(160);

  if (error) {
    console.error("[MarIA Season Search] PostgREST error:", { filters, error });
    return { properties: [], exactCount: 0, fallbackCount: 0, layer: "query_error", isFallback: false, totalActive: 0, context: ctx };
  }

  const active = data || [];
  const baseCompatible = active.filter((property: any) => matchesCapacity(property, ctx.pessoas));
  const filterLayer = (layer: {
    bairro: "same" | "nearby" | "any";
    tipo: "primary" | "expanded" | "any";
    price: "exact" | "flexible" | "none";
  }) => {
    return baseCompatible.filter((property: any) => {
      const bairroOk = layer.bairro === "any"
        ? true
        : layer.bairro === "same"
          ? matchesBairro(property, ctx.bairros)
          : matchesBairro(property, ctx.nearbyBairros);
      const tipoOk = layer.tipo === "any"
        ? true
        : layer.tipo === "primary"
          ? matchesTipo(property, ctx.primaryTipos, ctx.releaseAllTypes)
          : matchesTipo(property, ctx.expandedTipos, ctx.releaseAllTypes);
      return bairroOk && tipoOk && matchesPrice(property, ctx.price, layer.price);
    });
  };

  const exact = filterLayer({ bairro: "same", tipo: "primary", price: "exact" });
  const layers = [
    { name: "exact", results: exact, isFallback: false },
    { name: "fallback_same_bairro_tipo_flex_price", results: filterLayer({ bairro: "same", tipo: "expanded", price: "flexible" }), isFallback: true },
    { name: "fallback_same_bairro_any_type_flex_price", results: filterLayer({ bairro: "same", tipo: "any", price: "flexible" }), isFallback: true },
    { name: "fallback_same_bairro_any_type_lowest_daily", results: filterLayer({ bairro: "same", tipo: "any", price: "none" }), isFallback: true },
    { name: "fallback_nearby_any_type_lowest_daily", results: filterLayer({ bairro: "nearby", tipo: "any", price: "none" }), isFallback: true },
    { name: "fallback_bombinhas_any_type_lowest_daily", results: baseCompatible, isFallback: true },
  ];

  const selected = layers.find((layer) => layer.results.length > 0) ?? layers[0];
  const sorted = (selected.isFallback
    ? [...selected.results].sort((a, b) => {
        const priceDiff = dailyPrice(a) - dailyPrice(b);
        if (priceDiff !== 0) return priceDiff;
        return rankSeasonProperty(b, ctx) - rankSeasonProperty(a, ctx);
      })
    : sortSeasonProperties(selected.results, ctx)
  ).slice(0, 40);
  const fallbackCount = selected.isFallback ? sorted.length : 0;

  console.debug("[MarIA Season Search]", JSON.stringify({
    filters,
    context: ctx,
    total_active_temporada: active.length,
    exact_results: exact.length,
    fallback_results: fallbackCount,
    layer: selected.name,
    show_results: sorted.length > 0,
  }));

  return {
    properties: sorted,
    exactCount: exact.length,
    fallbackCount,
    layer: selected.name,
    isFallback: selected.isFallback,
    totalActive: active.length,
    context: ctx,
  };
}

async function searchProperties(supabase: any, filters: any): Promise<any[]> {
  const normalizedTipos = filters?.tipo ? normalizeTipo(String(filters.tipo)) : [];
  const normalized = { ...filters, tiposNormalizados: normalizedTipos };
  try {
    let q = supabase.from("imoveis").select("*").eq("status", "ativo").or("oculta_para_maria.is.null,oculta_para_maria.eq.false").limit(40);

    if (filters?.finalidade) {
      const dbFinalidade = filters.finalidade === "investimento" ? "compra" : filters.finalidade;
      q = q.eq("finalidade", dbFinalidade);
    }

    // Filtro de Tipo (enum) — usa eq/in com valores normalizados
    if (normalizedTipos.length === 1) {
      q = q.eq("tipo", normalizedTipos[0]);
    } else if (normalizedTipos.length > 1) {
      q = q.in("tipo", normalizedTipos);
    } else if (filters?.tipo) {
      console.warn(`[MarIA Search] Tipo "${filters.tipo}" não mapeou para nenhum valor do enum. Ignorando filtro de tipo.`);
    }

    // Filtro de Bairro (text) — mantém ilike, com split apenas em vírgula/barra/pipe
    if (filters?.bairro && typeof filters.bairro === "string") {
      const bairros = filters.bairro.toLowerCase().split(/[,|/]+|\s+e\s+|\s+ou\s+/).map((s: string) => s.trim()).filter((b: string) => b.length > 3 && b !== "bombinhas");
      if (bairros.length > 0) {
        const orConditions = bairros.map((b: string) => `bairro.ilike.%${b}%`).join(",");
        q = q.or(orConditions);
      }
    }

    if (filters?.preco_min) {
      if (filters.finalidade === "temporada") q = q.gte("preco_temporada_diaria", filters.preco_min);
      else q = q.gte("preco", filters.preco_min);
    }

    if (filters?.preco_max) {
      if (filters.finalidade === "temporada") q = q.lte("preco_temporada_diaria", filters.preco_max);
      else q = q.lte("preco", filters.preco_max);
    }

    const { data, error } = await q;
    if (error) {
      console.error("[MarIA Search] PostgREST error:", {
        filtersRecebidos: filters,
        filtrosNormalizados: normalized,
        fase: "searchProperties.query",
        error,
      });
      return [];
    }
    console.log(`[MarIA Search] OK — filtros=${JSON.stringify(normalized)} resultados=${data?.length ?? 0}`);
    return data || [];
  } catch (err) {
    console.error("[MarIA Search] Exception:", {
      filtersRecebidos: filters,
      filtrosNormalizados: normalized,
      fase: "searchProperties.catch",
      err: String(err),
    });
    return [];
  }
}

function parseFiltersBlock(text: string) {
  const m = text.match(/\[FILTERS\]([\s\S]*?)\[\/FILTERS\]/);
  if (!m) return { filters: null, cleaned: text };
  try {
    const filters = JSON.parse(m[1].trim());
    return { filters, cleaned: text.replace(/\[FILTERS\][\s\S]*?\[\/FILTERS\]/g, "").trim() };
  } catch {
    return { filters: null, cleaned: text };
  }
}

function checkSearchRequirements(filters: any, intent: string, lastMessage: string, extractedData: any, historyText: string = "") {
  const missing: string[] = [];
  if (!filters || !filters.finalidade) {
    return { allowed: false, missing: ["finalidade"] };
  }
  
  const finalidade = filters.finalidade;
  const hasBairro = !!filters.bairro;
  const hasTipo = !!filters.tipo;
  const hasOrcamento = !!(filters.preco_max || filters.preco_min ||
    extractedData?.orcamento_max || extractedData?.orcamento_min);

  console.log(`[MarIA Search Logic] Checking requirements: Finalidade=${finalidade}, Intent=${intent}, hasBairro=${hasBairro}, hasTipo=${hasTipo}, hasOrcamento=${hasOrcamento}`);
  
  // Regra específica para Investimento
  if (finalidade === "investimento" || (finalidade === "compra" && extractedData?.objetivo === "investir")) {
    const hasObjective = extractedData?.objetivo === "renda" || 
                         extractedData?.objetivo === "patrimonio" || 
                         extractedData?.objetivo === "investir" || 
                         extractedData?.resumo_ia?.toLowerCase().includes("renda") || 
                         extractedData?.resumo_ia?.toLowerCase().includes("investir") ||
                         lastMessage.toLowerCase().includes("renda") ||
                         lastMessage.toLowerCase().includes("investir");
    
    if (!hasObjective) missing.push("objetivo");
    if (!hasBairro && !filters.preco_max && !hasTipo) missing.push("filtros_concretos");
    
    return { allowed: missing.length === 0, missing };
  }
  
  // Regra específica para Temporada — usar histórico completo para inferir capacidade/período
  if (finalidade === "temporada") {
    const hasConstraint = hasBairro || filters.preco_max || hasTipo;
    const text = (historyText + " " + lastMessage).toLowerCase();
    // Padrões: "8 pessoas", "para 6", "casal", período/mês/dias
    const capacityRegex = /\b(\d+)\s*(pessoas|pessoa|adultos|h[óo]spedes|gente)\b|\bpara\s+(\d+)\b|\bcasal\b|\bfam[íi]lia\b/;
    const periodRegex = /\b(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|carnaval|r[ée]veillon|natal|feriado|temporada)\b|\b\d+\s*(dias|noites|di[áa]rias|semanas?)\b|\bdia\s+\d+\b/;
    const hasCapacity = capacityRegex.test(text) || !!extractedData?.pessoas || !!filters?.pessoas || !!filters?.capacidade_pessoas;
    const hasPeriod = periodRegex.test(text) || !!extractedData?.periodo || !!filters?.periodo;
    const hasCapacityOrPeriod = hasCapacity || hasPeriod;
    
    if (!hasConstraint) missing.push("filtros_concretos");
    if (!hasCapacityOrPeriod) missing.push("capacidade_ou_periodo");
    
    console.log(`[MarIA Search Logic] Temporada: hasConstraint=${hasConstraint}, hasCapacity=${hasCapacity}, hasPeriod=${hasPeriod}`);
    return { allowed: missing.length === 0, missing };
  }
  
  // Compra Comum: exige bairro + tipo + faixa de orçamento
  if (finalidade === "compra") {
    if (!hasBairro) missing.push("bairro");
    if (!hasTipo) missing.push("tipo");
    if (!hasOrcamento) missing.push("orcamento");
    
    return { allowed: missing.length === 0, missing };
  }
  
  return { allowed: false, missing: ["desconhecido"] };
}

// Deprecated in favor of checkSearchRequirements, but keeping a wrapper for legacy calls if any
function isSearchAllowed(filters: any, intent: string, lastMessage: string, extractedData: any, historyText: string = "") {
  return checkSearchRequirements(filters, intent, lastMessage, extractedData, historyText).allowed;
}

// ============================================================

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, session_id, action, nome, telefone, lead_captured, extra_data } = await req.json();
    const sessionId = session_id || "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (action === "submit_lead") {
      // Remove campos que não existem na tabela leads_maria
      const { isStrategicMode, ...safeExtraData } = extra_data || {};
      const leadData: any = { 
        nome, 
        telefone, 
        status: "novo",
        chat_history: messages.length > 0 ? messages : undefined, // Persist full history snapshot
        ...safeExtraData 
      };

      // Force high priority for strategic leads
      if (extra_data?.quer_analise || extra_data?.proximo_passo_sugerido === "analise_daniel") {
        const isPremium = (Number(extra_data?.capital_disponivel || 0) >= 1000000) || 
                          (Number(extra_data?.orcamento_max || 0) >= 1000000) || 
                          (extra_data?.bens_para_permuta && extra_data?.bens_para_permuta.length > 5);
        
        leadData.lead_score = isPremium ? "Premium" : "Quente";
        console.log(`[MarIA Strategic] Lead scored as ${leadData.lead_score} based on extra_data`);
      }

      const triggerMsg = `[submit_lead] ${nome ?? ""} / ${telefone ?? ""}`;
      const leadId = await upsertLeadBySession(supabase, sessionId, leadData, triggerMsg, "lead_form");
      return new Response(JSON.stringify({ success: true, lead_id: leadId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[MarIA Debug] Nova mensagem recebida. Session: ${sessionId}. Messages: ${messages.length}`);
    const lastMessage = messages[messages.length - 1]?.content || "";
    console.log(`[MarIA Debug] Última mensagem: "${lastMessage}"`);

    // 1. ROUTER
    const routerReply = await callAI(lovableApiKey, "google/gemini-3-flash-preview", PROMPTS.ROUTER, messages.slice(-5), 0);
    const routerData = safeParseJSON(routerReply);
    let intent = routerData?.intent || "busca";

    // Regra de Posicionamento para Investimento: Forçar consultivo se termos de investimento forem detectados
    const investmentKeywords = /investimento|investir|terreno|renda|permuta|compra na planta|m²|região|liquidez|construtora/i;
    const isInvestmentContext = investmentKeywords.test(lastMessage) || (extra_data?.finalidade === "investimento");
    
    const searchPatterns = /ver im[óo]veis|op[çc][õo]es|cards|mostrar|buscar|procurar|quero ver|me mostre/i;
    const isExplicitSearchRequest = searchPatterns.test(lastMessage);

    if (isInvestmentContext && intent === "busca" && !isExplicitSearchRequest) {
      console.log(`[MarIA Debug] Forçando intent consultivo para contexto de investimento: "${lastMessage}"`);
      intent = "consultivo";
    }

    // 2. MAIN CHAT
    let mainModel = "google/gemini-3-flash-preview";
    let mainPrompt = PROMPTS.BUSCA_CHAT;
    let fallbackUsed = false;

    if (intent === "consultivo") {
      mainModel = "google/gemini-2.5-pro"; // Modelo premium para análise estratégica e consultoria
      mainPrompt = PROMPTS.CONSULTIVO_CHAT;
    } else if (intent === "proprietario") {
      mainPrompt = PROMPTS.PROPRIETARIO_CHAT;
    } else if (intent === "comum") {
      mainPrompt = PROMPTS.COMUM_CHAT;
    }

    let rawReply = "";
    try {
      console.log(`[MarIA Debug] Chamando IA (${mainModel}) para intent: ${intent}`);
      rawReply = await callAI(lovableApiKey, mainModel, mainPrompt, messages);
      console.log(`[MarIA Debug] Resposta bruta da IA: "${rawReply}"`);
    } catch (err) {
      console.error(`Error calling ${mainModel}:`, err);
      // Fallback: Premium -> Gemini 2.5 Flash -> Gemini 3 Flash
      if (mainModel === "google/gemini-2.5-pro") {
        fallbackUsed = true;
        console.log(`[MarIA Debug] Falha no Gemini 2.5 Pro. Tentando fallback para Gemini 2.5 Flash.`);
        rawReply = await callAI(lovableApiKey, "google/gemini-2.5-flash", mainPrompt, messages);
      } else if (mainModel !== "google/gemini-3-flash-preview") {
        fallbackUsed = true;
        console.log(`[MarIA Debug] Falha no modelo premium. Tentando fallback para Gemini Flash.`);
        rawReply = await callAI(lovableApiKey, "google/gemini-3-flash-preview", mainPrompt, messages);
      } else {
        throw err;
      }
    }


    // Log interno conforme solicitado
    console.log(JSON.stringify({
      selected_model: mainModel,
      selected_agent: intent,
      fallback_used: fallbackUsed,
      session_id: sessionId
    }));

    // 3. FILTERS, EXTRACTION & SEARCH
    const showStrategicForm = rawReply.includes("[STRATEGIC_FORM]");
    let { filters, cleaned } = parseFiltersBlock(rawReply.replace("[STRATEGIC_FORM]", ""));
    
    // Immediate extraction for context
    let extractedData = null;
    try {
      const extReply = await callAI(lovableApiKey, "google/gemini-3-flash-preview", PROMPTS.EXTRACTION, messages.concat({ role: "assistant", content: rawReply }), 0);
      extractedData = safeParseJSON(extReply);
    } catch (e) { console.error("Extraction error:", e); }

    // REGRA OBRIGATÓRIA: Se showStrategicForm for true, forçar limpeza de resultados e busca
    let showResults = false, noResultsGate = false, gateActive = false;
    let allProperties: any[] = [], visibleProperties: any[] = [];
    let missingFilters: string[] = [];

    if (showStrategicForm) {
      console.log(`[MarIA Strategic] Strategic form detected. Blocking property search.`);
      showResults = false;
      gateActive = false;
      allProperties = [];
      visibleProperties = [];
      // Se for estratégico e a IA não deu uma resposta amigável antes do form, usamos a padrão
      if (!cleaned || cleaned.trim().length < 5) {
        cleaned = "Perfeito. Vou organizar seu perfil para análise estratégica com o Daniel.";
      }
    } else {
      // Concatena histórico para permitir inferência de capacidade/período em temporada
      const historyText = messages.map((m: any) => String(m?.content ?? "")).join(" \n ");
      let effectiveSearchFilters = inferSeasonFilters(filters || {}, extractedData, historyText);

      if (!filters && extractedData && (intent === "busca" || intent === "consultivo") && isExplicitSearchRequest) {
        const candidateFilters = {
          finalidade: extractedData.finalidade || effectiveSearchFilters?.finalidade || "compra",
          bairro: extractedData.bairro_preferencia,
          tipo: extractedData.tipo_imovel,
          preco_max: extractedData.orcamento_max,
          preco_min: extractedData.orcamento_min,
          pessoas: extractedData.pessoas,
          periodo: extractedData.periodo,
        };

        const inferredCandidate = inferSeasonFilters(candidateFilters, extractedData, historyText);
        if (isSearchAllowed(inferredCandidate, intent, lastMessage, extractedData, historyText)) {
          filters = inferredCandidate;
          effectiveSearchFilters = inferredCandidate;
        }
      }

      if (!filters && effectiveSearchFilters?.finalidade === "temporada" && isExplicitSearchRequest) {
        filters = effectiveSearchFilters;
      }

      effectiveSearchFilters = inferSeasonFilters(filters || effectiveSearchFilters || {}, extractedData, historyText);

      // Check search requirements
      const searchCheckFilters = (effectiveSearchFilters?.finalidade || filters || extractedData) ? {
        finalidade: effectiveSearchFilters?.finalidade || filters?.finalidade || extractedData?.finalidade || "compra",
        bairro: effectiveSearchFilters?.bairro || filters?.bairro || extractedData?.bairro_preferencia,
        tipo: effectiveSearchFilters?.tipo || filters?.tipo || extractedData?.tipo_imovel,
        preco_max: effectiveSearchFilters?.preco_max || filters?.preco_max || extractedData?.orcamento_max,
        preco_min: effectiveSearchFilters?.preco_min || filters?.preco_min || extractedData?.orcamento_min,
        pessoas: effectiveSearchFilters?.pessoas || extractedData?.pessoas,
        periodo: effectiveSearchFilters?.periodo || extractedData?.periodo,
      } : null;
      const searchCheck = checkSearchRequirements(searchCheckFilters, intent, lastMessage, extractedData, historyText);
      
      missingFilters = searchCheck.missing;
      console.debug(`[MarIA Debug] filters=${JSON.stringify(searchCheckFilters)} extracted=${JSON.stringify(extractedData)} searchCheck.allowed=${searchCheck.allowed} missing=${JSON.stringify(searchCheck.missing)}`);

      // Final check for search triggering
      if (searchCheck.allowed) {
        // Garantir que temos um objeto de filtros válido
        const effectiveFilters = effectiveSearchFilters?.finalidade ? effectiveSearchFilters : (filters || {
          finalidade: extractedData?.finalidade || "compra",
          bairro: extractedData?.bairro_preferencia,
          tipo: extractedData?.tipo_imovel,
          preco_max: extractedData?.orcamento_max,
          preco_min: extractedData?.orcamento_min
        });

        if (effectiveFilters.finalidade !== "anunciante") {
          const seasonSearch = effectiveFilters.finalidade === "temporada"
            ? await searchSeasonPropertiesProgressive(supabase, effectiveFilters, extractedData, historyText)
            : null;
          allProperties = seasonSearch ? seasonSearch.properties : await searchProperties(supabase, effectiveFilters);
          console.debug(`[MarIA Debug] search_results exact=${seasonSearch?.exactCount ?? allProperties.length} fallback=${seasonSearch?.fallbackCount ?? 0} layer=${seasonSearch?.layer ?? "standard"} total=${allProperties.length}`);
          
          if (allProperties.length > 0) {
            showResults = true;
            if (seasonSearch?.isFallback) {
              cleaned = "Não encontrei casa exatamente nessa faixa, mas encontrei alternativas reais próximas no portal. Para janeiro ou fevereiro, a disponibilidade precisa ser confirmada com o parceiro local.";
            } else if (effectiveFilters.finalidade === "temporada") {
              cleaned = "Encontrei opções compatíveis. Para janeiro ou fevereiro, a disponibilidade precisa ser confirmada com o parceiro local.";
            }
            if (!lead_captured && allProperties.length > 2) {
              gateActive = true;
              visibleProperties = allProperties.slice(0, 2);
            } else {
              visibleProperties = allProperties.slice(0, 3);
            }
          } else {
            console.log(`[MarIA Search] No exact results for ${JSON.stringify(effectiveFilters)}. Checking for broadened authorization.`);
            
            const isBroadSearchAuthorized = lastMessage.toLowerCase().includes("pode ampliar") || 
                                          lastMessage.toLowerCase() === "sim" || 
                                          lastMessage.toLowerCase() === "pode" ||
                                          extra_data?.allow_broad_search === true;

            if (isBroadSearchAuthorized) {
              const broaderFilters = { ...effectiveFilters, preco_min: undefined, preco_max: undefined };
              const suggestions = await searchProperties(supabase, broaderFilters);
              
              if (suggestions.length > 0) {
                allProperties = suggestions;
                showResults = true;
                visibleProperties = allProperties.slice(0, 3);
                
                const bairroName = effectiveFilters.bairro || "Bombinhas";
                cleaned = `Não encontrei imóveis exatamente com esses critérios em ${bairroName}, mas como você autorizou a ampliação, selecionei estas opções que podem fazer sentido:`;
                console.log(`[MarIA Search] Broadened results found with authorization.`);
              } else {
                showResults = false;
                cleaned = `Mesmo buscando em outras regiões de Bombinhas, não encontrei opções com esse perfil agora. Quer tentar ajustar algum critério?`;
              }
            } else {
              showResults = false;
              allProperties = [];
              visibleProperties = [];
              noResultsGate = !lead_captured;
              cleaned = `No momento, não encontrei opções compatíveis com esse perfil no portal. Posso ampliar para regiões próximas dentro de Bombinhas ou ajustar a faixa de valor para encontrar alternativas?`;
              console.log(`[MarIA Search] No exact results. Asking for authorization to broaden.`);
            }
          }
        }
      }
    }


    // 5. DETERMINISTIC REPLY FALLBACK (Para casos de resposta vazia ou erro)
    let finalReply = cleaned || rawReply;
    if (showResults && (!finalReply || finalReply.trim().length < 5)) {
      finalReply = "Encontrei opções compatíveis com seu perfil em " + (filters?.bairro || 'Bombinhas') + ". Confira abaixo:";
    }
    if (!finalReply || finalReply.trim().length === 0) {
      finalReply = "Entendi. Estou buscando as melhores opções para você.";
    }

    // 4. PERSISTENCE (Background)
    (async () => {
      try {
        console.log(`[MarIA Persistence] Starting persistence for session ${sessionId}`);
        
        // 1. Map data to lead fields
        const leadPayload: any = {
          last_contact_at: new Date().toISOString()
        };

        if (extractedData) {
          Object.assign(leadPayload, {
            lead_score: extractedData.lead_score,
            objetivo: extractedData.objetivo,
            prazo_compra: extractedData.prazo_compra,
            orcamento_min: extractedData.orcamento_min,
            orcamento_max: extractedData.orcamento_max,
            capital_disponivel: extractedData.capital_disponivel,
            bens_para_permuta: extractedData.bens_para_permuta,
            resumo_ia: extractedData.resumo_ia,
            interesse: extractedData.finalidade,
            bairro_interesse: extractedData.bairro_preferencia,
            tipo_imovel: extractedData.tipo_imovel,
            nome: extractedData.nome || undefined,
            telefone: extractedData.telefone || undefined,
            proximo_passo_sugerido: extractedData.quer_falar_daniel ? "analise_daniel" : undefined,
            objetivo_investimento: extractedData.objetivo,
            região_interesse: extractedData.bairro_preferencia,
          });
        }

        // Always include chat history snapshot if we have it
        if (messages.length > 0) {
          leadPayload.chat_history = messages;
        }

        // Update lead data
        const leadId = await upsertLeadBySession(supabase, sessionId, leadPayload, lastMessage, extractedData ? "maria_extraction" : "maria_chat");

        if (leadId) {
          console.log(`[MarIA Persistence] Lead ID confirmed: ${leadId}. Persisting messages and metrics.`);
          
          // 2. Persist message history (Individual messages)
          const currentMessagesToSave = [];
          const lastUserMsg = messages[messages.length - 1];
          if (lastUserMsg) {
            currentMessagesToSave.push({
              session_id: sessionId,
              lead_id: leadId,
              role: lastUserMsg.role,
              content: lastUserMsg.content
            });
          }
          
          currentMessagesToSave.push({
            session_id: sessionId,
            lead_id: leadId,
            role: "assistant",
            content: finalReply
          });

          const { error: msgError } = await supabase.from("maria_messages").insert(currentMessagesToSave);
          if (msgError) console.error("[MarIA Persistence] Error persisting messages:", msgError);
          
          // 3. Record search metrics
          const { error: metricError } = await supabase.from("maria_search_metrics").insert({
            session_id: sessionId,
            finalidade: filters?.finalidade || extractedData?.finalidade,
            missing_filters: missingFilters,
            results_count: allProperties.length,
            showed_cards: showResults,
            messages_count: messages.length
          });
          if (metricError) console.error("[MarIA Persistence] Error recording metrics:", metricError);
        } else {
          console.warn(`[MarIA Persistence] No leadId returned for session ${sessionId}. Skipping messages/metrics.`);
        }
      } catch (err) {
        console.error("[MarIA Persistence] Background persistence error:", err);
      }
    })();

    console.debug(`[MarIA Debug] RESPONSE show_results=${showResults} results_count=${allProperties.length} visible=${visibleProperties.length} gate_active=${gateActive}`);
    return new Response(JSON.stringify({
      reply: finalReply,
      show_results: showResults,
      properties: visibleProperties,
      all_properties: allProperties,
      gate_active: gateActive,
      no_results_gate: noResultsGate,
      show_strategic_form: showStrategicForm,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ reply: "Desculpe, tive um problema agora. 🙏", error: err.message }), { status: 500, headers: corsHeaders });
  }
});