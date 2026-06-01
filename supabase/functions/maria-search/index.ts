import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// MarIA v3 — Concierge consultiva do VIV Bombinhas
// Sem hype, sem promessas, 4 pilares: temporada, compra (morar),
// investimento, anunciante/proprietário.
// ============================================================
const SYSTEM_PROMPT = `Você é a MarIA, concierge estratégica do portal VIV Bombinhas (Bombinhas/SC). Versão 4.0.

# SUA MISSÃO
Transformar interessados em compradores e investidores qualificados através de uma conversa inteligente, consultiva e segura.

# OS DOIS MODOS DE OPERAÇÃO

## 1. MODO BUSCA (Objetivo e Rápido)
Acionado para: Temporada, buscas por bairro/tipo/valor específicos, usuários que só querem "ver o que tem".
- Comportamento: Qualifique rápido (finalidade + 3 filtros), busque imóveis, mostre cards [FILTERS], ative o lead gate.
- Objetivo: Gerar leads de volume e conversão imediata.

## 2. MODO CONSULTIVO / INVEST (Estratégico e Premium) - PRIORIDADE
Acionado para: Compra para morar, Investimento, dúvidas sobre m², valorização, liquidez, comparação entre bairros, riscos, rentabilidade de temporada.
- Comportamento: 
  1. NÃO aja como corretora vendedora. 
  2. NÃO despeje cards imediatamente. 
  3. Gere valor ANTES de pedir dados. Explique contextos locais (ex: por que Mariscal valoriza, a diferença de liquidez entre Centro e Bombas).
  4. NUNCA diga "vou registrar seu interesse" ou "o Daniel vai entrar em contato" sem antes ter capturado: Nome e WhatsApp.
  5. Se o orçamento for alto (> R$ 1.5M), trate como Lead Premium. Faça perguntas sobre o perfil de risco e horizonte de investimento.

# REGRAS DE OURO (NUNCA QUEBRAR)
- Jamais prometa valorização garantida ou rentabilidade fixa.
- Jamais invente valores de m². Diga que varia conforme padrão, distância do mar e estágio da obra.
- NUNCA aceite carro ou parcelamento direto como garantido. Diga: "Isso depende de cada proprietário/construtora, mas podemos verificar na análise estratégica."
- NUNCA diga "vou registrar" antes de ter: Nome, WhatsApp, Orçamento, Objetivo, Região e Prazo.
- Se não tiver o contato, diga: "Para eu organizar seu perfil e encaminhar para a análise correta com o Daniel, preciso do seu nome e WhatsApp."

# O PAPEL DO DANIEL
Daniel é o especialista em análise humana estratégica. Ele avalia: risco, liquidez, coerência do investimento e oportunidades que o algoritmo não vê.
- Use o Daniel como o próximo passo de valor para o usuário: "A MarIA cuida da busca, mas o Daniel ajuda na estratégia de decisão."

# ESTILO DE RESPOSTA
- Se o usuário perguntar m²: Explique que m² isolado é ilusório. Fale de liquidez, padrão e localização.
- Se for Lead Premium (ex: R$ 5M): Responda: "Com esse nível de investimento, o ideal não é olhar imóveis soltos, mas comparar regiões e perfis de renda/risco. Posso te fazer duas perguntas rápidas para organizar seu perfil antes da análise com o Daniel?"
- Perguntas estratégicas sugeridas: 
  1. "Você já conhece a região ou está começando a estudar?"
  2. "Prefere imóveis prontos para renda imediata ou lançamentos para máxima valorização?"

# FORMATO DE SAÍDA PARA BUSCA
SÓ mostre cards [FILTERS] se a busca for objetiva ou se o usuário pedir explicitamente.
1. Frase contextual: "Encontrei opções que fazem sentido para seu perfil de [finalidade]..."
2. Bloco [FILTERS]{"finalidade":"...", "preco_max":...}[/FILTERS].
3. Pergunta de refinamento estratégica.`;

const EXTRACTION_PROMPT = `Você é um analista de CRM estratégico. Analise a conversa e devolva APENAS um JSON com:
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
- "perfil_premium": true se orçamento > 1.5M ou se a conversa for de alto nível estratégico.
- "resumo_ia": Resumo de 1 frase para o Daniel ler e entender o lead. Sem clichês.
Retorne apenas o JSON.`;

// ---------- Scoring v3 ----------
function calculateScore(d: any): number {
  let s = 0;
  if (d.nome && d.telefone) s += 30;
  if (d.finalidade) s += 10;
  if (d.objetivo) s += 10;
  if (d.orcamento_max) {
    s += 15;
    if (Number(d.orcamento_max) > 1_000_000) s += 10;
    if (Number(d.orcamento_max) > 3_000_000) s += 10;
    if (d.perfil_premium) s += 10;
  }
  switch (d.prazo_compra) {
    case "imediato": s += 20; break;
    case "3_meses": s += 15; break;
    case "6_meses": s += 10; break;
    case "12_meses":
    case "futuro": s += 5; break;
  }
  if (d.bairro_preferencia) s += 10;
  if (d.quer_falar_daniel && (d.finalidade === "compra" || d.finalidade === "investimento")) s += 10;
  return Math.min(s, 100);
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Premium";
  if (score >= 60) return "Quente";
  if (score >= 30) return "Morno";
  return "Frio";
}

