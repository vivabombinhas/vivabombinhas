import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// MarIA v4.6 — Multi-Agent Architecture (Refined Prompts)
// ============================================================

const PROMPTS = {
  ROUTER: `Você é o roteador de intenções da MarIA. Analise a última mensagem do usuário e o histórico para classificar a intenção predominante.
Categorias:
- "busca": Quando o usuário quer ver imóveis, opções, fotos, cards, ou informou filtros objetivos como bairro, valor, tipo. Ex: "Quero comprar apartamento em Bombas até 900 mil".
- "consultivo": Quando o usuário pergunta sobre m², riscos, valorização, comparação de bairros, investimento, liquidez, estratégia ou decisão. Ex: "Quero comprar em Bombinhas, vale mais Mariscal ou Bombas?".
- "proprietario": Anunciar, cadastrar ou vender imóvel próprio.
- "comum": Saudação, agradecimento ou conversa sem intenção clara de busca ou investimento.

Retorne APENAS um JSON puro, sem blocos de markdown: {"intent": "busca" | "consultivo" | "proprietario" | "comum"}`,

  BUSCA_CHAT: `Você é a MarIA (Modo Busca). Seja rápida e objetiva.
Ajude o usuário a filtrar imóveis: finalidade, bairro, tipo, valor.
Quando tiver filtros suficientes, você DEVE emitir o bloco [FILTERS]{"finalidade":"...", "bairro":"...", "tipo":"...", "preco_max":...}[/FILTERS] na mesma resposta.
Regra: Se o usuário pedir para ver imóveis, você DEVE emitir o bloco [FILTERS].`,

  CONSULTIVO_CHAT: `Você é a MarIA, pré-consultora estratégica em Bombinhas (Mariscal, Bombas, Canto Grande, Quatro Ilhas). Seja premium, direta e estratégica.

REGRAS DE CONTEÚDO:
- EXTENSÃO: Normalmente responda em 2 a 4 frases curtas. Só ultrapasse isso se o usuário pedir uma explicação mais detalhada.
- TOM: Local, inteligente e objetivo. Evite saudações ou elogios ("Excelente", "Com certeza"). Sem hype. Use "opções compatíveis", "patrimônio no longo prazo", "costuma ter boa procura", "precisa ser comparado caso a caso".
- PROIBIÇÕES: Não use "melhores oportunidades", "valorização" como promessa, "liquidez excelente", "ocupação garantida".
- METRO QUADRADO: Não invente valores. Explique que o valor m² varia drasticamente por distância do mar, padrão e idade do imóvel.
- CONDUÇÃO: Responda de forma útil e faça 1 pergunta estratégica (ex: busca renda, valorização ou uso próprio?).

REGRAS PARA "SEM RESULTADOS":
- Em fluxos de investimento/compra, JAMAIS comece com "não encontrei", "não temos" ou frases negativas.
- Comece com uma leitura estratégica da região/perfil. Explique que limitar a decisão ao que está visível agora no portal pode não ser o melhor caminho.
- Ofereça comparação de regiões ou análise estratégica com o Daniel.

DANIEL E LEAD:
- Ofereça análise com o Daniel quando houver pelo menos 2 sinais: orçamento > 1.5M, intenção de investimento, dúvida estratégica, comparação de bairros, dúvida m²/risco/liquidez, ou prazo de compra definido.
- Venda o valor da análise antes de oferecer o Daniel: "comparar região, perfil do imóvel, liquidez, risco e coerência da compra."
- Em seguida diga: "Essa leitura pode ser conduzida pelo Daniel...".
- Se aceito, peça Nome e WhatsApp: "Para organizar seu perfil para análise, me informe seu nome e WhatsApp."
- Não diga "registrar interesse" ou "Daniel vai te chamar" sem ter o contato.`,

  EXTRACTION: `Você é um analista de CRM estratégico. Analise a conversa e devolva APENAS um JSON puro, sem blocos de markdown.
JSON Schema:
{
  "finalidade": "temporada" | "compra" | "investimento" | "anunciante" | null,
  "objetivo": "temporada" | "morar" | "investir" | "renda" | "patrimonio" | "anunciar" | null,
  "prazo_compra": "imediato" | "3_meses" | "6_meses" | "12_meses" | "futuro" | null,
  "orcamento_max": number | null,
  "bairro_preferencia": string | null,
  "tipo_imovel": string | null,
  "nome": string | null,
  "telefone": string | null,
  "perfil_premium": boolean,
  "quer_falar_daniel": boolean,
  "resumo_ia": string
}
Regras:
- "perfil_premium": true se houver sinais de lead qualificado (orçamento > 1.5M ou dúvidas estratégicas).
- Retorne apenas o JSON.`
};

