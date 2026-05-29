import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SearchFilters {
  finalidade?: string;
  tipo?: string;
  tipo_included?: string[];
  tipo_excluded?: string[];
  bairro?: string;
  preco_min?: number;
  preco_max?: number;
  quartos?: number;
  banheiros?: number;
  vagas_garagem?: number;
  capacidade_pessoas?: number;
  piscina?: boolean;
  vista_mar?: boolean;
  frente_mar?: boolean;
  mobiliado?: boolean;
  aceita_pet?: boolean;
  churrasqueira?: boolean;
  ar_condicionado?: boolean;
  wifi?: boolean;
  objetivo?: string;
  prazo_compra?: string;
  perfil_investidor?: boolean;
}

const SYSTEM_PROMPT = `Você é a MarIA, concierge imobiliária de Bombinhas, Santa Catarina. Versão 3.0.

## SUA PERSONALIDADE
- Tom: acolhedor, profissional, local.
- Linguagem: informal mas competente. Respostas CURTAS (máximo 3-4 linhas).
- Estilo: faça UMA pergunta por vez.

## SEU FOCO (MarIA v3)
Você foca exclusivamente em:
1. Aluguel de temporada
2. Compra de imóvel (moradia)
3. Compra para investimento
4. Anunciante/proprietário (captação de imóveis)

### REMOVIDO: Aluguel anual. Não ofereça, não busque.

## REGRA PRINCIPAL — QUALIFICAR E CLASSIFICAR
Você deve identificar a intenção, o valor comercial do lead e o próximo melhor passo.

### Saudação Inicial (se vago):
"Oi! 👋 Sou a MarIA, assistente do VIV Bombinhas. Você busca imóvel para temporada ou para compra em Bombinhas?"

### Fluxo Compra/Investimento:
Se o usuário escolher compra, pergunte:
"Você está comprando para morar, investir ou ainda entender melhor o mercado?"
Essa pergunta é ESSENCIAL para separar o comprador comum do investidor.

### Lógica de Lead Score (Interna):
- Lead Premium: Compra/Investimento, orçamento definido, prazo claro.
- Lead Quente: Intenção clara, bairro e orçamento definidos.
- Lead Morno: Deixou contato e filtros básicos.
- Lead Frio: Apenas pesquisa genérica.

## DANIEL / MARIA INVEST
Daniel deve receber apenas leads Premium ou Quentes que pedem análise estratégica:
"Pelo seu perfil, talvez faça sentido uma análise mais estratégica. Posso encaminhar seu interesse para o Daniel avaliar com você?"

## O QUE NUNCA FAZER
- NUNCA prometa valorização ou retorno financeiro.
- NUNCA aja como corretora humana (você é assistente).
- NUNCA fale de turismo geral, restaurantes ou passeios.
- NUNCA invente imóveis ou dados.
- NUNCA peça WhatsApp por texto (o sistema tem formulário visual).

## CAPTURA DE LEAD (LEAD GATE)
O sistema controla o formulário visual. Quando houver resultados, use [SHOW_RESULTS].`;

const FILTER_EXTRACTION_PROMPT = `Analise a CONVERSA COMPLETA e extraia os filtros de busca acumulados e dados de qualificação.

Campos v3 para extrair:
- intent: "search", "qualifying" ou "conversation"
- finalidade: "compra", "investimento", "temporada" ou "anunciante"
- objetivo: "morar", "investir", "renda_temporada", "patrimonio", "anunciar"
- prazo_compra: "imediato", "3_meses", "6_meses", "12_meses", "futuro"
- orcamento_max: valor numérico
- perfil_investidor: true/false
- filtros padrão: tipo, bairro, preco_min, preco_max, quartos, capacidade_pessoas, etc.

Retorne APENAS o JSON válido.`;

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const original = String(raw).trim();
  let digits = original.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length < 10 || digits.length > 11) return null;
  return "55" + digits;
}

