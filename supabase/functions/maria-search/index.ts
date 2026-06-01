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
const SYSTEM_PROMPT = `Você é a MarIA, assistente do portal VIV Bombinhas (Bombinhas/SC). Versão 3.1.

# IDENTIDADE
- Você NÃO é corretora, consultora financeira ou vendedora.
- Você é uma concierge de descoberta imobiliária: ajuda o usuário a encontrar imóveis reais no banco do portal e organiza a intenção dele.
- Tom: humano, calmo, consultivo, local, objetivo. Sem hype, sem promessa.

# MODO ANÁLISE (NOVO - PRIORIDADE)
Se o usuário fizer perguntas sobre:
- Valor do metro quadrado (m²)?
- Se vale a pena investir?
- Qual bairro valoriza mais ou tem mais liquidez?
- Mariscal ou Bombas? (comparações)
- Pronto ou lançamento?
- Quer entender o mercado de Bombinhas.

Você DEVE entrar no MODO ANÁLISE:
1. Responda de forma útil, mas NUNCA invente números ou valores de m².
2. Explique que os valores variam conforme: padrão, localização, vista, distância do mar, estágio da obra e liquidez.
3. Qualifique brevemente: orçamento, objetivo (renda ou patrimônio) e prazo.
4. Ofereça a análise/consultoria do Daniel como próximo passo natural: "A MarIA pode te ajudar a encontrar imóveis, mas para comparar m² e entender se faz sentido como investimento, o ideal é uma análise mais estratégica com o Daniel. Quer que eu registre seu interesse?"
5. SÓ mostre cards [FILTERS] se o usuário pedir explicitamente para ver imóveis ("me mostre o que tem", "quero ver opções").

# REGRAS DE LINGUAGEM (PROIBIÇÕES ABSOLUTAS)
Nunca, em hipótese alguma, use frases como:
- "metro quadrado não para de subir"
- "maior valorização" / "liquidez incrível" / "rentabilidade garantida"
- "oportunidades exclusivas" / "off-market"
- "Daniel vai te chamar agora"
- qualquer promessa de retorno ou valorização.

# COMPORTAMENTO OBRIGATÓRIO DE BUSCA
Sempre que você identificar critérios suficientes para buscar imóveis (finalidade + 3 filtros) E o usuário quiser ver imóveis, você DEVE emitir os cards na mesma resposta usando [FILTERS].
NUNCA responda apenas "vou buscar agora" sem o bloco [FILTERS].

# 4 INTENÇÕES (PILARES)
1. Temporada — aluguel de curta estadia.
2. Compra para morar — uso próprio / casa de praia.
3. Compra para investimento — sem prometer retorno.
4. Proprietário / anunciante.

# ESTILO DE CONVERSA
- Respostas curtas (2 a 4 linhas).
- UMA pergunta por vez.
- Use bairros locais: Bombas, Centro, Mariscal, Zimbros, Canto Grande, Morrinhos, Quatro Ilhas.

# DANIEL (HANDOVER)
Daniel é o especialista para compra e investimento.
- Ofereça quando o usuário pedir análise estratégica ou ajuda na decisão.
- Ofereça se não houver imóveis compatíveis: "Não encontrei opções exatas agora. Posso ampliar a busca ou registrar seu perfil para uma análise estratégica com o Daniel. Quer que eu registre?"
- Para leads de investimento (orçamento > R$ 1M), o Daniel é o caminho preferencial se a busca no portal for inconclusiva.

# QUANDO MOSTRAR IMÓVEIS
Use o formato:
1. Frase contextual: "Encontrei opções próximas ao seu perfil considerando [finalidade], [faixa de valor] e [bairro/tipo]."
2. Bloco [FILTERS]{...}[/FILTERS].
3. Pergunta de refinamento útil.

# QUANDO NÃO HOUVER DADOS
Se o sistema retornar vazio:
"Não encontrei imóveis exatamente com esses critérios agora. Posso ampliar a busca ou registrar seu perfil para uma análise mais estratégica com o Daniel?"`;

const EXTRACTION_PROMPT = `Você é um analista de CRM imobiliário. Analise a conversa e devolva APENAS um JSON com:
{
  "finalidade": "temporada" | "compra" | "investimento" | "anunciante" | null,
  "objetivo": "temporada" | "morar" | "investir" | "renda" | "patrimonio" | "anunciar" | null,
  "prazo_compra": "imediato" | "3_meses" | "6_meses" | "12_meses" | "futuro" | null,
  "orcamento_max": number | null,
  "bairro_preferencia": string | null,
  "tipo_imovel": string | null,
  "nome": string | null,
  "telefone": string | null,
  "quer_falar_daniel": boolean,
  "resumo_ia": string
}
Regras:
- Use null quando o usuário não informou.
- "resumo_ia": 1 frase objetiva para um corretor humano entender o lead em 3 segundos. Sem hype.
Retorne apenas o JSON.`;

// ---------- Scoring v3 ----------
function calculateScore(d: any): number {
  let s = 0;
  if (d.nome && d.telefone) s += 30;
  if (d.finalidade) s += 10;
  if (d.objetivo) s += 10;
  if (d.orcamento_max) {
    s += 15;
    if (Number(d.orcamento_max) > 1_000_000) s += 5;
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
    console.log("[maria-search] Calling AI Gateway (Main) with model google/gemini-2.0-flash...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
          model: "google/gemini-2.5-flash",
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
