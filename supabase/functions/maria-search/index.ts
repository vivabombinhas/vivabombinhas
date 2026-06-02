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
    let q = supabase.from("imoveis").select("*").eq("status", "ativo").or("oculta_para_maria.is.null,oculta_para_maria.eq.false").limit(40);
    
    if (filters.finalidade) {
      const dbFinalidade = filters.finalidade === "investimento" ? "compra" : filters.finalidade;
      q = q.eq("finalidade", dbFinalidade);
    }
    
    // Filtro de Tipo (Suporta múltiplos tipos se vier string separada por vírgula ou 'e'/'ou')
    if (filters.tipo && typeof filters.tipo === "string") {
      const tipos = filters.tipo.toLowerCase().split(/[\s,e|/]+/).filter(t => t.length > 3);
      if (tipos.length > 0) {
        const orConditions = tipos.map(t => `tipo.ilike.%${t}%`).join(",");
        q = q.or(orConditions);
      }
    }
    
    // Filtro de Bairro (Suporta múltiplos bairros se vier string separada por vírgula ou 'e'/'ou')
    if (filters.bairro && typeof filters.bairro === "string") {
      const bairros = filters.bairro.toLowerCase().split(/[\s,e|/]+/).filter(b => b.length > 3 && b !== "bombinhas");
      if (bairros.length > 0) {
        const orConditions = bairros.map(b => `bairro.ilike.%${b}%`).join(",");
        q = q.or(orConditions);
      }
    }

    if (filters.preco_max) {
      if (filters.finalidade === "temporada") q = q.lte("preco_temporada_diaria", filters.preco_max);
      else q = q.lte("preco", filters.preco_max);
    }
    
    const { data } = await q;
    return data || [];
  } catch (err) { 
    console.error("Search error:", err);
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
    const routerReply = await callAI(lovableApiKey, "google/gemini-3-flash-preview", PROMPTS.ROUTER, messages.slice(-5), 0);
    const routerData = safeParseJSON(routerReply);
    const intent = routerData?.intent || "busca";

    // 2. MAIN CHAT
    let mainModel = "google/gemini-3-flash-preview";
    let mainPrompt = PROMPTS.BUSCA_CHAT;
    let fallbackUsed = false;

    if (intent === "consultivo") {
      mainModel = "openai/gpt-5"; // Modelo premium solicitado para estratégia e investimento
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
      console.error(`Error calling ${mainModel}:`, err);
      // Fallback: OpenAI Premium -> Gemini Flash
      if (mainModel !== "google/gemini-3-flash-preview") {
        fallbackUsed = true;
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
    let { filters, cleaned } = parseFiltersBlock(rawReply);
    
    // Immediate extraction for context
    let extractedData = null;
    try {
      const extReply = await callAI(lovableApiKey, "google/gemini-3-flash-preview", PROMPTS.EXTRACTION, messages.concat({ role: "assistant", content: rawReply }), 0);
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