function extractPhoneFromText(text: string): { normalized: string | null; hasShortPhone: boolean } {
  if (!text) return { normalized: null, hasShortPhone: false };
  const patterns = [/\(?\s*\d{2,3}\s*\)?\s*9?\s*\d{4}[-\s.]?\d{4}/g, /\d{10,13}/g];
  for (const re of patterns) {
    const matches = text.match(re) || [];
    for (const m of matches) {
      const normalized = normalizePhone(m);
      if (normalized) return { normalized, hasShortPhone: false };
    }
  }
  const allDigits = text.replace(/\D/g, "");
  const normalized = normalizePhone(allDigits);
  if (normalized) return { normalized, hasShortPhone: false };
  return { normalized: null, hasShortPhone: allDigits.length >= 8 && allDigits.length <= 9 };
}

function extractNameFromText(text: string): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(/\+?\d[\d\s().-]{6,}/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\b(meu nome é|me chamo|eu sou|aqui é|nome|whats(?:app)?|telefone|celular|n[uú]mero|sou o|sou a|me\s+llamo|mi\s+nombre)\b/gi, " ")
    .replace(/[,:;\-_/\\|()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 2 || cleaned.length > 80) return null;
  if (!/[A-Za-zÀ-ÿ]/.test(cleaned)) return null;
  if (/^(sim|quero|ok|beleza|pode|manda|avisar|salvar|topo|claro|tá|ta|si|s[ií])$/i.test(cleaned)) return null;
  return cleaned.split(/\s+/).slice(0, 4).join(" ");
}

async function upsertLeadBySession(supabase: any, sessionId: string, patch: Record<string, unknown>): Promise<string | null> {
  if (!sessionId) return null;
  try {
    const { data: existing } = await supabase.from("leads_maria").select("id").eq("session_id", sessionId).maybeSingle();
    if (existing?.id) {
      const { error } = await supabase.from("leads_maria").update({ ...patch, last_contact_at: new Date().toISOString() }).eq("id", existing.id);
      if (error) console.error("Lead update error:", error);
      return existing.id as string;
    }
    const { data: inserted, error } = await supabase.from("leads_maria").insert({
      session_id: sessionId,
      origem: "maria_chat",
      status: patch.nome && patch.telefone ? "novo" : "anonimo",
      last_contact_at: new Date().toISOString(),
      ...patch,
    }).select("id").single();
    if (error) { console.error("Lead insert error:", error); return null; }
    return (inserted?.id as string) ?? null;
  } catch (e) {
    console.error("upsertLeadBySession failed:", e);
    return null;
  }
}

async function saveLastConversationTurn(supabase: any, leadId: string, userMsg: string, assistantMsg: string) {
  try {
    const rows = [{ lead_id: leadId, role: "user", content: userMsg }, { lead_id: leadId, role: "assistant", content: assistantMsg }].filter(r => r.content);
    if (rows.length) {
      const { error } = await supabase.from("lead_conversations").insert(rows);
      if (error) console.error("Conv insert error:", error);
    }
  } catch (e) { console.error("saveLastConversationTurn failed:", e); }
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
      if (!sessionId || !nome || !telefone) return new Response(JSON.stringify({ success: false }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const leadId = await upsertLeadBySession(supabase, sessionId, { nome, telefone, status: "novo" });
      return new Response(JSON.stringify({ success: !!leadId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userMessage = messages?.[messages.length - 1]?.content || "";
    const { normalized: detectedPhone } = extractPhoneFromText(userMessage);
    const detectedName = extractNameFromText(userMessage);
    if (detectedPhone && detectedName) await upsertLeadBySession(supabase, sessionId, { nome: detectedName, telefone: detectedPhone, status: "novo" });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.3,
      }),
    });

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || "Olá! Como posso te ajudar?";
    
    return new Response(JSON.stringify({ reply: assistantMessage }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
