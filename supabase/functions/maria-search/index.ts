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
}

const SYSTEM_PROMPT = `Você é a MarIA, assistente inteligente de imóveis em Bombinhas/SC. Você ajuda pessoas a encontrar imóveis para compra, aluguel anual e temporada na região de Bombinhas.
Sua missão é fornecer resultados que correspondam EXATAMENTE ao que o usuário pediu. Se o usuário busca por "apartamento", mostre apenas apartamentos. Se busca por um bairro específico, priorize aquele bairro.


Seu trabalho é:
1. Interpretar a mensagem do usuário e extrair filtros de busca.
2. Apresentar os resultados de forma conversacional e amigável.
3. PRIORIDADE MÁXIMA: Priorizar e destacar imóveis em DESTAQUE PAGO (destaque_pago). 
   * Estes anúncios DEVEM aparecer primeiro e ser mencionados como "Oportunidade Premium".
4. Após mostrar resultados, oferecer naturalmente para salvar a busca.

REGRA CRÍTICA - QUANDO MOSTRAR IMÓVEIS:
- Você DEVE iniciar sua resposta com exatamente [SHOW_RESULTS] ou [NO_RESULTS_YET] para indicar se os cards de imóveis devem ser exibidos.
- Use [SHOW_RESULTS] SOMENTE quando:
  * O usuário fez uma busca clara e específica com intenção definida (ex: "quero comprar apto em Bombas", "casas à venda em Mariscal")
  * O usuário pediu explicitamente para ver opções/resultados
  * Você tem filtros suficientes para uma busca significativa (pelo menos finalidade OU bairro OU tipo)
  * O SISTEMA indicou que existem resultados de busca para mostrar (veja o contexto de resultados abaixo)
- Use [NO_RESULTS_YET] quando:
  * O usuário fez uma pergunta exploratória ou contextual (ex: "tem escola perto?", "qual bairro é melhor?")
  * Você ainda está fazendo perguntas de esclarecimento ao usuário (ex: "Você quer comprar ou alugar?")
  * A mensagem é uma saudação ou conversa geral
  * Filtros importantes ainda estão faltando e você precisa perguntar mais
  * O usuário não demonstrou intenção clara de ver imóveis agora
  * O usuário está fornecendo dados de contato (nome, telefone, email)
  * O usuário está falando sobre anunciar/cadastrar um imóvel
  * O usuário está reclamando dos cards ou pediu para parar de mostrar
  * O usuário mudou de assunto (não está mais pedindo busca)
  * A conversa é sobre qualquer tema que NÃO seja mostrar resultados de busca
- NUNCA misture perguntas de esclarecimento com cards de imóveis. Se você está perguntando algo, use [NO_RESULTS_YET].

REGRA SOBRE ANUNCIAR/CADASTRAR IMÓVEL:
- Se o usuário quiser anunciar, cadastrar, registrar ou divulgar um imóvel, NÃO sugira imobiliárias externas.
- Oriente o usuário a usar o formulário de cadastro no site: "Você pode cadastrar seu imóvel diretamente pelo nosso site! Basta acessar a seção de parceiros na página principal e preencher o formulário. Sua submissão será analisada e publicada em breve 😊"
- Use [NO_RESULTS_YET] neste caso.

REGRA SOBRE PARAR CARDS:
- Se o usuário pedir para parar de mostrar cards, disser "pare de mandar os cards", reclamar dos cards, ou qualquer variação, RESPEITE e use [NO_RESULTS_YET].
- Confirme que você entendeu e que só mostrará cards quando ele pedir novamente.

REGRA CRÍTICA DE FORMATAÇÃO:
- Os detalhes dos imóveis (título, preço, quartos, link, telefone) serão exibidos automaticamente em CARDS VISUAIS na interface.
- Você NÃO deve listar os detalhes dos imóveis no texto. Nada de emojis 🏠📍💰🛏️🔗📞 seguidos de dados.
- Escreva APENAS uma introdução curta e natural sobre os resultados encontrados.
- Exemplo BOM: "[SHOW_RESULTS] Encontrei 2 opções de aluguel anual em Bombas dentro do seu orçamento! Dá uma olhada nos cards abaixo 👇"
- Exemplo RUIM: "🏠 **Apartamento em Bombas** 📍 Bombas 💰 R$ 2.600..." (NUNCA faça isso)
- Se houver mais resultados além dos exibidos, mencione: "Tenho mais X opções, quer ver?"
- Se foram buscados múltiplos tipos (ex: casa e kitnet) mas só encontrou um deles, EXPLIQUE: "Não encontrei kitnets disponíveis no momento, mas encontrei algumas casas que podem te interessar."
- Se o usuário excluiu um tipo (ex: "não quero apartamento"), NUNCA sugira apartamentos nos resultados.
- Se não houver resultados, sugira ampliar a busca por bairro, preço ou tipo. NÃO sugira o tipo que o usuário excluiu.

FLUXO DE CAPTAÇÃO DE LEAD (PRIORIDADE COMERCIAL MÁXIMA):
- Captar nome + WhatsApp é OBJETIVO #1. NUNCA peça e-mail. NUNCA mencione e-mail.
- Quando o SISTEMA indicar "GATE_ATIVO" no contexto, você ESTÁ segurando os melhores resultados. Mostre só o teaser e use uma CTA forte com escassez real e benefício claro. Exemplo:
  "Achei [N] casas ótimas pro seu perfil em [bairro] 🔥 Aqui vai uma como prévia 👇 As outras são as mais procuradas e somem rápido na temporada — me passa seu **nome e WhatsApp** que eu libero todas agora e ainda te aviso em primeira mão quando entrar imóvel novo desse perfil. Leva 5 segundos 💛"
- Quando o SISTEMA indicar "SEM_RESULTADOS_GATE", JAMAIS responda apenas "não encontrei, quer fazer outra busca?". Isso PERDE o lead pra sempre. Sua resposta DEVE seguir esta estrutura em UMA única mensagem curta:
  1. Reconhecer com empatia: "Olha, [bairro/tipo] tá disputado mesmo — esses somem rápido."
  2. Criar urgência futura concreta: "Tenho corretores garimpando aqui e entram novidades praticamente toda semana."
  3. Pedir nome+WhatsApp como SOLUÇÃO (não como cadastro): "Me passa seu **nome e WhatsApp** que eu te aviso EM PRIMEIRA MÃO assim que entrar [tipo] em [bairro] — antes de virar anúncio público. Sem spam, prometo 💛"
  - NUNCA termine com "quer tentar outra busca?" sem antes pedir o contato.
- Quando o SISTEMA indicar "LEAD_CAPTURADO", apenas mostre/comente os imóveis normalmente. NÃO peça contato de novo.

QUALIFICAÇÃO INTELIGENTE — TOM CONSULTIVO FIRME (SPIN curto, NUNCA várias perguntas juntas):
- Faça UMA pergunta-chave por vez. Nunca dispare 2-3 perguntas no mesmo balão (espanta o cliente).
- Antes de mostrar cards, valide rapidamente o essencial conforme a finalidade:
  * Temporada → "Pra quando você tá pensando? Quantas pessoas vão?" (escolha UMA pergunta primeiro, depois a outra)
  * Aluguel anual → "Vai morar sozinho ou família? Tem prazo pra entrar no imóvel?" (uma de cada vez)
  * Venda → SEMPRE comece por "É pra morar ou investir?" — essa resposta muda TUDO o que vem depois.
- Se VENDA + INVESTIR → priorize ROI e busca de COMPRA: "Tá pensando em renda de temporada ou valorização? Tem orçamento teto definido? Já investe em imóveis ou é o primeiro?" — sugira oportunidades com boa ocupação histórica.

⚠️ REGRA DE OURO PARA INVESTIDORES:
- Se o usuário diz "quero comprar para renda de temporada" ou "investir em apartamento para locar", a finalidade é COMPRA (venda), NÃO temporada. Você deve buscar imóveis à VENDA que tenham perfil para gerar renda.

Bairros de Bombinhas: Bombas, Centro, Mariscal, Zimbros, Canto Grande, Morrinhos, Quatro Ilhas, Praia da Conceição.`;

