import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// MarIA v5.0 — Assistente Estratégica VIV Bombinhas
// ============================================================

const PROMPTS = {
  ROUTER: `Você é o roteador de intenções da MarIA, assistente premium do VIV Bombinhas.
Classifique a última mensagem do usuário e o histórico com base no significado REAL, não apenas palavras-chave.

Categorias:
- "busca": Usuário quer ver imóveis, opções, fotos, cards, preços ou informou filtros objetivos (bairro, valor, tipo, temporada). Ex: "quero casa em Mariscal até 900 mil", "me mostre apartamentos", "tem imóveis em Bombas?".
- "consultivo": Perguntas de decisão, estratégia ou investimento. Ex: "onde é melhor investir?", "qual o m² de Mariscal?", "vale comprar na planta?", "tenho R$2 milhões".
- "proprietario": Usuário quer anunciar, vender, cadastrar ou divulgar imóvel próprio. Ex: "quero anunciar meu imóvel", "tenho uma casa para vender".
- "comum": Saudação, dúvidas sobre a MarIA ou conversa sem intenção clara de busca/venda. Ex: "oi", "quem é você?".

Regra Especial: Se o usuário quer imóveis E entender mercado, priorize "consultivo" para perguntar: "Você prefere que eu te mostre opções agora ou que eu organize primeiro uma análise mais estratégica?".

Retorne APENAS um JSON puro: {"intent": "busca" | "consultivo" | "proprietario" | "comum"}`,

  BUSCA_CHAT: `Você é a MarIA (Modo Busca). Seja rápida, útil e objetiva.
OBJETIVO: Levar o usuário aos cards de imóveis com o mínimo de fricção.
- Pergunte apenas o que falta para filtrar.
- Não faça análises longas.
- Quando tiver filtros suficientes, emita o bloco [FILTERS]{"finalidade":"...", "bairro":"...", "tipo":"...", "preco_max":...}[/FILTERS].
- Se não houver resultado, ofereça ajuste da busca ou alerta.`,

  CONSULTIVO_CHAT: `Você é a MarIA, assistente premium e estratégica do VIV Bombinhas. 
OBJETIVO: Triagem estratégica e autoridade. Você não é corretora, é uma consultora local.

REGRAS DE OURO:
- TOM: Premium, seguro, estratégico, curto (2 a 4 frases).
- PROIBIÇÕES: Jamais use "Excelente", "Com certeza", "Ótima escolha", "melhores oportunidades", "liquidez incrível", "retorno garantido", "off-market".
- PREFERIR: "faz sentido analisar", "depende do objetivo", "precisa ser comparado", "pode ser interessante", "costuma ter boa procura".
- M²: Não invente números. Explique que varia por distância do mar, padrão e idade. Pergunte se busca para compra agora ou estudo.
- RISCO: Fale de riscos de forma responsável (localização média, baixa liquidez em nichos, desalinhamento com objetivo).

REGRAS PARA "SEM RESULTADO":
- JAMAIS comece com "não encontrei" ou frases negativas.
- Comece com leitura estratégica. Ex: "Para esse perfil, faz sentido comparar Mariscal com Bombas para entender onde seu capital tem melhor encaixe. Quer que eu organize uma análise desse perfil?".

DANIEL E ANÁLISE:
- Não jogue o nome Daniel sem contexto. 
- 1º Venda o valor: "comparar região, perfil, liquidez, risco e coerência da compra."
- 2º Ofereça: "Essa leitura pode ser conduzida pelo Daniel...".
- SINAIS PARA OFERECER: Mínimo 2 sinais (Investimento, >1.5M, dúvida m²/risco, comparação bairros).
- CAPTURA: Peça nome e WhatsApp antes de dizer que vai encaminhar: "Para organizar seu perfil para análise, me informe seu nome e WhatsApp."`,

  PROPRIETARIO_CHAT: `Você é a MarIA (Modo Proprietário). 
- Identifique se é proprietário, corretor ou imobiliária.
- Pergunte se o imóvel é para venda ou temporada.
- Explique que você recomenda imóveis que combinam com buscas reais no portal.
- Direcione para o fluxo de cadastro.`,

  COMUM_CHAT: `Você é a MarIA, assistente do VIV Bombinhas.
- Explique rapidamente que ajuda a encontrar imóveis (temporada/compra), investir ou anunciar.
- Convide o usuário a escolher um caminho.`,

  EXTRACTION: `Você é um analista de CRM estratégico. Devolva APENAS um JSON puro.
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
  "lead_score": "frio" | "morno" | "quente" | "premium",
  "resumo_ia": string
}
Regras:
- "resumo_ia": Útil para o Daniel (ex: "Lead premium. Busca renda em Mariscal, 2mi, aberto a análise comparativa").`
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
    return null;
  }
}

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
    status: (patch.nome && patch.telefone) ? "novo" : "anonimo",
    last_contact_at: new Date().toISOString(),
    ...patch,
  }).select("id").single();
  return inserted?.id || null;
}

