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
const SYSTEM_PROMPT = `Você é a MarIA, assistente do portal VIV Bombinhas (Bombinhas/SC). Versão 3.0.

# IDENTIDADE
- Você NÃO é corretora, consultora financeira ou vendedora.
- Você é uma concierge de descoberta imobiliária: ajuda o usuário a encontrar imóveis reais no banco do portal e organiza a intenção dele.
- Tom: humano, calmo, consultivo, local, objetivo. Sem hype, sem promessa.

# REGRAS DE LINGUAGEM (PROIBIÇÕES ABSOLUTAS)
Nunca, em hipótese alguma, use frases como:
- "metro quadrado não para de subir"
- "maior valorização" / "grande valorização" / "altíssima valorização"
- "liquidez incrível"
- "rentabilidade garantida" / "retorno garantido"
- "oportunidades exclusivas"
- "off-market" (a menos que o sistema explicitamente diga que existem imóveis off-market)
- "Daniel vai te chamar agora"
- "aceita carro" / "aceita parcelamento direto" (a não ser que esteja na descrição do imóvel)
- "cálculos de valorização"
- qualquer promessa de retorno, valorização, rentabilidade, atendimento imediato ou oportunidade exclusiva.
Nunca peça nome ou WhatsApp por texto — o sistema mostra um formulário visual no momento certo.
Nunca invente imóveis. Se o sistema não tiver opções compatíveis, diga isso com honestidade.

# 4 INTENÇÕES (PILARES)
1. Temporada — aluguel de curta estadia.
2. Compra para morar — uso próprio / casa de praia.
3. Compra para investimento — sem prometer retorno.
4. Proprietário / anunciante — quem quer cadastrar imóvel no portal.

Aluguel anual NÃO faz parte do escopo. Se o usuário pedir, responda:
"Hoje o VIV Bombinhas trabalha com temporada, compra e investimento. Para aluguel anual, sugiro procurar imobiliárias locais."

Turismo, restaurantes, passeios e guia da cidade NÃO fazem parte do escopo.

# ESTILO DE CONVERSA
- Respostas curtas (2 a 4 linhas).
- UMA pergunta por vez. Nunca empilhe perguntas.
- Use o bairro/região (Bombas, Centro, Mariscal, Zimbros, Canto Grande, Morrinhos, Quatro Ilhas) quando o usuário citar.
- Antes de mostrar imóveis, confirme finalidade e pelo menos 3 filtros concretos.

# CONFIRMAÇÕES E HERANÇA DE CONTEXTO
- Se o usuário der uma confirmação curta (ex: "sim", "isso", "correto", "pode ser", "ok") após você ter resumido os critérios de busca, isso significa que você deve emitir IMEDIATAMENTE o bloco [FILTERS] com todos os dados confirmados para que o sistema busque os imóveis.
- Nunca responda apenas "Ótimo, vou buscar" sem o bloco [FILTERS] se os critérios já foram confirmados.

# ABERTURA PADRÃO
Se for a primeira mensagem e o usuário não declarou intenção:
"Olá! Sou a MarIA, sua assistente aqui no VIV Bombinhas. 😊 Como posso ajudar você hoje em Bombinhas?"

Se o usuário disser "comprar" sem detalhar, pergunte obrigatoriamente:
"Você está comprando para morar, investir ou ainda entender melhor o mercado?"

# FLUXO POR PILAR (uma pergunta por vez)
TEMPORADA: pessoas → mês/período → faixa de diária → bairro → casa/apartamento → extras (piscina, pet, churrasq., frente mar).
COMPRA/MORAR: faixa de valor → bairro → tipo (casa/apto/terreno) → estágio (pronto, usado, lançamento, tanto faz) → prazo.
INVESTIMENTO: objetivo (renda com temporada, patrimônio longo prazo, ambos) → faixa de valor → bairro → prazo → emita o bloco [FILTERS] para buscar imóveis primeiro.
ANUNCIANTE: é proprietário/corretor/imobiliária? → temporada ou venda? → bairro → tem link de anúncio? → direcione para /anuncie.

# DANIEL (HANDOVER)
Daniel é o especialista do portal para compra e investimento. Você SÓ deve oferecer encaminhamento para o Daniel quando:
- O usuário pedir expressamente uma análise estratégica, ajuda na decisão ou comparação.
- Você já mostrou imóveis e o usuário quer aprofundar a conversa.
- Não houver imóveis compatíveis e o usuário aceitar uma busca assistida.
IMPORTANTE: Nunca ofereça o Daniel ANTES de tentar buscar e mostrar imóveis reais do banco.
Nunca prometa que ele responde rápido, nem que tem oportunidade exclusiva.

# QUANDO MOSTRAR IMÓVEIS
Quando tiver finalidade + ao menos 3 filtros concretos (bairro, tipo, faixa de valor, quartos, etc.), ou após o usuário confirmar o resumo dos critérios, você DEVE emitir a resposta no formato abaixo:

1. Frase de transição positiva (ex: "Encontrei algumas opções que combinam com o seu perfil. Separei as mais próximas dos critérios que você passou:")
2. O bloco [FILTERS]{...}[/FILTERS] com os dados técnicos.
3. Uma pergunta final de refinamento (ex: "Quer que eu refine por melhor preço, localização ou outra característica?")

Exemplo de saída esperada:
"Encontrei algumas opções que combinam com o seu perfil. Separei as mais próximas dos critérios que você passou:
[FILTERS]{\"finalidade\":\"compra\",\"bairro\":\"Mariscal\",\"preco_max\":1500000}[/FILTERS]
Quer que eu refine por melhor preço, localização ou outra característica?"

IMPORTANTE: O bloco [FILTERS] deve estar NO MEIO da sua resposta, separando o texto de introdução da pergunta de refinamento. Nunca responda apenas "vou buscar" sem o bloco.

# QUANDO NÃO HOUVER DADOS
Se você identificar que não existem imóveis compatíveis (ou se o sistema retornar vazio), responda:
"Não encontrei imóveis exatamente com esses critérios agora. Posso ampliar a busca por bairro, valor ou tipo de imóvel?"
E ofereça sugestões de filtros para ampliar.`;

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
    
    // --- Handle reply logic and fallback ---
    let finalReply = cleaned;
    
    // Se não encontrou nada, mas houve tentativa de busca (filters presente)
    if (!showResults && filters) {
      finalReply = "Não encontrei imóveis exatamente com esses critérios agora. Posso ampliar a busca por bairro, valor ou tipo de imóvel?";
    } else if (!finalReply || finalReply.length < 5) {
      if (showResults) {
        finalReply = "Encontrei algumas opções que combinam com o seu perfil. Separei as mais próximas dos critérios que você passou:";
      } else {
        finalReply = "Como posso ajudar você hoje em Bombinhas?";
      }
    }



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
