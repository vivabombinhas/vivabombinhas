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
async function upsertLeadBySession(
  supabase: any,
  sessionId: string,
  patch: Record<string, unknown>,
  triggerMessage?: string,
  source: string = "maria_chat",
) {
  if (!sessionId) return null;
  console.log(`[MarIA Persistence] Upserting lead for session ${sessionId}:`, JSON.stringify(patch));
  try {
    const { data: existing, error: findError } = await supabase.from("leads_maria").select("id, lead_score, nome, telefone, status").eq("session_id", sessionId).maybeSingle();
    if (findError) {
      console.error(`[MarIA Persistence] Error finding lead:`, findError);
    }

    const updateData: any = { ...patch, last_contact_at: new Date().toISOString() };

    if (existing?.id) {
      // Logic to upgrade status to 'novo' if name and phone are now present
      if (existing.status === "anonimo" && (patch.nome || existing.nome) && (patch.telefone || existing.telefone)) {
        updateData.status = "novo";
      }

      // Don't allow downgrade of score for strategic leads
      const currentScore = (existing.lead_score || "").toLowerCase();
      const newScore = (patch.lead_score as string || "").toLowerCase();

      if (currentScore === "premium" && newScore !== "premium") {
        delete updateData.lead_score;
      }
      if (currentScore === "quente" && newScore === "frio") {
        delete updateData.lead_score;
      }

      const { error: updateError } = await supabase.from("leads_maria").update(updateData).eq("id", existing.id);
      if (updateError) {
        console.error(`[MarIA Persistence] Error updating lead ${existing.id}:`, updateError);
        throw updateError;
      }

      // AUDIT: registra mudanças de status / lead_score
      const statusChanged = updateData.status && updateData.status !== existing.status;
      const scoreChanged = updateData.lead_score && (updateData.lead_score as string).toLowerCase() !== currentScore;
      if (statusChanged || scoreChanged) {
        try {
          await supabase.from("lead_status_audit").insert({
            lead_id: existing.id,
            session_id: sessionId,
            old_status: existing.status ?? null,
            new_status: statusChanged ? updateData.status : existing.status,
            old_score: existing.lead_score ?? null,
            new_score: scoreChanged ? updateData.lead_score : existing.lead_score,
            trigger_message: triggerMessage?.slice(0, 2000) ?? null,
            source,
          });
          console.log(`[MarIA Audit] Logged change for ${existing.id}: status ${existing.status}→${updateData.status}, score ${existing.lead_score}→${updateData.lead_score}`);
        } catch (auditErr) {
          console.error(`[MarIA Audit] Failed to log:`, auditErr);
        }
      }
      return existing.id;
    }

    const initialStatus = (patch.nome && patch.telefone) ? "novo" : "anonimo";
    const { data: inserted, error: insertError } = await supabase.from("leads_maria").insert({
      session_id: sessionId,
      origem: "maria_chat",
      status: initialStatus,
      last_contact_at: new Date().toISOString(),
      ...patch,
    }).select("id").single();

    if (insertError) {
      console.error(`[MarIA Persistence] Error inserting lead:`, insertError);
      throw insertError;
    }

    // AUDIT: registra criação inicial
    if (inserted?.id) {
      try {
        await supabase.from("lead_status_audit").insert({
          lead_id: inserted.id,
          session_id: sessionId,
          old_status: null,
          new_status: (patch.status as string) || initialStatus,
          old_score: null,
          new_score: (patch.lead_score as string) ?? null,
          trigger_message: triggerMessage?.slice(0, 2000) ?? null,
          source,
        });
      } catch (auditErr) {
        console.error(`[MarIA Audit] Failed to log creation:`, auditErr);
      }
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
    
    if (filters?.finalidade) {
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

function checkSearchRequirements(filters: any, intent: string, lastMessage: string, extractedData: any) {
  const missing: string[] = [];
  if (!filters || !filters.finalidade) {
    return { allowed: false, missing: ["finalidade"] };
  }
  
  const finalidade = filters.finalidade;
  const hasBairro = !!filters.bairro;
  const hasTipo = !!filters.tipo;
  const hasOrcamento = !!(filters.preco_max || filters.preco_min ||
    extractedData?.orcamento_max || extractedData?.orcamento_min);

  console.log(`[MarIA Search Logic] Checking requirements: Finalidade=${finalidade}, Intent=${intent}`);
  
  // Regra específica para Investimento
  if (finalidade === "investimento" || (finalidade === "compra" && extractedData?.objetivo === "investir")) {
    const hasObjective = extractedData?.objetivo === "renda" || 
                         extractedData?.objetivo === "patrimonio" || 
                         extractedData?.objetivo === "investir" || 
                         extractedData?.resumo_ia?.toLowerCase().includes("renda") || 
                         extractedData?.resumo_ia?.toLowerCase().includes("investir") ||
                         lastMessage.toLowerCase().includes("renda") ||
                         lastMessage.toLowerCase().includes("investir");
    
    if (!hasObjective) missing.push("objetivo");
    if (!hasBairro && !filters.preco_max && !hasTipo) missing.push("filtros_concretos");
    
    return { allowed: missing.length === 0, missing };
  }
  
  // Regra específica para Temporada
  if (finalidade === "temporada") {
    const hasConstraint = hasBairro || filters.preco_max || hasTipo;
    const hasCapacityOrPeriod = extractedData?.pessoas || extractedData?.periodo;
    
    if (!hasConstraint) missing.push("filtros_concretos");
    if (!hasCapacityOrPeriod) missing.push("capacidade_ou_periodo");
    
    return { allowed: missing.length === 0, missing };
  }
  
  // Compra Comum: exige bairro + tipo + faixa de orçamento
  if (finalidade === "compra") {
    if (!hasBairro) missing.push("bairro");
    if (!hasTipo) missing.push("tipo");
    if (!hasOrcamento) missing.push("orcamento");
    
    return { allowed: missing.length === 0, missing };
  }
  
  return { allowed: false, missing: ["desconhecido"] };
}

// Deprecated in favor of checkSearchRequirements, but keeping a wrapper for legacy calls if any
function isSearchAllowed(filters: any, intent: string, lastMessage: string, extractedData: any) {
  return checkSearchRequirements(filters, intent, lastMessage, extractedData).allowed;
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
      // Remove campos que não existem na tabela leads_maria
      const { isStrategicMode, ...safeExtraData } = extra_data || {};
      const leadData: any = { 
        nome, 
        telefone, 
        status: "novo",
        chat_history: messages.length > 0 ? messages : undefined, // Persist full history snapshot
        ...safeExtraData 
      };

      // Force high priority for strategic leads
      if (extra_data?.quer_analise || extra_data?.proximo_passo_sugerido === "analise_daniel") {
        const isPremium = (Number(extra_data?.capital_disponivel || 0) >= 1000000) || 
                          (Number(extra_data?.orcamento_max || 0) >= 1000000) || 
                          (extra_data?.bens_para_permuta && extra_data?.bens_para_permuta.length > 5);
        
        leadData.lead_score = isPremium ? "Premium" : "Quente";
        console.log(`[MarIA Strategic] Lead scored as ${leadData.lead_score} based on extra_data`);
      }

      const triggerMsg = `[submit_lead] ${nome ?? ""} / ${telefone ?? ""}`;
      const leadId = await upsertLeadBySession(supabase, sessionId, leadData, triggerMsg, "lead_form");
      return new Response(JSON.stringify({ success: true, lead_id: leadId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[MarIA Debug] Nova mensagem recebida. Session: ${sessionId}. Messages: ${messages.length}`);
    const lastMessage = messages[messages.length - 1]?.content || "";
    console.log(`[MarIA Debug] Última mensagem: "${lastMessage}"`);

    // 1. ROUTER
    const routerReply = await callAI(lovableApiKey, "google/gemini-3-flash-preview", PROMPTS.ROUTER, messages.slice(-5), 0);
    const routerData = safeParseJSON(routerReply);
    let intent = routerData?.intent || "busca";

    // Regra de Posicionamento para Investimento: Forçar consultivo se termos de investimento forem detectados
    const investmentKeywords = /investimento|investir|terreno|renda|permuta|compra na planta|m²|região|liquidez|construtora/i;
    const isInvestmentContext = investmentKeywords.test(lastMessage) || (extra_data?.finalidade === "investimento");
    
    if (isInvestmentContext && intent === "busca" && !isExplicitSearchRequest) {
      console.log(`[MarIA Debug] Forçando intent consultivo para contexto de investimento: "${lastMessage}"`);
      intent = "consultivo";
    }

    // 2. MAIN CHAT
    let mainModel = "google/gemini-3-flash-preview";
    let mainPrompt = PROMPTS.BUSCA_CHAT;
    let fallbackUsed = false;

    if (intent === "consultivo") {
      mainModel = "openai/gpt-4o"; // Modelo premium para análise estratégica e consultoria
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
      // Fallback: Premium -> Gemini 2.5 Pro -> Gemini Flash
      if (mainModel === "openai/gpt-5") {
        fallbackUsed = true;
        console.log(`[MarIA Debug] Falha no GPT-5. Tentando fallback para Gemini 2.5 Pro.`);
        rawReply = await callAI(lovableApiKey, "google/gemini-2.5-pro", mainPrompt, messages);
      } else if (mainModel !== "google/gemini-3-flash-preview") {
        fallbackUsed = true;
        console.log(`[MarIA Debug] Falha no modelo premium. Tentando fallback para Gemini Flash.`);
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
    // CRÍTICO: Não disparar busca automática se o usuário apenas citou um termo genérico sem intenção clara de VER agora.
    const isExplicitSearchRequest = searchPatterns.test(lastMessage);

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
    let missingFilters: string[] = [];

    // Check search requirements
    const searchCheck = checkSearchRequirements(filters || extractedData ? {
      finalidade: filters?.finalidade || extractedData?.finalidade || "compra",
      bairro: filters?.bairro || extractedData?.bairro_preferencia,
      tipo: filters?.tipo || extractedData?.tipo_imovel,
      preco_max: filters?.preco_max || extractedData?.orcamento_max,
      preco_min: filters?.preco_min || extractedData?.orcamento_min
    } : null, intent, lastMessage, extractedData);
    
    missingFilters = searchCheck.missing;

    // Final check for search triggering
    if (searchCheck.allowed) {
      // Garantir que temos um objeto de filtros válido
      const effectiveFilters = filters || {
        finalidade: extractedData?.finalidade || "compra",
        bairro: extractedData?.bairro_preferencia,
        tipo: extractedData?.tipo_imovel,
        preco_max: extractedData?.orcamento_max,
        preco_min: extractedData?.orcamento_min
      };

      if (effectiveFilters.finalidade !== "anunciante") {
        allProperties = await searchProperties(supabase, effectiveFilters);
        
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
          cleaned = `Esse recorte está mais restrito no portal agora. Posso ampliar a busca para regiões próximas ou organizar uma análise estratégica para encontrar alternativas mais coerentes com seu objetivo.`;
          console.log(`[MarIA Search] No results even after broadening.`);
        }
      }
    }


    // 5. DETERMINISTIC REPLY FALLBACK (Para casos de resposta vazia ou erro)
    let finalReply = cleaned || rawReply;
    if (showResults && (!finalReply || finalReply.trim().length < 5)) {
      finalReply = "Encontrei opções compatíveis com seu perfil em " + (filters?.bairro || 'Bombinhas') + ". Confira abaixo:";
    }
    if (!finalReply || finalReply.trim().length === 0) {
      finalReply = "Entendi. Estou buscando as melhores opções para você.";
    }

    // 4. PERSISTENCE (Background)
    (async () => {
      try {
        console.log(`[MarIA Persistence] Starting persistence for session ${sessionId}`);
        
        // 1. Map data to lead fields
        const leadPayload: any = {
          last_contact_at: new Date().toISOString()
        };

        if (extractedData) {
          Object.assign(leadPayload, {
            lead_score: extractedData.lead_score,
            objetivo: extractedData.objetivo,
            prazo_compra: extractedData.prazo_compra,
            orcamento_min: extractedData.orcamento_min,
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
          });
        }

        // Always include chat history snapshot if we have it
        if (messages.length > 0) {
          leadPayload.chat_history = messages;
        }

        // Update lead data
        const leadId = await upsertLeadBySession(supabase, sessionId, leadPayload, lastMessage, extractedData ? "maria_extraction" : "maria_chat");

        if (leadId) {
          console.log(`[MarIA Persistence] Lead ID confirmed: ${leadId}. Persisting messages and metrics.`);
          
          // 2. Persist message history (Individual messages)
          const currentMessagesToSave = [];
          const lastUserMsg = messages[messages.length - 1];
          if (lastUserMsg) {
            currentMessagesToSave.push({
              session_id: sessionId,
              lead_id: leadId,
              role: lastUserMsg.role,
              content: lastUserMsg.content
            });
          }
          
          currentMessagesToSave.push({
            session_id: sessionId,
            lead_id: leadId,
            role: "assistant",
            content: finalReply
          });

          const { error: msgError } = await supabase.from("maria_messages").insert(currentMessagesToSave);
          if (msgError) console.error("[MarIA Persistence] Error persisting messages:", msgError);
          
          // 3. Record search metrics
          const { error: metricError } = await supabase.from("maria_search_metrics").insert({
            session_id: sessionId,
            finalidade: filters?.finalidade || extractedData?.finalidade,
            missing_filters: missingFilters,
            results_count: allProperties.length,
            showed_cards: showResults,
            messages_count: messages.length
          });
          if (metricError) console.error("[MarIA Persistence] Error recording metrics:", metricError);
        } else {
          console.warn(`[MarIA Persistence] No leadId returned for session ${sessionId}. Skipping messages/metrics.`);
        }
      } catch (err) {
        console.error("[MarIA Persistence] Background persistence error:", err);
      }
    })();

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