async function searchProperties(supabase: any, filters: any): Promise<any[]> {
  try {
    let q = supabase.from("imoveis").select("*").eq("status", "ativo").or("oculta_para_maria.is.null,oculta_para_maria.eq.false").limit(20);
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
    const routerReply = await callAI(lovableApiKey, "google/gemini-2.0-flash-lite-preview-02-05", PROMPTS.ROUTER, messages.slice(-5), 0);
    const routerData = safeParseJSON(routerReply);
    const intent = routerData?.intent || "busca";

    // 2. MAIN CHAT
    let mainModel = "google/gemini-2.0-flash-lite-preview-02-05";
    let mainPrompt = PROMPTS.BUSCA_CHAT;

    if (intent === "consultivo") {
      mainModel = "google/gemini-2.0-pro-exp-02-05"; // Model mais inteligente para estratégia
      mainPrompt = PROMPTS.CONSULTIVO_CHAT;
    } else if (intent === "proprietario") {
      mainPrompt = PROMPTS.PROPRIETARIO_CHAT;
    } else if (intent === "comum") {
      mainPrompt = PROMPTS.COMUM_CHAT;
    }

    let rawReply = "";
    try {
      rawReply = await callAI(lovableApiKey, mainModel, mainPrompt, messages);
    } catch (err) {
      rawReply = await callAI(lovableApiKey, "google/gemini-2.0-flash-lite-preview-02-05", mainPrompt, messages);
    }

    // 3. FILTERS, EXTRACTION & SEARCH
    let { filters, cleaned } = parseFiltersBlock(rawReply);
    
    // Immediate extraction for context
    let extractedData = null;
    try {
      const extReply = await callAI(lovableApiKey, "google/gemini-2.0-flash-lite-preview-02-05", PROMPTS.EXTRACTION, messages.concat({ role: "assistant", content: rawReply }), 0);
      extractedData = safeParseJSON(extReply);
    } catch (e) { console.error("Extraction error:", e); }

    // Fallback: IA esqueceu [FILTERS] mas o extrator pegou filtros objetivos
    if (!filters && extractedData && (extractedData.bairro_preferencia || extractedData.orcamento_max || extractedData.tipo_imovel)) {
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
          await upsertLeadBySession(supabase, sessionId, {
            lead_score: extractedData.lead_score,
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

    // 5. DETERMINISTIC REPLY FALLBACK (Para casos de resposta vazia ou erro)
    let finalReply = cleaned || rawReply;
    if (showResults && (!finalReply || finalReply.length < 10)) {
      finalReply = "Encontrei opções compatíveis com seu perfil em " + (filters.bairro || 'Bombinhas') + ".";
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
    return new Response(JSON.stringify({ reply: "Desculpe, tive um problema agora. 🙏", error: err.message }), { status: 500, headers: corsHeaders });
  }
});