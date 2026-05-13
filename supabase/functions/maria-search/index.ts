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

const SYSTEM_PROMPT = `Você é a MarIA, concierge imobiliária de Bombinhas, Santa Catarina.

## SUA PERSONALIDADE
- Tom: acolhedor, profissional, local. Como uma moradora de Bombinhas que trabalha com imóveis há anos.
- Linguagem: informal mas competente. Use emojis com moderação (máximo 1-2 por mensagem).
- Extensão: respostas CURTAS. Máximo 3-4 linhas por mensagem. Nada de parágrafos longos.
- Estilo: faça UMA pergunta por vez. Nunca duas na mesma mensagem.

## REGRA PRINCIPAL — QUALIFICAR ANTES DE MOSTRAR

Você não mostra imóveis sem ter filtros mínimos suficientes para uma busca relevante.

Filtros mínimos por finalidade:
- TEMPORADA: capacidade (quantas pessoas) + bairro + faixa de diária (ou pelo menos 2 desses 3)
- ALUGUEL ANUAL: tipo (casa/apto) ou quartos + pelo menos 1 entre: bairro, faixa de aluguel ou necessidade específica (pet, garagem)
- COMPRA: finalidade clara (morar ou investir) + pelo menos 1 entre: bairro, faixa de valor ou quartos
- INVESTIMENTO: faixa de investimento + tipo de retorno preferido (temporada ou valorização)

### Quando o usuário for VAGO (ex: \"me mostra imóveis\", \"oi\", \"olá\"):
Responda com saudação curta e pergunte a finalidade:
\"Oi! 👋 Sou a MarIA, assistente de imóveis em Bombinhas. Você busca aluguel de temporada, anual, compra ou investimento?\"
Sem [SHOW_RESULTS]. Sem busca. Só a pergunta.

### Quando o usuário der POUCOS filtros (ex: \"quero investir em Bombinhas\"):
Pergunte o que falta para completar os filtros mínimos. Uma pergunta por vez:
\"Boa! Você prefere retorno com aluguel de temporada ou valorização a longo prazo?\"
Depois: \"E qual sua faixa de investimento?\"
Então mostre resultados.

### Quando o usuário der FILTROS SUFICIENTES mas não completos:
Faça UMA pergunta útil que melhore a busca, depois mostre:
Ex: usuário disse \"casa para 6 pessoas em Mariscal até R$800/dia\"
→ \"Perfeito — Mariscal, até R$800/dia para 6 pessoas. Prefere casa inteira com piscina ou sem?\"
→ Depois: [SHOW_RESULTS]

### Quando o usuário der TUDO (finalidade + bairro + tipo + capacidade + orçamento):
Pode mostrar resultados diretamente. Não faça perguntas só para parecer concierge.

### RESUMO DA REGRA:
- Usuário vago → 2-3 perguntas, uma por vez
- Usuário médio → 1-2 perguntas
- Usuário completo → 1 pergunta útil ou mostra direto
- Nunca perguntar só por perguntar

## COMO APRESENTAR RESULTADOS

REGRA OBRIGATÓRIA: Quando você decidir mostrar imóveis ao usuário, você DEVE incluir a tag [SHOW_RESULTS] em uma linha separada no final da sua mensagem. 

Sem essa tag, os cards de imóveis NÃO serão exibidos.

### QUANDO NÃO MOSTRAR (NUNCA incluir [SHOW_RESULTS]):
- Se você estiver fazendo uma pergunta (?)
- Se você ainda estiver qualificando (pedindo bairro, pessoas, valor, tipo)
- Se a mensagem for apenas uma saudação ou conversa inicial
- Se você não tiver filtros mínimos suficientes (capacidade + bairro + valor)

### QUANDO MOSTRAR (Incluir [SHOW_RESULTS]):
- Somente quando você tiver informações suficientes e quiser apresentar os resultados como resposta final.
- A mensagem deve ser uma afirmação, nunca terminar em pergunta se você for mostrar cards.

Formato correto:
Separei as melhores opções em Mariscal pra você 👇

[SHOW_RESULTS]

## CAPTURA DE LEAD (LEAD GATE)

O sistema controla automaticamente quando pedir dados do usuário através de um formulário visual.

Você NÃO deve pedir nome ou WhatsApp por texto na conversa.

Quando houver resultados e o contexto incluir GATE_ATIVO, apenas apresente os imóveis de forma natural.

Exemplo:
"Separei algumas opções que combinam com o que você procura 👇"

[SHOW_RESULTS]

O sistema exibirá automaticamente os cards e o formulário visual de contato.

Se o usuário enviar nome e telefone como texto no chat, agradeça brevemente e continue normalmente:
"Anotado, [Nome]! Voltando aos imóveis..."

## O QUE NUNCA FAZER
- Nunca mostrar imóveis sem filtros mínimos
- Nunca escrever mais de 4 linhas seguidas
- Nunca fazer mais de 1 pergunta por mensagem
- Nunca usar linguagem corporativa (\"comprometidos\", \"soluções inovadoras\", \"experiência imersiva\")
- Nunca inventar dados sobre imóveis que não existem no banco
- Nunca falar sobre restaurantes, passeios ou turismo geral — você é especialista em IMÓVEIS
- Nunca recomendar imóveis fora de Bombinhas
- Nunca fazer promessas de valorização, retorno financeiro ou rentabilidade garantida
- Nunca dizer \"Entendido\", \"Compreendido\", \"Vou processar\" — soa como robô

## CONHECIMENTO LOCAL DE BOMBINHAS

Use esse conhecimento para orientar o usuário e sugerir bairros, mas de forma aberta:

- Regra de Bairro: Alguma preferência de praia ou bairro? Temos opções em Mariscal, Bombas, Quatro Ilhas, Canto Grande, Zimbros, Lagoinha e outras praias.
- Regra Bombinhas: Se o usuário disser 'Bombinhas' como localização, NUNCA interprete como bairro Centro. Pergunte: 'Quer que eu busque em toda Bombinhas ou prefere alguma praia específica? Temos Mariscal, Bombas, Quatro Ilhas, Canto Grande, Zimbros, Lagoinha...' Se ele disser 'todas' ou 'tanto faz', busque sem filtro de bairro.
- Mariscal: praia popular, muito procurada na temporada, perfil jovem e famílias, boa infraestrutura de comércio.
- Bombas: bairro mais central, fácil acesso a tudo, equilíbrio entre praia e serviços.
- Quatro Ilhas: mais tranquilo, natureza preservada, perfil família.
- Centro (Bombinhas): próximo de tudo, prático para moradores fixos.
- Zimbros: rústico, vila de pescadores, charme local.
- Canto Grande: baía calma de um lado (Mar de Dentro), mar aberto do outro (Mar de Fora).
- Lagoinha: pequena e exclusiva, acesso limitado.
- Sepultura: praia pequena com águas cristalinas, muito procurada para mergulho.

## EXEMPLOS DE BOAS RESPOSTAS

Saudação:
\"Oi! 👋 Sou a MarIA, assistente de imóveis em Bombinhas. Você busca temporada, aluguel anual, compra ou investimento?\"

Qualificação (temporada):
\"Legal! Para quantas pessoas? E qual sua faixa de valor para a diária?\"

Qualificação (investimento):
\"Boa! Você prefere retorno com aluguel de temporada ou valorização a longo prazo?\"

Pergunta útil antes de mostrar:
\"Perfeito — Mariscal, até R$800/dia para 6 pessoas. Prefere casa com piscina ou sem?\"

Apresentando resultados (Sem pergunta):
\"Separei as melhores opções em Mariscal que encaixam no seu perfil 👇\"

[SHOW_RESULTS]

Após resultados (Mensagem separada):
\"Algum desses chamou sua atenção?\"

Captura de lead:
\"Para liberar as outras 12 opções e te avisar quando entrar algo novo, me passa seu nome e WhatsApp?\"

Pós-lead:
\"Pronto, João! 🚀 Aqui estão as outras opções. Quer que eu verifique disponibilidade em algum?\"

## EXEMPLOS DE RESPOSTAS RUINS (NUNCA FAZER)

❌ \"Excelente escolha! Bombinhas é um dos destinos que mais valoriza em Santa Catarina. Para quem busca investimento, temos opções que variam desde revenda com lucro na valorização até alta rentabilidade com locação de temporada. Destaquei aqui duas Oportunidades Premium que acabaram de entrar e são perfeitas para retorno sobre investimento...\"
→ Longo demais, promessa financeira, mostra imóveis sem qualificar

❌ \"Entendido, vou salvar seu contato e processar sua busca.\"
→ Robótico, frio, sem personalidade

❌ \"Antes de mostrar, me diga mais uma coisa...\"
→ Parece trava artificial, burocrático

✅ \"Boa! Qual sua faixa de investimento?\"
→ Direto, útil, humano
`;

