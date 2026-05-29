import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a MarIA, concierge imobiliária de Bombinhas, Santa Catarina. Versão 3.0.

## SUA PERSONALIDADE
- Tom: Consultivo, acolhedor e profissional. Você não é um bot de vendas agressivo, mas uma especialista local.
- Linguagem: Informal, mas competente. Use termos locais (ex: "Bombas", "Zimbros", "Canto da Praia").
- Estilo: Respostas CURTAS (3-4 linhas). Faça apenas UMA pergunta por vez para não sobrecarregar.

## REGRAS DE CONVERSA (Fluxo MarIA v3)
1. **Não Interrogue**: Nunca faça perguntas em sequência sem entregar valor. Antes de perguntar orçamento, dê uma dica sobre valorização ou lazer.
2. **Entrega de Valor**: Se o usuário demonstrar interesse em investimento, fale sobre a taxa de valorização em Bombinhas. Se for temporada, fale sobre a transparência da água.
3. **Lead Gate**: Não peça contato na primeira mensagem. Deixe a conversa fluir. Só [SHOW_RESULTS] ou peça contato após entender o objetivo.
4. **Aluguel Anual**: ESTREITAMENTE PROIBIDO. Se pedirem, diga: "No VIV Bombinhas focamos em Temporada e Investimento, que trazem melhor retorno. Para moradia anual, sugiro imobiliárias locais tradicionais. Mas você já pensou em comprar para morar e ter patrimônio aqui?"

## SEUS PILARES
1. **Temporada**: Foco em lazer e experiência.
2. **Compra**: Foco em qualidade de vida e patrimônio.
3. **Investimento**: Foco em rentabilidade e valorização m2.
4. **Captação**: Para quem quer anunciar e vender com a gente.

## QUALIFICAÇÃO (Sutil)
Tente identificar ao longo da conversa:
- Objetivo principal.
- Prazo (quer para este verão? para o futuro?).
- Orçamento (uma ideia de faixa).

## DANIEL / HANDOVER
Daniel é o especialista. Se o lead for qualificado (Investidor/Comprador sério), diga: "Vou pedir para o Daniel, nosso especialista em Bombinhas, separar algumas oportunidades off-market para você."`;

const EXTRACTION_PROMPT = `Você é um analista de dados especializado em CRM imobiliário.
Analise a conversa e extraia os dados no formato JSON.

Campos:
- finalidade: "compra", "investimento", "temporada", "anunciante"
- objetivo: "morar", "investir", "renda_temporada", "patrimonio", "anunciar"
- prazo_compra: "imediato", "3_meses", "6_meses", "12_meses", "futuro"
- orcamento_max: (número limpo)
- bairro_preferencia: (texto)
- nome: (se citado)
- telefone: (se citado)
- forma_pagamento: "avista", "financiado", "permuta", "parcelamento_direto"
- resumo_ia: (Resumo executivo de 1 frase para o Daniel entender o lead em 2 segundos)

Retorne APENAS o JSON.`;

async function calculateScore(data: any): Promise<number> {
  let score = 0;
  
  // 1. Dados de Contato (Essencial)
  if (data.nome && data.telefone) score += 30;
  else if (data.telefone) score += 20;

  // 2. Objetivo de alto valor
  if (data.finalidade === 'investimento') score += 20;
  if (data.finalidade === 'compra') score += 15;
  if (data.finalidade === 'anunciante') score += 20;

  // 3. Prazo (Urgência)
  if (data.prazo_compra === 'imediato') score += 20;
  if (data.prazo_compra === '3_meses') score += 15;
  if (data.prazo_compra === '6_meses') score += 5;

  // 4. Orçamento (Poder de compra)
  if (data.orcamento_max > 1000000) score += 20;
  else if (data.orcamento_max > 500000) score += 10;

  // 5. Forma de pagamento
  if (data.forma_pagamento === 'avista') score += 10;

  return Math.min(score, 100);
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Premium";
  if (score >= 60) return "Quente";
  if (score >= 30) return "Morno";
  return "Frio";
}

async function upsertLeadBySession(supabase: any, sessionId: string, patch: Record<string, unknown>): Promise<string | null> {
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
  return inserted?.id ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  try {
    const body = await req.json();
    console.log("[maria-search] Request body:", JSON.stringify(body));
    const { messages, session_id, action, nome, telefone } = body;
    const sessionId = session_id || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "submit_lead") {
      await upsertLeadBySession(supabase, sessionId, { nome, telefone, status: "novo" });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("[maria-search] Calling AI Gateway (Main)...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.map((m: any) => ({ role: m.role, content: m.content }))],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[maria-search] AI Gateway error (Main):", aiResponse.status, errorText);
      throw new Error(`AI Gateway error (Main): ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("[maria-search] AI Response (Main) received");
    const assistantMessage = aiData.choices?.[0]?.message?.content || "";

    try {
      console.log("[maria-search] Calling AI Gateway (Extraction)...");
      const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash",
          messages: [
            { role: "system", content: EXTRACTION_PROMPT },
            { role: "user", content: messages.concat({ role: "assistant", content: assistantMessage }).map((m: any) => `${m.role}: ${m.content}`).join("\n") }
          ],
          temperature: 0,
        }),
      });

      if (!extractionResponse.ok) {
        const errorText = await extractionResponse.text();
        console.error("[maria-search] AI Gateway error (Extraction):", extractionResponse.status, errorText);
        throw new Error(`AI Gateway error (Extraction): ${extractionResponse.status}`);
      }

      const extractionData = await extractionResponse.json();
      console.log("[maria-search] Extraction Response received");
      const rawJson = extractionData.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim();
      
      if (!rawJson) {
        console.warn("[maria-search] Empty extraction content");
        throw new Error("Empty extraction content");
      }

      const extracted = JSON.parse(rawJson);
      console.log("[maria-search] Extracted data:", JSON.stringify(extracted));
      
      if (extracted) {
        const score = await calculateScore(extracted);
        const leadPatch: any = {
          lead_score: getScoreLabel(score),
          objetivo: extracted.objetivo,
          prazo_compra: extracted.prazo_compra,
          orcamento_max: extracted.orcamento_max,
          resumo_ia: extracted.resumo_ia,
          interesse: extracted.finalidade,
          bairro_interesse: extracted.bairro_preferencia
        };
        if (extracted.nome) leadPatch.nome = extracted.nome;
        if (extracted.telefone) leadPatch.telefone = extracted.telefone;
        
        await upsertLeadBySession(supabase, sessionId, leadPatch);
      }
    } catch (e) {
      console.error("Extraction/Scoring error:", e);
    }

    return new Response(JSON.stringify({ reply: assistantMessage }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});