// ---------- Helpers ----------
async function callAI(lovableApiKey: string, model: string, system: string, messages: any[], temperature = 0.4) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      temperature,
    }),
  });
  if (!response.ok) throw new Error(`AI Gateway error (\${model}): \${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ---------- Lead Scoring ----------
function calculateScore(d: any): number {
  let s = 0;
  if (d.nome && d.telefone) s += 30;
  if (d.finalidade) s += 10;
  if (d.orcamento_max) {
    s += 15;
    if (Number(d.orcamento_max) > 1_500_000) s += 20;
    if (d.perfil_premium) s += 10;
  }
  return Math.min(s, 100);
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Premium";
  if (score >= 60) return "Quente";
  if (score >= 30) return "Morno";
  return "Frio";
}

function safeParseJSON(text: string) {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON parse failed for:", text);
    return null;
  }
}

// ---------- Lead upsert ----------
async function upsertLeadBySession(supabase: any, sessionId: string, patch: Record<string, unknown>) {
  if (!sessionId) return null;
  const { data: existing } = await supabase.from("leads_maria").select("id").eq("session_id", sessionId).maybeSingle();
  if (existing?.id) {
    await supabase.from("leads_maria").update({ ...patch, last_contact_at: new Date().toISOString() }).eq("id", existing.id);
    return existing.id;
  }
  const { data: inserted } = await supabase.from("leads_maria").insert({
    session_id: sessionId,
    origem: "maria_chat",
    status: patch.nome && patch.telefone ? "novo" : "anonimo",
    last_contact_at: new Date().toISOString(),
    ...patch,
  }).select("id").single();
  return inserted?.id || null;
}

// ---------- Property search ----------
async function searchProperties(supabase: any, filters: any): Promise<any[]> {
  try {
    let q = supabase.from("imoveis").select("id,titulo,bairro,finalidade,tipo,preco,preco_temporada_diaria,quartos,suites,banheiros,vagas_garagem,area_m2,capacidade_pessoas,piscina,vista_mar,frente_mar,mobiliado,churrasqueira,ar_condicionado,wifi,aceita_pet,fotos,link_anuncio,anunciante_telefone,gestao_propria,destaque_pago,destaque_ate").eq("status", "ativo").or("oculta_para_maria.is.null,oculta_para_maria.eq.false").limit(20);
    if (filters.finalidade) {
      const dbFinalidade = filters.finalidade === "investimento" ? "compra" : filters.finalidade;
      q = q.eq("finalidade", dbFinalidade);
    }
    if (filters.tipo) q = q.eq("tipo", filters.tipo);
    if (filters.bairro) q = q.ilike("bairro", `%${filters.bairro}%`);
    if (filters.preco_max) {
      if (filters.finalidade === "temporada") q = q.lte("preco_temporada_diaria", filters.preco_max);
      else q = q.lte("preco", filters.preco_max);
    }
    const { data } = await q;
    return data || [];
  } catch { return []; }
}

function parseFiltersBlock(text: string) {
  const m = text.match(/\\[FILTERS\\]([\\s\\S]*?)\\[\\/FILTERS\\]/);
  if (!m) return { filters: null, cleaned: text };
  try {
    const filters = JSON.parse(m[1].trim());
    return { filters, cleaned: text.replace(/\\[FILTERS\\][\\s\\S]*?\\[\\/FILTERS\\]/g, "").trim() };
  } catch {
    return { filters: null, cleaned: text };
  }
}

// ============================================================
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, session_id, action, nome, telefone, lead_captured } = await req.json();
    const sessionId = session_id || "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (action === "submit_lead") {
      await upsertLeadBySession(supabase, sessionId, { nome, telefone, status: "novo" });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1. ROUTER
    const routerReply = await callAI(lovableApiKey, "google/gemini-2.5-flash-lite", PROMPTS.ROUTER, messages.slice(-5), 0);
    let intent = "busca";
    const routerData = safeParseJSON(routerReply);
    if (routerData?.intent) {
      intent = routerData.intent;
    }

    // 2. MAIN CHAT
    let mainModel = intent === "consultivo" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
    let mainPrompt = intent === "consultivo" ? PROMPTS.CONSULTIVO_CHAT : PROMPTS.BUSCA_CHAT;
    
    let rawReply = "";
    try {
      rawReply = await callAI(lovableApiKey, mainModel, mainPrompt, messages);
    } catch (err) {
      if (mainModel === "google/gemini-2.5-pro") {
        rawReply = await callAI(lovableApiKey, "google/gemini-2.5-flash", mainPrompt, messages);
      } else { throw err; }
    }

    // 3. FILTERS, EXTRACTION & SEARCH
    let { filters, cleaned } = parseFiltersBlock(rawReply);
    
    // EXTRACTION (Parallel/Immediate)
    let extractedData = null;
    try {
      const extReply = await callAI(lovableApiKey, "google/gemini-2.5-flash-lite", PROMPTS.EXTRACTION, messages.concat({ role: "assistant", content: rawReply }), 0);
      extractedData = safeParseJSON(extReply);
    } catch (e) { console.error("Extraction error:", e); }

    // Fallback de Busca: Se a IA não emitiu [FILTERS] mas o extrator pegou dados objetivos
    if (!filters && extractedData && (extractedData.bairro_preferencia || extractedData.orcamento_max || extractedData.tipo_imovel)) {
      console.log("[maria-search] Fallback: Applying filters from extraction");
      filters = {
        finalidade: extractedData.finalidade || "compra",
        bairro: extractedData.bairro_preferencia,
        tipo: extractedData.tipo_imovel,
        preco_max: extractedData.orcamento_max
      };
    }

    let showResults = false, noResultsGate = false, gateActive = false;
    let allProperties: any[] = [], visibleProperties: any[] = [];

    if (filters && filters.finalidade && filters.finalidade !== "anunciante") {
      allProperties = await searchProperties(supabase, filters);
      if (allProperties.length > 0) {
        showResults = true;
        if (!lead_captured && allProperties.length > 2) {
          gateActive = true;
          visibleProperties = allProperties.slice(0, 2);
        } else {
          visibleProperties = allProperties.slice(0, 3);
        }
      } else {
        noResultsGate = !lead_captured;
      }
    }

    // 4. PERSISTENCE (Background)
    if (extractedData) {
      (async () => {
        try {
          const score = calculateScore(extractedData);
          await upsertLeadBySession(supabase, sessionId, {
            lead_score: getScoreLabel(score),
            objetivo: extractedData.objetivo,
            prazo_compra: extractedData.prazo_compra,
            orcamento_max: extractedData.orcamento_max,
            resumo_ia: extractedData.resumo_ia,
            interesse: extractedData.finalidade,
            bairro_interesse: extractedData.bairro_preferencia,
            tipo_imovel: extractedData.tipo_imovel,
            nome: extractedData.nome || undefined,
            telefone: extractedData.telefone || undefined,
          });
        } catch (e) { console.error("Persistence error:", e); }
      })();
    }

    // 5. DETERMINISTIC REPLY FALLBACK
    let finalReply = cleaned;
    if (showResults) {
      if (!finalReply || finalReply.length < 10) {
        finalReply = "Encontrei opções compatíveis com seu perfil em " + (filters.bairro || 'Bombinhas') + ".";
      }
      if (!finalReply.includes("?")) {
        finalReply += "\n\nO que achou dessas opções? Quer refinar por bairro ou outra característica?";
      }
    } else if (filters && filters.finalidade && filters.finalidade !== "anunciante") {
      if (!finalReply || finalReply.length < 10) {
        if (intent === "consultivo") {
          finalReply = "Este perfil de busca merece uma análise estratégica para entender o melhor patrimônio no longo prazo. Em vez de olhar apenas as opções visíveis, faz sentido comparar regiões. Quer que eu organize seu perfil para uma análise?";
        } else {
          finalReply = "Não encontrei imóveis exatamente com esses critérios agora. Posso ampliar a busca para outros bairros. O que prefere?";
        }
      }
    }

    return new Response(JSON.stringify({
      reply: finalReply,
      show_results: showResults,
      properties: visibleProperties,
      all_properties: allProperties,
      gate_active: gateActive,
      no_results_gate: noResultsGate,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("Fatal:", err);
    return new Response(JSON.stringify({ reply: "Desculpe, tive um problema agora. 🙏", error: err.message }), { status: 500, headers: corsHeaders });
  }
});