const FILTER_EXTRACTION_PROMPT = `Analise a CONVERSA COMPLETA do usuário e extraia os filtros de busca acumulados para imóveis em Bombinhas/SC.

REGRA CRÍTICA - CLASSIFICAÇÃO DE INTENÇÃO:
Primeiro, determine a INTENÇÃO da última mensagem do usuário. Classifique como:
- "search": O usuário quer buscar/ver imóveis (nova busca ou refinamento). Se ele estiver respondendo a uma pergunta sobre o perfil do imóvel (ex: "quero morar", "2 quartos", "até 800k"), isso é INTENÇÃO DE BUSCA/REFINAMENTO.

REGRA DE OVERRIDE:
Se o usuário pedir explicitamente para ver resultados, como: "me mostre", "mostra opções", "quero ver", "pode mostrar", "manda", "exibe", "ver imóveis", "quero opções", classifique como "search" SOMENTE se o histórico da conversa já tiver pelo menos: finalidade definida e pelo menos 1 filtro relevante (preço, bairro, capacidade, tipo ou quartos). Caso contrário, classifique como "qualifying".

- "qualifying": O usuário demonstrou intenção de busca mas ainda não forneceu filtros suficientes para uma busca relevante. Use SOMENTE quando tem apenas finalidade mas falta bairro, preço, tipo ou capacidade. Se o usuário já deu finalidade + pelo menos 2 filtros concretos, use "search", não "qualifying".
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

function hasMinimumFilters(filters: SearchFilters & { intent?: string }): boolean {
  if (!filters.finalidade) return false;
  let count = 0;
  if (filters.bairro) count++;
  if (filters.preco_max || filters.preco_min) count++;
  if (filters.quartos) count++;
  if (filters.capacidade_pessoas) count++;
  if (filters.tipo || filters.tipo_included?.length) count++;
  return count >= 2;
}

async function upsertLeadBySession(
  supabase: any,
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
      return existing.id as string;
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
    return (inserted?.id as string) ?? null;
  } catch (e) {
    console.error("upsertLeadBySession failed:", e);
    return null;
  }
}

async function saveLastConversationTurn(
  supabase: any,
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
  const startTime = Date.now();
  let filterExtractionTime = 0;
  let dbQueryTime = 0;
  let responseGenTime = 0;

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Maria-search function triggered");

  try {
    const body = await req.json();
    console.log("Request body received:", JSON.stringify(body).slice(0, 200) + "...");
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
      model: aiConfigData?.model || "anthropic/claude-3.5-sonnet",
      temperature: aiConfigData?.temperature ?? 0.3,
      systemPrompt: SYSTEM_PROMPT, // Sempre usar o do código, nunca do banco
      force_show_results: aiConfigData?.force_show_results ?? false,
      maxTokens: aiConfigData?.max_tokens || 2000
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

    // Auto-capturar lead enviado por texto
    if (!clientLeadCaptured && sessionId) {
      const { normalized: detectedPhone } = extractPhoneFromText(userMessage);
      const detectedName = extractNameFromText(userMessage);

      if (detectedPhone && detectedName) {
        await upsertLeadBySession(supabase, sessionId, {
          nome: detectedName,
          telefone: detectedPhone,
          status: "novo",
        });
        console.log("[AUTO-LEAD] Captured:", detectedName, detectedPhone);
      } else if (detectedPhone) {
        await upsertLeadBySession(supabase, sessionId, { telefone: detectedPhone });
      } else if (detectedName && userMessage.length < 40) {
        await upsertLeadBySession(supabase, sessionId, { nome: detectedName });
      }
    }

    const recentMessages = messages.slice(-10);
    const conversationContext = recentMessages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
      .join("\n");

    const filterStartTime = Date.now();
    const filterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview", // Use Flash for faster extraction
        messages: [
          { role: "system", content: FILTER_EXTRACTION_PROMPT },
          { role: "user", content: `Histórico:\n${conversationContext}\n\nMsg: ${userMessage}` },
        ],
        temperature: 0.1,
      }),
    });
    filterExtractionTime = Date.now() - filterStartTime;
    console.log(`[PERF] Filter extraction took ${filterExtractionTime}ms`);

    if (!filterResponse.ok) {
      const errorText = await filterResponse.text();
      console.error("Filter Gateway Error:", filterResponse.status, errorText);
      throw new Error(`AI Gateway Filter Error: ${filterResponse.status}`);
    }

    const filterData = await filterResponse.json();
    if (filterData.error) {
      console.error("AI Gateway Filter Error Data:", filterData.error);
      throw new Error(`AI Gateway Filter Error: ${filterData.error.message || "Unknown error"}`);
    }

    let filterText = filterData.choices?.[0]?.message?.content || "{}";
    filterText = filterText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let filters: SearchFilters & { intent?: string } = {};
    try { 
      filters = JSON.parse(filterText); 
      console.log('Filtros extraídos:', JSON.stringify(filters, null, 2));
    } catch (e) { 
      console.error('Erro ao parsear filtros:', filterText);
      filters = {}; 
    }

    if (filters.intent === "search" && !hasMinimumFilters(filters)) {
      console.log("[FILTER OVERRIDE] Filters insufficient, treating as qualifying");
      filters.intent = "qualifying";
    }

    const isConversation = filters.intent === "conversation" || filters.intent === "qualifying";
    if (isConversation) {
      const convStartTime = Date.now();
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: "system", content: aiConfig.systemPrompt + "\n\nEsta mensagem NÃO é uma busca por imóveis. Use [NO_RESULTS_YET]. Responda de forma natural e amigável, seguindo as diretrizes do system prompt." },
            ...recentMessages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
          ],
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.maxTokens
        }),
      });
      responseGenTime = Date.now() - convStartTime;
      console.log(`[PERF] Conversation response generation took ${responseGenTime}ms`);
    if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI Gateway Conv Error:", aiResponse.status, errorText);
        throw new Error(`AI Gateway Conv Error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      if (aiData.error) {
        console.error("AI Gateway Conv Error Data:", aiData.error);
        throw new Error(`AI Gateway Conv Error: ${aiData.error.message || "Unknown error"}`);
      }
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
        debug_config: aiConfig,
        debug: {
          model: aiConfig.model,
          filters_extracted: filters,
          query_sql: "No SQL executed (conversation)",
          results_count: 0,
          results_shown: 0,
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
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

    console.log('Executando query no Supabase...');
    const dbStartTime = Date.now();
    const { data: properties, error: dbError } = await query
      .order("destaque_pago", { ascending: false })
      .order("destaque", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);
    dbQueryTime = Date.now() - dbStartTime;
    console.log(`[PERF] DB query took ${dbQueryTime}ms`);
    
    if (dbError) {
      console.error('Erro na query do Supabase:', dbError);
      throw dbError;
    }
    
    console.log(`Resultados encontrados: ${properties?.length || 0}`);

    const resultsToUse = properties || [];
    const noResults = resultsToUse.length === 0;
    
    let leadAlreadyCaptured = !!clientLeadCaptured;
    if (sessionId && !leadAlreadyCaptured) {
      const { data: leadRow } = await supabase.from("leads_maria").select("nome, telefone").eq("session_id", sessionId).maybeSingle();
      leadAlreadyCaptured = !!(leadRow?.nome && leadRow?.telefone);
    }

    const gateActive = !leadAlreadyCaptured && resultsToUse.length >= 1;
    const summaryProps = resultsToUse.map(p => ({
      titulo: p.titulo,
      tipo: p.tipo,
      bairro: p.bairro,
      preco: p.preco,
      preco_temporada_diaria: p.preco_temporada_diaria,
      quartos: p.quartos,
      capacidade_pessoas: p.capacidade_pessoas,
      area_m2: p.area_m2,
    }));
    const propertyContext = resultsToUse.length > 0
      ? `\n\nResultados encontrados (${resultsToUse.length}):\n${JSON.stringify(summaryProps, null, 2)}${gateActive ? "\n\nO sistema vai exibir um formulário visual de contato automaticamente. Apresente os imóveis de forma natural." : ""}\n\nREGRAS DE RESPOSTA:\n1. Se você fizer uma pergunta (?), NUNCA use a tag [SHOW_RESULTS].\n2. Se você decidir mostrar os imóveis, use a tag [SHOW_RESULTS] no final da mensagem e NÃO faça perguntas.`
      : "";

    const searchGenStartTime = Date.now();
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: "system", content: aiConfig.systemPrompt + propertyContext },
          ...recentMessages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
        ],
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.maxTokens
      }),
    });
    responseGenTime = Date.now() - searchGenStartTime;
    console.log(`[PERF] Search response generation took ${responseGenTime}ms`);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway Search Error:", aiResponse.status, errorText);
      throw new Error(`AI Gateway Search Error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    if (aiData.error) {
      console.error("AI Gateway Search Error Data:", aiData.error);
      throw new Error(`AI Gateway Search Error: ${aiData.error.message || "Unknown error"}`);
    }
    let assistantMessage = aiData.choices?.[0]?.message?.content || "Olá! Como posso te ajudar a encontrar seu imóvel em Bombinhas hoje?";
    
    // Modo determinístico: se chegou aqui, tem filtros suficientes.
    // Sempre mostra cards, independente da tag [SHOW_RESULTS].
    const showResults = resultsToUse.length > 0;

    // CLEANUP: Remove technical tags
    assistantMessage = assistantMessage
      .replace(/\[SHOW_RESULTS\]/g, "")
      .replace(/\[NO_RESULTS_YET\]/g, "")
      .replace(/\[FILTERS\][\s\S]*?\[\/FILTERS\]/g, "")
      .replace(/\[FILTERS\][\s\S]*/g, "")
      .trim();

    // If we have no results, ensure the AI doesn't say it found some
    if (resultsToUse.length === 0 && (assistantMessage.toLowerCase().includes("separei") || assistantMessage.toLowerCase().includes("olhada"))) {
       assistantMessage = "Não encontrei opções exatas com esse perfil agora. Quer que eu amplie a busca para regiões próximas ou deixe um alerta para quando entrar algo parecido?";
    }

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

    const initialCount = gateActive ? 2 : 3;
    const visibleProperties = resultsToUse.slice(0, initialCount);

    console.log("[MarIA SEARCH DEBUG]", {
      filters,
      results_count: resultsToUse.length,
      gateActive,
      leadAlreadyCaptured,
      showResults,
      visible_properties_count: visibleProperties?.length,
      assistantMessage: assistantMessage.slice(0, 50) + "..."
    });

    return new Response(JSON.stringify({
      reply: assistantMessage,
      properties: showResults ? visibleProperties : [],
      all_properties: showResults ? resultsToUse : [],
      filters_used: filters,
      results_count: resultsToUse.length,
      gate_active: gateActive,
      show_results: showResults,
      debug_config: aiConfig,
      debug: {
        model: aiConfig.model,
        filters_extracted: filters,
        query_sql: "SELECT * FROM imoveis WHERE status = 'ativo' ...",
        results_count: resultsToUse.length,
        results_shown: showResults ? visibleProperties.length : 0,
        gateActive,
        showResults,
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
        timings: {
          filter_extraction: filterExtractionTime,
          db_query: dbQueryTime,
          response_generation: responseGenTime
        }
      }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("CRITICAL FUNCTION ERROR:", error);
    return new Response(JSON.stringify({ 
      reply: "Desculpe, tive um problema ao processar sua busca. Pode tentar novamente? 😊",
      error: error.message,
      stack: error.stack
    }), { 
      status: 200, // Returning 200 so the frontend can see the error message
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
