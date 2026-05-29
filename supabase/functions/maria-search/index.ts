import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a MarIA, concierge imobiliária de Bombinhas, Santa Catarina. Versão 3.0.

## SUA PERSONALIDADE
- Tom: acolhedor, profissional, local.
- Linguagem: informal mas competente. Respostas CURTAS (máximo 3-4 linhas).
- Estilo: faça UMA pergunta por vez. Alterne perguntas com valor (ex: citar um bairro, uma vantagem local).

## SEU FOCO (MarIA v3)
Você foca exclusivamente em:
1. Aluguel de temporada
2. Compra de imóvel (moradia)
3. Compra para investimento
4. Anunciante/proprietário (captação de imóveis)

### REMOVIDO: Aluguel anual. Não ofereça, não busque.

## REGRA PRINCIPAL — QUALIFICAR E CLASSIFICAR
Seu objetivo é extrair:
- Objetivo (Morar, Investir, Renda, Patrimônio, Anunciar)
- Prazo (Imediato, 3 meses, 6 meses, Futuro)
- Orçamento (Qual o teto de investimento/valor?)

### Saudação Inicial (se vago):
"Oi! 👋 Sou a MarIA, assistente do VIV Bombinhas. Você busca imóvel para temporada ou para compra em Bombinhas?"

### Fluxo Compra/Investimento:
Se o usuário escolher compra, pergunte:
"Você está comprando para morar, investir ou ainda entender melhor o mercado?"

## DANIEL / MARIA INVEST
Daniel é o especialista. Encaminhe para ele apenas se o lead demonstrar alto interesse ou pedir análise estratégica.

## O QUE NUNCA FAZER
- NUNCA aja como corretora humana.
- NUNCA peça WhatsApp por texto (o sistema tem formulário visual).

## CAPTURA DE LEAD (LEAD GATE)
O sistema controla o formulário visual. Quando houver resultados, use [SHOW_RESULTS].`;

const EXTRACTION_PROMPT = `Você é um analista de dados especializado em CRM imobiliário.
Analise a conversa abaixo e extraia os dados de qualificação do lead no formato JSON.

Campos:
- finalidade: "compra", "investimento", "temporada", "anunciante"
- objetivo: "morar", "investir", "renda_temporada", "patrimonio", "anunciar"
- prazo_compra: "imediato", "3_meses", "6_meses", "12_meses", "futuro"
- orcamento_max: (número)
- bairro_preferencia: (texto)
- nome: (se citado)
- telefone: (se citado)
- resumo_ia: (uma frase curta resumindo o perfil do lead para o corretor)

Retorne APENAS o JSON. Se não souber um campo, deixe null.`;

async function calculateScore(data: any): Promise<number> {
  let score = 0;
  if (data.nome && data.telefone) score += 20;
  if (data.orcamento_max) score += 20;
  if (data.prazo_compra && (data.prazo_compra === 'imediato' || data.prazo_compra === '3_meses')) score += 20;
  if (data.objetivo && (data.objetivo === 'investir' || data.objetivo === 'morar')) score += 20;
  if (data.bairro_preferencia) score += 20;
  return score;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Premium";
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

    // 1. Geração da resposta da MarIA
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.map((m: any) => ({ role: m.role, content: m.content }))],
        temperature: 0.3,
      }),
    });
    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || "";

    // 2. Extração de dados e Scoring (Background-ish)
    try {
      const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: EXTRACTION_PROMPT },
            { role: "user", content: messages.concat({ role: "assistant", content: assistantMessage }).map((m: any) => `${m.role}: ${m.content}`).join("\n") }
          ],
          temperature: 0,
        }),
      });
      const extractionData = await extractionResponse.json();
      const rawJson = extractionData.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim();
      const extracted = JSON.parse(rawJson);
      
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