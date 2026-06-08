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
  console.log(`[MarIA Persistence] Upserting lead for session ${sessionId}:`, JSON.stringify(patch));
  try {
    const { data: existing, error: findError } = await supabase.from("leads_maria").select("id, lead_score").eq("session_id", sessionId).maybeSingle();
    if (findError) {
      console.error(`[MarIA Persistence] Error finding lead:`, findError);
    }
    
    if (existing?.id) {
      // Don't allow downgrade of score for strategic leads
      if (existing.lead_score === "Premium" && patch.lead_score && patch.lead_score !== "Premium") {
        delete patch.lead_score;
      }
      if (existing.lead_score === "Quente" && patch.lead_score === "frio") {
        delete patch.lead_score;
      }

      const { error: updateError } = await supabase.from("leads_maria").update({ ...patch, last_contact_at: new Date().toISOString() }).eq("id", existing.id);
      if (updateError) {
        console.error(`[MarIA Persistence] Error updating lead ${existing.id}:`, updateError);
        throw updateError;
      }
      return existing.id;
    }
    
    const { data: inserted, error: insertError } = await supabase.from("leads_maria").insert({
      session_id: sessionId,
      origem: "maria_chat",
      status: (patch.nome && patch.telefone) ? "novo" : "anonimo",
      last_contact_at: new Date().toISOString(),
      ...patch,
    }).select("id").single();
    
    if (insertError) {
      console.error(`[MarIA Persistence] Error inserting lead:`, insertError);
      throw insertError;
    }
    return inserted?.id || null;
  } catch (err) {
    console.error(`[MarIA Persistence] Critical error in upsertLeadBySession:`, err);
    return null;
  }
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

    if (filters.preco_min) {
      if (filters.finalidade === "temporada") q = q.gte("preco_temporada_diaria", filters.preco_min);
      else q = q.gte("preco", filters.preco_min);
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

function isSearchAllowed(filters: any, intent: string, lastMessage: string, extractedData: any) {
  if (!filters || !filters.finalidade) return false;
  
  const finalidade = filters.finalidade;
  const hasConcreteFilter = filters.bairro || filters.preco_max || filters.tipo;
  
  console.log(`[MarIA Search Logic] Checking allowed: Finalidade=${finalidade}, Intent=${intent}, Concrete=${hasConcreteFilter}`);
  
  // Regra específica para Investimento
  if (finalidade === "investimento" || (finalidade === "compra" && extractedData?.objetivo === "investir")) {
    const hasObjective = extractedData?.objetivo === "renda" || 
                         extractedData?.objetivo === "patrimonio" || 
                         extractedData?.objetivo === "investir" || 
                         extractedData?.resumo_ia?.toLowerCase().includes("renda") || 
                         extractedData?.resumo_ia?.toLowerCase().includes("investir") ||
                         lastMessage.toLowerCase().includes("renda") ||
                         lastMessage.toLowerCase().includes("investir");
    
    console.log(`[MarIA Search Logic] Investment check: hasObjective=${hasObjective}, hasConcrete=${hasConcreteFilter}`);
    return hasObjective && hasConcreteFilter;
  }
  
  // Regra específica para Temporada
  if (finalidade === "temporada") {
    const hasConstraint = hasConcreteFilter; // Bairro ou Preço
    const hasCapacityOrPeriod = extractedData?.pessoas || extractedData?.periodo;
    console.log(`[MarIA Search Logic] Temporada check: hasConstraint=${hasConstraint}, hasCapacityOrPeriod=${!!hasCapacityOrPeriod}`);
    return hasConstraint && !!hasCapacityOrPeriod;
  }
  
  // Compra Comum
  if (finalidade === "compra") {
    return hasConcreteFilter;
  }
  
  return false;
}

// ============================================================

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, session_id, action, nome, telefone, lead_captured, extra_data } = await req.json();
    const sessionId = session_id || "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (action === "submit_lead") {
      const leadData = { 
        nome, 
        telefone, 
        status: "novo",
        chat_history: messages, // Persist full history snapshot
        ...extra_data 
      };

      // Force high priority for strategic leads
      if (extra_data?.quer_analise || extra_data?.proximo_passo_sugerido === "analise_daniel") {
        const isPremium = (Number(extra_data?.capital_disponivel || 0) >= 1000000) || 
                          (Number(extra_data?.orcamento_max || 0) >= 1000000) || 
                          (extra_data?.bens_para_permuta && extra_data?.bens_para_permuta.length > 5);
        
        leadData.lead_score = isPremium ? "Premium" : "Quente";
        console.log(`[MarIA Strategic] Lead scored as ${leadData.lead_score} based on extra_data`);
      }

      const leadId = await upsertLeadBySession(supabase, sessionId, leadData);
      return new Response(JSON.stringify({ success: true, lead_id: leadId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[MarIA Debug] Nova mensagem recebida. Session: ${sessionId}. Messages: ${messages.length}`);
    const lastMessage = messages[messages.length - 1]?.content || "";
    console.log(`[MarIA Debug] Última mensagem: "${lastMessage}"`);

    // 1. ROUTER
    const routerReply = await callAI(lovableApiKey, "google/gemini-3-flash-preview", PROMPTS.ROUTER, messages.slice(-5), 0);
    const routerData = safeParseJSON(routerReply);
    const intent = routerData?.intent || "busca";

    // 2. MAIN CHAT
    let mainModel = "google/gemini-3-flash-preview";
    let mainPrompt = PROMPTS.BUSCA_CHAT;
    let fallbackUsed = false;

    if (intent === "consultivo") {
      mainModel = "google/gemini-2.5-pro"; // Modelo premium estável para consultivo
      mainPrompt = PROMPTS.CONSULTIVO_CHAT;
    } else if (intent === "proprietario") {
      mainPrompt = PROMPTS.PROPRIETARIO_CHAT;
    } else if (intent === "comum") {
      mainPrompt = PROMPTS.COMUM_CHAT;
    }

    let rawReply = "";
    try {
      console.log(`[MarIA Debug] Chamando IA (${mainModel}) para intent: ${intent}`);
      rawReply = await callAI(lovableApiKey, mainModel, mainPrompt, messages);
      console.log(`[MarIA Debug] Resposta bruta da IA: "${rawReply}"`);
    } catch (err) {
      console.error(`Error calling ${mainModel}:`, err);
      // Fallback: OpenAI Premium -> Gemini Flash
      if (mainModel !== "google/gemini-3-flash-preview") {
        fallbackUsed = true;
        console.log(`[MarIA Debug] Falha no modelo premium. Tentando fallback para Gemini Flash.`);
        rawReply = await callAI(lovableApiKey, "google/gemini-3-flash-preview", mainPrompt, messages);
        console.log(`[MarIA Debug] Resposta do fallback: "${rawReply}"`);
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
    const showStrategicForm = rawReply.includes("[STRATEGIC_FORM]");
    let { filters, cleaned } = parseFiltersBlock(rawReply.replace("[STRATEGIC_FORM]", ""));
    
    // Immediate extraction for context
    let extractedData = null;
    try {
      const extReply = await callAI(lovableApiKey, "google/gemini-3-flash-preview", PROMPTS.EXTRACTION, messages.concat({ role: "assistant", content: rawReply }), 0);
      extractedData = safeParseJSON(extReply);
    } catch (e) { console.error("Extraction error:", e); }

    // Fallback: IA esqueceu [FILTERS] mas o extrator pegou filtros objetivos
    const searchPatterns = /ver im[óo]veis|op[çc][õo]es|cards|mostrar|buscar|procurar|quero ver|me mostre/i;
    const isExplicitSearchRequest = searchPatterns.test(lastMessage) || 
                                   lastMessage.toLowerCase().includes("investir") ||
                                   lastMessage.toLowerCase().includes("temporada");

    if (!filters && extractedData && (intent === "busca" || intent === "consultivo") && isExplicitSearchRequest) {
      const candidateFilters = {
        finalidade: extractedData.finalidade || "compra",
        bairro: extractedData.bairro_preferencia,
        tipo: extractedData.tipo_imovel,
        preco_max: extractedData.orcamento_max
      };
      
      if (isSearchAllowed(candidateFilters, intent, lastMessage, extractedData)) {
        filters = candidateFilters;
      }
    }

    let showResults = false, noResultsGate = false, gateActive = false;
    let allProperties: any[] = [], visibleProperties: any[] = [];

    // Final check for search triggering
    if (filters && isSearchAllowed(filters, intent, lastMessage, extractedData) && filters.finalidade !== "anunciante") {
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
        console.log(`[MarIA Search] No exact results for ${JSON.stringify(filters)}. Trying broader search.`);
        // Tenta busca sem o filtro de preço para ver se há "vizinhos"
        const broaderFilters = { ...filters, preco_min: undefined, preco_max: undefined };
        const suggestions = await searchProperties(supabase, broaderFilters);
        
        if (suggestions.length > 0) {
          allProperties = suggestions;
          showResults = true;
          visibleProperties = allProperties.slice(0, 3);
          
          // Ajusta a resposta para explicar que são sugestões
          const bairroName = filters.bairro || "Bombinhas";
          cleaned = `Não encontrei imóveis exatamente na faixa de valor solicitada em ${bairroName}, mas separei estas opções na região que podem fazer sentido para sua estratégia:`;
          console.log(`[MarIA Search] Broadened results found. Adjusted reply.`);
        } else {
          noResultsGate = !lead_captured;
          // Se realmente não houver nada, ajusta a resposta para ser consultiva e oferecer caminhos
          cleaned = `No momento não encontrei imóveis disponíveis em ${filters.bairro || 'Mariscal'} com essas características. Para avançarmos, você prefere ampliar a busca para praias vizinhas (como Centro ou Bombas) ou prefere que eu te apresente uma comparação de rentabilidade entre as regiões?`;
          console.log(`[MarIA Search] No results even after broadening.`);
        }
      }
    }


    // 4. PERSISTENCE (Background)
    if (extractedData) {
      (async () => {
        try {
          await upsertLeadBySession(supabase, sessionId, {
            lead_score: extractedData.lead_score,
            objetive: extractedData.objetivo,
            prazo_compra: extractedData.prazo_compra,
            orcamento_max: extractedData.orcamento_max,
            capital_disponivel: extractedData.capital_disponivel,
            bens_para_permuta: extractedData.bens_para_permuta,
            resumo_ia: extractedData.resumo_ia,
            interesse: extractedData.finalidade,
            bairro_interesse: extractedData.bairro_preferencia,
            tipo_imovel: extractedData.tipo_imovel,
            nome: extractedData.nome || undefined,
            telefone: extractedData.telefone || undefined,
            proximo_passo_sugerido: extractedData.quer_falar_daniel ? "analise_daniel" : undefined,
            objetivo_investimento: extractedData.objetivo,
            região_interesse: extractedData.bairro_preferencia,
            chat_history: messages // Always keep history updated in background
          });
        } catch (e) { console.error("Persistence error:", e); }
      })();
    }

    // 5. DETERMINISTIC REPLY FALLBACK (Para casos de resposta vazia ou erro)
    let finalReply = cleaned || rawReply;
    console.log(`[MarIA Debug] finalReply antes do fallback determinístico: "${finalReply}"`);
    console.log(`[MarIA Debug] showResults: ${showResults}, cleaned length: ${cleaned?.length || 0}`);
    
    if (showResults && (!finalReply || finalReply.trim().length < 5)) {
      finalReply = "Encontrei opções compatíveis com seu perfil em " + (filters?.bairro || 'Bombinhas') + ". Confira abaixo:";
      console.log(`[MarIA Debug] Fallback determinístico aplicado: "${finalReply}"`);
    }

    if (!finalReply || finalReply.trim().length === 0) {
      console.log(`[MarIA Debug] CRÍTICO: Resposta final vazia. Aplicando fallback de emergência.`);
      finalReply = "Entendi. Estou buscando as melhores opções para você.";
    }

    return new Response(JSON.stringify({
      reply: finalReply,
      show_results: showResults,
      properties: visibleProperties,
      all_properties: allProperties,
      gate_active: gateActive,
      no_results_gate: noResultsGate,
      show_strategic_form: showStrategicForm,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ reply: "Desculpe, tive um problema agora. 🙏", error: err.message }), { status: 500, headers: corsHeaders });
  }
});