const FILTER_EXTRACTION_PROMPT = `Analise a CONVERSA COMPLETA do usuário e extraia os filtros de busca acumulados para imóveis em Bombinhas/SC.

REGRA CRÍTICA - CLASSIFICAÇÃO DE INTENÇÃO:
Primeiro, determine a INTENÇÃO da última mensagem do usuário. Classifique como:
- "search": O usuário quer buscar/ver imóveis (nova busca ou refinamento). Se ele estiver respondendo a uma pergunta sobre o perfil do imóvel (ex: "quero morar", "2 quartos", "até 800k"), isso é INTENÇÃO DE BUSCA/REFINAMENTO.
- "conversation": Qualquer outra coisa (saudação, perguntas gerais, dados de contato, reclamação, anunciar imóvel, conversa casual).

Se a intenção for "conversation", retorne APENAS: {"intent":"conversation"}
NÃO extraia filtros para mensagens conversacionais.

REGRA CRÍTICA DE CONTEXTO (somente para intent=search):
- Considere TODAS as mensagens anteriores do usuário para manter o contexto.
- Se o usuário fez uma busca anterior e agora pede ajustes (ex: "mais barato", "outro bairro", "com piscina"), MANTENHA os filtros anteriores e apenas ajuste o que foi pedido.
- Se o usuário iniciar uma busca completamente nova (ex: "quero comprar um terreno"), descarte os filtros anteriores.

Retorne SOMENTE um JSON válido. Se intent=conversation, retorne {"intent":"conversation"}.
Se intent=search, inclua "intent":"search" junto com os filtros.

REGRA CRÍTICA - NÃO INVENTAR FILTROS:
- Extraia APENAS filtros que o usuário mencionou EXPLICITAMENTE.
- NUNCA assuma "temporada" como padrão.
- Se o usuário fala "comprar para alugar" ou "investir para renda", a finalidade é "compra".

Campos possíveis (somente para search):
- intent: "search"
- finalidade: "compra", "aluguel_anual" ou "temporada" — APENAS se mencionado explicitamente
- tipo: usar SOMENTE quando o usuário menciona um único tipo explicitamente
- tipo_included: array de tipos aceitos quando múltiplos
- tipo_excluded: array de tipos que o usuário NÃO quer
- bairro: nome do bairro
- preco_min, preco_max: valores numéricos
- quartos, banheiros, vagas_garagem, capacidade_pessoas: números
- piscina, vista_mar, frente_mar, mobiliado, aceita_pet, churrasqueira, ar_condicionado, wifi: true/false

Mapeamento de sinônimos para tipos:
- "kitnet", "kitinete", "quitinete", "kit" → "studio"
- "apt", "apto" → "apartamento"
- "cob" → "cobertura"

Retorne APENAS o JSON, sem texto adicional.`;