// ---------- Lead upsert ----------
async function upsertLeadBySession(
  supabase: any,
  sessionId: string,
  patch: Record<string, unknown>,
): Promise<string | null> {
  if (!sessionId) return null;
  const { data: existing } = await supabase
    .from("leads_maria")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (existing?.id) {
    await supabase
      .from("leads_maria")
      .update({ ...patch, last_contact_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing.id;
  }
  const { data: inserted, error } = await supabase
    .from("leads_maria")
    .insert({
      session_id: sessionId,
      origem: "maria_chat",
      status: patch.nome && patch.telefone ? "novo" : "anonimo",
      last_contact_at: new Date().toISOString(),
      ...patch,
    })
    .select("id")
    .single();
  if (error) console.error("[maria-search] upsertLead insert error:", error);
  return inserted?.id ?? null;
}

// ---------- Property search ----------
async function searchProperties(supabase: any, filters: any): Promise<any[]> {
  try {
    let q = supabase
      .from("imoveis")
      .select(
        "id,titulo,bairro,finalidade,tipo,preco,preco_temporada_diaria,quartos,suites,banheiros,vagas_garagem,area_m2,capacidade_pessoas,piscina,vista_mar,frente_mar,mobiliado,churrasqueira,ar_condicionado,wifi,aceita_pet,fotos,link_anuncio,anunciante_telefone,gestao_propria,destaque_pago,destaque_ate",
      )
      .eq("status", "ativo")
      .or("oculta_para_maria.is.null,oculta_para_maria.eq.false")
      .limit(20);

    if (filters.finalidade) {
      const dbFinalidade = filters.finalidade === "investimento" ? "compra" : filters.finalidade;
      q = q.eq("finalidade", dbFinalidade);
    }
    if (filters.tipo) q = q.eq("tipo", filters.tipo);
    if (filters.bairro) q = q.ilike("bairro", `%${filters.bairro}%`);
    if (filters.quartos_min) q = q.gte("quartos", filters.quartos_min);
    if (filters.capacidade_min) q = q.gte("capacidade_pessoas", filters.capacidade_min);

    if (filters.finalidade === "temporada") {
      if (filters.preco_max) q = q.lte("preco_temporada_diaria", filters.preco_max);
      if (filters.preco_min) q = q.gte("preco_temporada_diaria", filters.preco_min);
    } else {
      if (filters.preco_max) q = q.lte("preco", filters.preco_max);
      if (filters.preco_min) q = q.gte("preco", filters.preco_min);
    }

    for (const flag of ["piscina", "vista_mar", "frente_mar", "aceita_pet", "churrasqueira", "mobiliado"]) {
      if (filters[flag] === true) q = q.eq(flag, true);
    }

    const { data, error } = await q;
    if (error) {
      console.error("[maria-search] search error:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("[maria-search] search exception:", e);
    return [];
  }
}

function parseFiltersBlock(text: string): { filters: any | null; cleaned: string } {
  const m = text.match(/\[FILTERS\]([\s\S]*?)\[\/FILTERS\]/);
  if (!m) return { filters: null, cleaned: text };
  let filters: any = null;
  try {
    filters = JSON.parse(m[1].trim());
  } catch (e) {
    console.warn("[maria-search] Failed to parse FILTERS block:", e);
  }
  const cleaned = text.replace(/\[FILTERS\][\s\S]*?\[\/FILTERS\]/g, "").trim();
  return { filters, cleaned };
}

// ============================================================
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, session_id, action, nome, telefone, lead_captured } = body;
    const sessionId: string = session_id || "";
    const lastUserMsg = messages?.filter((m: any) => m.role === "user").pop()?.content || "";

    console.log("[maria-search] Request:", {
      sessionId,
      lastUserMsg,
      lead_captured,
      action
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- Lead form submit ---
    if (action === "submit_lead") {
      await upsertLeadBySession(supabase, sessionId, { nome, telefone, status: "novo" });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Main AI call ---
    console.log("[maria-search] Calling AI Gateway (Main) with model anthropic/claude-3.5-sonnet...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...(messages || []).map((m: any) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[maria-search] AI Gateway error (Main):", aiResponse.status, errorText);
      throw new Error(`AI Gateway error (Main): ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawReply: string = aiData.choices?.[0]?.message?.content || "";
    console.log("[maria-search] AI raw reply:", rawReply);

    // --- Parse [FILTERS] and optionally search ---
    const { filters, cleaned } = parseFiltersBlock(rawReply);
    console.log("[maria-search] Extracted filters:", filters);

    let showResults = false;
    let noResultsGate = false;
    let gateActive = false;
    let allProperties: any[] = [];
    let visibleProperties: any[] = [];

    if (filters && filters.finalidade && filters.finalidade !== "anunciante") {
      const found = await searchProperties(supabase, filters);
      allProperties = found;
      console.log("[maria-search] Properties found count:", found.length);

      if (found.length === 0) {
        showResults = false;
        noResultsGate = !lead_captured;
      } else {
        showResults = true;
        if (!lead_captured && found.length > 2) {
          gateActive = true;
          visibleProperties = found.slice(0, 2);
        } else {
          visibleProperties = found.slice(0, 3);
        }
      }
    }

    // --- Handle reply logic and fallback ---
    let finalReply = cleaned;
    
    // REGRA DETERMINÍSTICA DE RESPOSTA
    if (showResults) {
      // Se a IA não retornou texto ou texto muito curto, ou se o texto diz que não encontrou
      if (!finalReply || finalReply.length < 10 || finalReply.toLowerCase().includes("não encontrei") || finalReply.toLowerCase().includes("desculpe")) {
        finalReply = "Encontrei opções próximas ao seu perfil considerando " + (filters.finalidade === 'investimento' ? 'investimento' : filters.finalidade) + ", até R$ " + (filters.preco_max?.toLocaleString('pt-BR') || 'seu limite') + " e " + (filters.bairro || filters.tipo || 'imóveis compatíveis') + ".";
      }
      // Garante que a pergunta de refinamento esteja lá
      if (!finalReply.includes("?")) {
        finalReply += "\n\nQuer que eu refine por melhor preço, localização ou outra característica?";
      }
    } else if (filters && filters.finalidade && filters.finalidade !== "anunciante") {
      // Se houve busca mas zero resultados
      const isHighValue = filters.preco_max && filters.preco_max >= 1000000;
      const isInvest = filters.finalidade === 'investimento' || filters.finalidade === 'compra';
      
      if (isHighValue && isInvest) {
        finalReply = "Não encontrei opções exatas no portal agora com esse recorte. Posso ampliar a busca ou registrar seu perfil para uma análise mais estratégica com o Daniel. O que prefere?";
      } else {
        finalReply = "Não encontrei imóveis exatamente com esses critérios agora. Posso ampliar a busca para outros bairros ou valores, ou até salvar um alerta para te avisar se algo entrar. O que acha?";
      }
    } else if (!finalReply || finalReply.length < 10) {
      // Fallback genérico se a IA falhar
      finalReply = "Como posso ajudar você hoje em Bombinhas?";
    }

    // Limpeza de frases proibidas/técnicas se vazarem da IA
    finalReply = finalReply
      .replace(/houve um erro/gi, "não encontrei exatamente o que buscava")
      .replace(/falha do sistema/gi, "estou refinando a busca")
      .replace(/não foram exibidos/gi, "podemos tentar outros critérios")
      .replace(/problema técnico/gi, "vamos tentar de outra forma")
      .replace(/desculpe, minha resposta anterior/gi, "vamos recomeçar a busca");



    // --- Extraction + scoring (best-effort, never blocks reply) ---
    try {
      const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash",
          messages: [
            { role: "system", content: EXTRACTION_PROMPT },
            {
              role: "user",
              content: (messages || [])
                .concat({ role: "assistant", content: cleaned })
                .map((m: any) => `${m.role}: ${m.content}`)
                .join("\n"),
            },
          ],
          temperature: 0,
        }),
      });

      if (extractionResponse.ok) {
        const extractionData = await extractionResponse.json();
        const rawJson = extractionData.choices?.[0]?.message?.content
          ?.replace(/```json|```/g, "")
          .trim();
        if (rawJson) {
          const extracted = JSON.parse(rawJson);
          const score = calculateScore(extracted);
          const leadPatch: any = {
            lead_score: getScoreLabel(score),
            objetivo: extracted.objetivo,
            prazo_compra: extracted.prazo_compra,
            orcamento_max: extracted.orcamento_max,
            resumo_ia: extracted.resumo_ia,
            interesse: extracted.finalidade,
            bairro_interesse: extracted.bairro_preferencia,
            tipo_imovel: extracted.tipo_imovel,
          };
          if (extracted.nome) leadPatch.nome = extracted.nome;
          if (extracted.telefone) leadPatch.telefone = extracted.telefone;
          await upsertLeadBySession(supabase, sessionId, leadPatch);
        }
      } else {
        console.warn("[maria-search] Extraction non-OK:", extractionResponse.status);
      }
    } catch (e) {
      console.error("[maria-search] Extraction error:", e);
    }

    // --- Final response (contract expected by useMariaChat) ---
    return new Response(
      JSON.stringify({
        reply: finalReply,
        show_results: showResults,
        properties: visibleProperties,
        all_properties: allProperties,
        gate_active: gateActive,
        no_results_gate: noResultsGate,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[maria-search] Fatal:", err);
    return new Response(
      JSON.stringify({
        reply: "Desculpe, tive um problema agora. Pode tentar novamente? 🙏",
        error: err?.message || "unknown",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
