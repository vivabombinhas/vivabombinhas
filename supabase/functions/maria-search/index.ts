import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// MarIA v4.5 — Multi-Agent Architecture
// ============================================================

const PROMPTS = {
  ROUTER: `Você é o roteador de intenções da MarIA. Analise a última mensagem do usuário e o histórico para classificar a intenção predominante.
Categorias:
- "busca": Temporada, buscas objetivas por bairro/tipo/valor, ver fotos/imóveis.
- "consultivo": Compra para morar, Investimento, dúvidas m², valorização, riscos, regiões, análise Daniel.
- "proprietario": Anunciar imóvel, vender como proprietário.
- "comum": Oi, tudo bem, agradecimentos, conversas sem busca.

Retorne APENAS um JSON puro, sem blocos de markdown: {"intent": "busca" | "consultivo" | "proprietario" | "comum"}`,

  BUSCA_CHAT: `Você é a MarIA (Modo Busca). Seja rápida e objetiva.
Ajude o usuário a filtrar imóveis: finalidade, bairro, tipo, valor.
Quando tiver filtros suficientes, você DEVE emitir o bloco [FILTERS]{"finalidade":"...", "bairro":"...", "tipo":"...", "preco_max":...}[/FILTERS] na mesma resposta.
Regra: Se o usuário pedir para ver imóveis, você DEVE emitir o bloco [FILTERS].`,

  CONSULTIVO_CHAT: `Você é a MarIA, pré-consultora estratégica em Bombinhas (Mariscal, Bombas, Canto Grande, Quatro Ilhas). Seja premium, direta e estratégica.

REGRAS DE CONTEÚDO:
- REGRAS DE OURO: Use no máximo 4 frases CURTAS no total, contando bullets e perguntas. No máximo 3 bullets. É proibido ultrapassar 4 frases no total.
- TOM: Local, inteligente e objetivo. Sem hype ou tom de corretor. Use "costuma ter boa procura", "precisa ser comparado", "vale analisar com critério".
- METRO QUADRADO: Não invente valores. Explique que o valor m² varia drasticamente por distância do mar, padrão e idade do imóvel.
- CONDUÇÃO: Responda de forma útil e faça 1 pergunta estratégica (ex: busca renda, valorização ou uso próprio?).

REGRAS PARA "SEM RESULTADOS":
- Se perceber que não há imóveis exatos para o que o usuário busca, JAMAIS comece com "não encontrei", "não temos", "sem opções" ou qualquer frase negativa.
- Comece com uma leitura estratégica da região/perfil. Explique que, para investimento/moradia, limitar a decisão ao que está visível agora no portal pode não ser o melhor caminho.
- Ofereça comparação de regiões (ex: Mariscal vs Bombas) ou análise de perfil estratégica com o Daniel.
- Só mencione que não há opção exata agora se for perguntado diretamente ("Mas tem imóvel?") ou após propor o próximo passo estratégico.

DANIEL E LEAD:
- Ofereça análise estratégica com o Daniel para leads qualificados (>1.5M ou dúvidas estratégicas).
- Se o usuário aceitar, peça Nome e WhatsApp imediatamente: "Para encaminhar seu perfil corretamente, me informe seu nome e WhatsApp."
- Não diga "vou registrar seu interesse" sem antes ter o contato.
- Só emita [FILTERS] se ele pedir explicitamente para ver opções agora.`,

  EXTRACTION: `Você é um analista de CRM estratégico. Analise a conversa e devolva APENAS um JSON puro, sem blocos de markdown e sem nenhum outro texto.
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
- "perfil_premium": true se orçamento > 1.5M ou conversa estratégica de alto nível.
- "resumo_ia": 1 frase para o Daniel entender o lead.
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
  if (!response.ok) throw new Error(`AI Gateway error (${model}): ${response.status}`);
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
    // Tenta encontrar o bloco JSON caso haja texto ao redor
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
  const m = text.match(/\[FILTERS\]([\s\S]*?)\[\/FILTERS\]/);
  if (!m) return { filters: null, cleaned: text };
  try {
    const filters = JSON.parse(m[1].trim());
    return { filters, cleaned: text.replace(/\[FILTERS\][\s\S]*?\[\/FILTERS\]/g, "").trim() };
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
    } else {
      console.warn("Router parse failed, defaulting to busca", routerReply);
    }

    // 2. MAIN CHAT
    let mainModel = intent === "consultivo" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
    let mainPrompt = intent === "consultivo" ? PROMPTS.CONSULTIVO_CHAT : PROMPTS.BUSCA_CHAT;
    
    let rawReply = "";
    try {
      rawReply = await callAI(lovableApiKey, mainModel, mainPrompt, messages);
    } catch (err) {
      console.error(`Main AI error (${mainModel}):`, err);
      // Fallback
      if (mainModel === "google/gemini-2.5-pro") {
        console.log("Falling back to gemini-2.5-flash...");
        rawReply = await callAI(lovableApiKey, "google/gemini-2.5-flash", mainPrompt, messages);
      } else {
        throw err;
      }
    }

    // 3. FILTERS & SEARCH
    console.log("[maria-search] Raw AI reply for parsing:", rawReply);
    const { filters, cleaned } = parseFiltersBlock(rawReply);
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

    // 4. EXTRACTION (Parallel background-ish)
    (async () => {
      try {
        const extReply = await callAI(lovableApiKey, "google/gemini-2.5-flash-lite", PROMPTS.EXTRACTION, messages.concat({ role: "assistant", content: rawReply }), 0);
        const extracted = safeParseJSON(extReply);
        if (extracted) {
          const score = calculateScore(extracted);
          await upsertLeadBySession(supabase, sessionId, {
            lead_score: getScoreLabel(score),
            objetivo: extracted.objetivo,
            prazo_compra: extracted.prazo_compra,
            orcamento_max: extracted.orcamento_max,
            resumo_ia: extracted.resumo_ia,
            interesse: extracted.finalidade,
            bairro_interesse: extracted.bairro_preferencia,
            tipo_imovel: extracted.tipo_imovel,
            nome: extracted.nome || undefined,
            telefone: extracted.telefone || undefined,
          });
        }
      } catch (e) { console.error("Extraction error:", e); }
    })();

    // 5. DETERMINISTIC REPLY FALLBACK
    let finalReply = cleaned;
    if (showResults) {
      if (!finalReply || finalReply.length < 10) {
        finalReply = "Encontrei opções que fazem sentido para seu perfil considerando " + (filters.finalidade === 'investimento' ? 'investimento' : filters.finalidade) + ", até R$ " + (filters.preco_max?.toLocaleString('pt-BR') || 'seu limite') + ".";
      }
      if (!finalReply.includes("?")) {
        finalReply += "\n\nO que achou dessas opções? Quer refinar por bairro ou outra característica?";
      }
    } else if (filters && filters.finalidade && filters.finalidade !== "anunciante") {
      if (!finalReply || finalReply.length < 10) {
        if (intent === "consultivo") {
          finalReply = "Este perfil de busca é bem específico e merece uma análise estratégica para entender o melhor encaixe de capital. Em vez de olhar apenas as opções visíveis agora, faz sentido comparar regiões e padrões para encontrar a melhor oportunidade. Quer que eu organize uma análise desse perfil para você?";
        } else {
          finalReply = "Não encontrei imóveis exatamente com esses critérios agora. Posso ampliar a busca para outros bairros ou registrar seu perfil para uma busca automatizada. O que prefere?";
        }
      }
    } else if (!finalReply || finalReply.length < 5) {
      finalReply = "Como posso ajudar você hoje em Bombinhas? Estou aqui para ajudar a encontrar o imóvel ideal ou analisar o mercado.";
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