// Normaliza telefone BR (10-11 dígitos) ou AR (10-13 dígitos).
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const original = String(raw).trim();
  let digits = original.replace(/\D/g, "");
  if (!digits) return null;

  const hasPlus54 = /^\+?\s*54/.test(original);
  const hasPlus55 = /^\+?\s*55/.test(original);

  if (hasPlus54 || (digits.startsWith("54") && digits.length >= 12)) {
    if (digits.startsWith("54")) digits = digits.slice(2);
    if (digits.length < 10 || digits.length > 11) return null;
    return "54" + digits;
  }

  if (hasPlus55 || (digits.startsWith("55") && digits.length > 11)) {
    if (digits.startsWith("55")) digits = digits.slice(2);
  }

  if (digits.length < 10 || digits.length > 11) return null;
  return "55" + digits;
}

function extractPhoneFromText(text: string): { normalized: string | null; hasShortPhone: boolean } {
  if (!text) return { normalized: null, hasShortPhone: false };
  const patterns = [
    /\+?\s*5[45]\s*\d[\d\s().-]{8,15}/g,
    /\(?\s*\d{2,3}\s*\)?\s*9?\s*\d{4}[-\s.]?\d{4}/g,
    /\d{10,13}/g,
  ];
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

async function upsertLeadBySession(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  patch: Record<string, unknown>,
): Promise<string | null> {
  if (!sessionId) return null;
  try {
    const { data: existing } = await supabase
      .from("leads_maria")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("leads_maria")
        .update({ ...patch, last_contact_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) console.error("Lead update error:", error);
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
    if (error) { console.error("Lead insert error:", error); return null; }
    return inserted?.id ?? null;
  } catch (e) {
    console.error("upsertLeadBySession failed:", e);
    return null;
  }
}

async function saveLastConversationTurn(
  supabase: ReturnType<typeof createClient>,
  leadId: string,
  userMsg: string,
  assistantMsg: string,
) {
  try {
    const rows = [
      { lead_id: leadId, role: "user", content: userMsg },
      { lead_id: leadId, role: "assistant", content: assistantMsg },
    ].filter(r => r.content);
    if (rows.length) {
      const { error } = await supabase.from("lead_conversations").insert(rows);
      if (error) console.error("Conv insert error:", error);
    }
  } catch (e) { console.error("saveLastConversationTurn failed:", e); }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, session_id, action, nome, telefone, lead_captured: clientLeadCaptured } = body || {};
    const sessionId: string = session_id || "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch dynamic AI configuration
    const { data: aiConfigData } = await supabase
      .from("ai_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    const aiConfig = {
      model: aiConfigData?.model || "google/gemini-2.0-flash-exp",
      temperature: aiConfigData?.temperature ?? 0.7,
      systemPrompt: aiConfigData?.system_prompt || SYSTEM_PROMPT,
      maxTokens: aiConfigData?.max_tokens || 1000
    };

    if (action === "submit_lead") {
      // ... keep existing code
      if (!sessionId || !nome || !telefone) {
        return new Response(JSON.stringify({ success: false, error: "missing_fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const cleanName = String(nome).trim().slice(0, 80);
      const normalizedPhone = normalizePhone(telefone);
      if (cleanName.length < 2 || !normalizedPhone) {
        return new Response(JSON.stringify({ success: false, error: "invalid_data" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const leadId = await upsertLeadBySession(supabase, sessionId, { nome: cleanName, telefone: normalizedPhone, status: "novo" });
      
      // Notificação interna para o dashboard do corretor
      if (leadId) {
        await supabase.from("broker_notifications").insert({
          lead_id: leadId,
          title: "Novo Lead Qualificado! 🔥",
          message: `${cleanName} acabou de se qualificar via MarIA Chat.`,
          session_id: sessionId
        });
        
        // Simulação de Integração WhatsApp via Edge Function dedicada ou Log
        console.log(`[WHATSAPP NOTIFICATION] Para Corretor: Novo Lead ${cleanName} (${normalizedPhone})`);
      }

      return new Response(JSON.stringify({ success: !!leadId, lead_id: leadId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userMessage = messages?.[messages.length - 1]?.content || "";
    const recentMessages = messages.slice(-6);
    const conversationContext = recentMessages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
      .join("\n");

    const filterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: "system", content: FILTER_EXTRACTION_PROMPT },
          { role: "user", content: `Histórico:\n${conversationContext}\n\nMsg: ${userMessage}` },
        ],
        temperature: 0.1,
      }),
    });

    const filterData = await filterResponse.json();
    let filterText = filterData.choices?.[0]?.message?.content || "{}";
    filterText = filterText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let filters: SearchFilters & { intent?: string } = {};
    try { 
      filters = JSON.parse(filterText); 
    } catch (e) { 
      filters = {}; 
    }

    const isConversation = filters.intent === "conversation";
    if (isConversation) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: "system", content: aiConfig.systemPrompt + "\n\nEsta mensagem NÃO é uma busca por imóveis. Use [NO_RESULTS_YET]. Responda de forma natural e amigável, seguindo as diretrizes do system prompt." },
            ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
          ],
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.maxTokens
        }),
      });
      const aiData = await aiResponse.json();
      let assistantMessage = aiData.choices?.[0]?.message?.content || "Desculpe, tive um problema.";
      assistantMessage = assistantMessage.replace(/^\[(SHOW_RESULTS|NO_RESULTS_YET)\]\s*/g, "");
      
      // Save anonymous conversation turn if lead doesn't exist yet
      const leadId = await upsertLeadBySession(supabase, sessionId, {
        mensagem_original: userMessage
      });
      if (leadId) {
        await saveLastConversationTurn(supabase, leadId, userMessage, assistantMessage);
      }

      return new Response(JSON.stringify({
        reply: assistantMessage, properties: [], all_properties: [], filters_used: {},
        results_count: 0, broader_search: false, lead_saved: false,
        show_results: false, clear_results: true,
        debug_config: aiConfig
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- SEARCH INTENT ---
    let query = supabase.from("imoveis").select("*").eq("status", "ativo");
    
    if (filters.finalidade) query = query.eq("finalidade", filters.finalidade);
    
    if (filters.tipo_included?.length) {
      query = query.in("tipo", filters.tipo_included);
    } else if (filters.tipo) {
      query = query.eq("tipo", filters.tipo);
    }
    
    if (filters.bairro) query = query.ilike("bairro", `%${filters.bairro}%`);
    
    if (filters.preco_max) {
      if (filters.finalidade === "temporada") query = query.lte("preco_temporada_diaria", filters.preco_max);
      else query = query.lte("preco", filters.preco_max);
    }
    if (filters.preco_min) {
      if (filters.finalidade === "temporada") query = query.gte("preco_temporada_diaria", filters.preco_min);
      else query = query.gte("preco", filters.preco_min);
    }

    if (filters.quartos) query = query.gte("quartos", filters.quartos);
    if (filters.banheiros) query = query.gte("banheiros", filters.banheiros);
    if (filters.vagas_garagem) query = query.gte("vagas_garagem", filters.vagas_garagem);
    if (filters.capacidade_pessoas) query = query.gte("capacidade_pessoas", filters.capacidade_pessoas);
    
    // Boolean filters
    const booleanFilters = ["piscina", "vista_mar", "frente_mar", "mobiliado", "aceita_pet", "churrasqueira", "ar_condicionado", "wifi"];
    for (const key of booleanFilters) {
      if ((filters as any)[key] === true) {
        query = query.eq(key, true);
      }
    }

    const { data: properties, error: dbError } = await query
      .order("destaque_pago", { ascending: false })
      .order("destaque", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);
    if (dbError) throw dbError;

    const resultsToUse = properties || [];
    const noResults = resultsToUse.length === 0;
    
    let leadAlreadyCaptured = !!clientLeadCaptured;
    if (sessionId && !leadAlreadyCaptured) {
      const { data: leadRow } = await supabase.from("leads_maria").select("nome, telefone").eq("session_id", sessionId).maybeSingle();
      leadAlreadyCaptured = !!(leadRow?.nome && leadRow?.telefone);
    }

    const gateActive = !leadAlreadyCaptured && resultsToUse.length >= 1;
    const propertyContext = `\n\nResultados (${resultsToUse.length}):\n${JSON.stringify(resultsToUse, null, 2)}${gateActive ? "\n\nGATE_ATIVO: Peça nome+whats para liberar o resto." : ""}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: "system", content: aiConfig.systemPrompt + propertyContext },
          ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
        ],
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.maxTokens
      }),
    });

    const aiData = await aiResponse.json();
    if (aiData.error) {
      console.error("AI Gateway Error:", aiData.error);
      throw new Error(`AI Gateway error: ${aiData.error.message || "Unknown error"}`);
    }
    let assistantMessage = aiData.choices?.[0]?.message?.content || "Olá! Como posso te ajudar a encontrar seu imóvel em Bombinhas hoje?";
    let showResults = assistantMessage.includes("[SHOW_RESULTS]");
    assistantMessage = assistantMessage.replace(/^\[(SHOW_RESULTS|NO_RESULTS_YET)\]\s*/g, "");

    // Save conversation turn
    const leadId = await upsertLeadBySession(supabase, sessionId, {
      mensagem_original: userMessage,
      interesse: filters.finalidade || undefined,
      bairro_interesse: filters.bairro || undefined,
      tipo_imovel: filters.tipo || undefined
    });
    if (leadId) {
      await saveLastConversationTurn(supabase, leadId, userMessage, assistantMessage);
    }

    return new Response(JSON.stringify({
      reply: assistantMessage,
      properties: showResults ? resultsToUse.slice(0, gateActive ? 2 : 10) : [],
      all_properties: showResults ? resultsToUse : [],
      filters_used: filters,
      results_count: resultsToUse.length,
      gate_active: gateActive,
      show_results: showResults,
      debug_config: aiConfig
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ reply: "Erro no servidor." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
