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

Seu trabalho é:
1. Interpretar a mensagem do usuário e extrair filtros de busca
2. Apresentar os resultados de forma conversacional e amigável
3. Após mostrar resultados, oferecer naturalmente para salvar a busca

REGRA CRÍTICA - QUANDO MOSTRAR IMÓVEIS:
- Você DEVE iniciar sua resposta com exatamente [SHOW_RESULTS] ou [NO_RESULTS_YET] para indicar se os cards de imóveis devem ser exibidos.
- Use [SHOW_RESULTS] SOMENTE quando:
  * O usuário fez uma busca clara e específica com intenção definida (ex: "quero alugar em Bombas", "casas à venda em Mariscal")
  * O usuário pediu explicitamente para ver opções/resultados
  * Você tem filtros suficientes para uma busca significativa (pelo menos finalidade OU bairro OU tipo)
  * O SISTEMA indicou que existem resultados de busca para mostrar (veja o contexto de resultados abaixo)
- Use [NO_RESULTS_YET] quando:
  * O usuário fez uma pergunta exploratória ou contextual (ex: "tem escola perto?", "qual bairro é melhor?")
  * Você ainda está fazendo perguntas de esclarecimento ao usuário (ex: "Você quer aluguel anual ou temporada?")
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
- Quando o SISTEMA indicar "SEM_RESULTADOS", seja proativa e direta:
  "Ainda não tenho exatamente isso no catálogo, MAS Bombinhas recebe novidades quase toda semana e tenho corretores caçando 24/7. Me passa seu **nome e WhatsApp** que eu te aviso em primeira mão quando aparecer 🔥 (sem spam, prometo)"
- Quando o SISTEMA indicar "LEAD_CAPTURADO", apenas mostre/comente os imóveis normalmente. NÃO peça contato de novo.
- ⚠️ TELEFONE — REGRA CRÍTICA (não erre):
  * Aceite BR (10-11 dígitos com DDD) e AR (com +54 ou começando com 54).
  * Exemplos VÁLIDOS BR: "41998251888", "47 99999-8888", "(11) 98765-4321".
  * Exemplos VÁLIDOS AR: "+54 9 11 1234-5678", "541112345678".
  * "41998251888" tem 11 dígitos = DDD 41 + 99825-1888 → VÁLIDO. Nunca diga que falta DDD nesse caso.
  * Só rejeite se vier 8-9 dígitos puros (sem DDD).
- Se o usuário fornecer nome E telefone válidos, responda com [LEAD_CAPTURE] + JSON e uma confirmação curta. Ex:
  [LEAD_CAPTURE]{"nome":"João Silva","telefone":"47999998888","interesse":"temporada","bairro":"Zimbros","tipo":"casa","faixa_preco":"até 600"}
  "Salvo, João! 🎉 Tô te enviando as outras opções agora e te aviso assim que rolar novidade no seu perfil."
- Se o usuário deu só telefone válido → confirme recebido e peça só o nome.
- Se deu só nome → peça só o WhatsApp.
- Se recusar a captação → respeite e continue ajudando normalmente.

Regras gerais:
- Sempre seja simpática e prestativa
- Use emojis com moderação
- NUNCA invente imóveis ou dados
- Mantenha respostas curtas (2-3 frases no máximo quando houver resultados)

Bairros de Bombinhas: Bombas, Centro, Mariscal, Zimbros, Canto Grande, Morrinhos, Quatro Ilhas, Praia da Conceição.`;

const FILTER_EXTRACTION_PROMPT = `Analise a CONVERSA COMPLETA do usuário e extraia os filtros de busca acumulados para imóveis em Bombinhas/SC.

REGRA CRÍTICA - CLASSIFICAÇÃO DE INTENÇÃO:
Primeiro, determine a INTENÇÃO da última mensagem do usuário. Classifique como:
- "search": O usuário quer buscar/ver imóveis (nova busca ou refinamento)
- "conversation": Qualquer outra coisa (saudação, perguntas gerais, dados de contato, reclamação, anunciar imóvel, conversa casual, esclarecimentos, etc.)

Se a intenção for "conversation", retorne APENAS: {"intent":"conversation"}
NÃO extraia filtros para mensagens conversacionais.

Exemplos de "conversation":
- "oi", "olá", "bom dia" → {"intent":"conversation"}
- "quero anunciar meu imóvel" → {"intent":"conversation"}
- "meu nome é João, telefone 47999..." → {"intent":"conversation"}
- "qual bairro é melhor?" → {"intent":"conversation"}
- "pare de mandar os cards" → {"intent":"conversation"}
- "obrigado" → {"intent":"conversation"}
- "você quer aluguel anual ou temporada?" (resposta: "anual") → Depende: se é resposta a uma pergunta de esclarecimento de busca, é "search". Se é conversa geral, "conversation".
- "sim" (após MarIA perguntar se quer salvar) → {"intent":"conversation"}

Exemplos de "search":
- "quero alugar em Bombas" → search com filtros
- "casas à venda até 500 mil" → search com filtros
- "tem algo mais barato?" (após busca anterior) → search (refinamento)
- "e com piscina?" (após busca anterior) → search (refinamento)

REGRA CRÍTICA DE CONTEXTO (somente para intent=search):
- Considere TODAS as mensagens anteriores do usuário para manter o contexto.
- Se o usuário fez uma busca anterior e agora pede ajustes (ex: "mais barato", "outro bairro", "com piscina"), MANTENHA os filtros anteriores e apenas ajuste o que foi pedido.
- Se o usuário iniciar uma busca completamente nova (ex: "quero comprar um terreno"), descarte os filtros anteriores.

Retorne SOMENTE um JSON válido. Se intent=conversation, retorne {"intent":"conversation"}.
Se intent=search, inclua "intent":"search" junto com os filtros.

REGRA CRÍTICA - NÃO INVENTAR FILTROS:
- Extraia APENAS filtros que o usuário mencionou EXPLICITAMENTE.
- Se o usuário disser "qualquer imóvel", "qualquer coisa", "tudo", "o que tiver", "qualquer um", "mostra tudo" — NÃO defina finalidade nem tipo. Deixe ambos vazios para trazer todos os resultados disponíveis.
- NUNCA assuma "temporada" como padrão. Só use finalidade se o usuário falar claramente em comprar, alugar (anual) ou temporada/férias/diária.
- Se a mensagem atual usa "qualquer/tudo" e a anterior tinha finalidade definida, REMOVA a finalidade (o usuário está ampliando a busca).

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
// Retorna string com prefixo país (55... ou 54...) ou null se inválido.
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const original = String(raw).trim();
  let digits = original.replace(/\D/g, "");
  if (!digits) return null;

  // Detecta país explícito via "+"
  const hasPlus54 = /^\+?\s*54/.test(original);
  const hasPlus55 = /^\+?\s*55/.test(original);

  if (hasPlus54 || (digits.startsWith("54") && digits.length >= 12)) {
    if (digits.startsWith("54")) digits = digits.slice(2);
    // AR aceita 10 (fixo/celular sem 9) ou 11 dígitos (celular com 9)
    if (digits.length < 10 || digits.length > 11) return null;
    return "54" + digits;
  }

  if (hasPlus55 || (digits.startsWith("55") && digits.length > 11)) {
    if (digits.startsWith("55")) digits = digits.slice(2);
  }

  // BR padrão: 10 (fixo) ou 11 (celular com 9)
  if (digits.length < 10 || digits.length > 11) return null;
  return "55" + digits;
}

// Extrai telefone da última mensagem do usuário. Aceita BR e AR.
function extractPhoneFromText(text: string): { normalized: string | null; hasShortPhone: boolean } {
  if (!text) return { normalized: null, hasShortPhone: false };

  // Tenta padrões com possível prefixo internacional
  const patterns = [
    /\+?\s*5[45]\s*\d[\d\s().-]{8,15}/g,           // +54/+55 explícito
    /\(?\s*\d{2,3}\s*\)?\s*9?\s*\d{4}[-\s.]?\d{4}/g, // BR/AR sem prefixo
    /\d{10,13}/g,                                   // dígitos puros
  ];

  for (const re of patterns) {
    const matches = text.match(re) || [];
    for (const m of matches) {
      const normalized = normalizePhone(m);
      if (normalized) return { normalized, hasShortPhone: false };
    }
  }

  // Fallback: pega o maior bloco de dígitos da mensagem
  const allDigits = text.replace(/\D/g, "");
  const normalized = normalizePhone(allDigits);
  if (normalized) return { normalized, hasShortPhone: false };

  // Se tinha algum número curto (8-9 dígitos), é provável telefone sem DDD
  return { normalized: null, hasShortPhone: allDigits.length >= 8 && allDigits.length <= 9 };
}

// Extrai nome plausível removendo dígitos e palavras-stop comuns.
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
  // Pega no máximo 4 palavras (nome + sobrenome)
  return cleaned.split(/\s+/).slice(0, 4).join(" ");
}

// Faz upsert do lead anônimo / identificado pelo session_id.
// Se identifiedData fornecido com nome+telefone válidos, "promove" o lead.
async function upsertLeadBySession(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  patch: Record<string, unknown>,
): Promise<string | null> {
  if (!sessionId) return null;
  try {
    // Tenta UPDATE primeiro (lead já existe)
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

    // Insere novo lead anônimo/identificado
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

    // ============= ACTION: submit_lead (formulário inline do gate) =============
    if (action === "submit_lead") {
      if (!sessionId || !nome || !telefone) {
        return new Response(
          JSON.stringify({ success: false, error: "missing_fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const cleanName = String(nome).trim().slice(0, 80);
      if (cleanName.length < 2) {
        return new Response(
          JSON.stringify({ success: false, error: "invalid_name" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const normalizedPhone = normalizePhone(telefone);
      if (!normalizedPhone) {
        return new Response(
          JSON.stringify({ success: false, error: "invalid_phone" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const leadId = await upsertLeadBySession(supabase, sessionId, {
        nome: cleanName,
        telefone: normalizedPhone,
        status: "novo",
      });
      if (!leadId) {
        return new Response(
          JSON.stringify({ success: false, error: "save_failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, lead_id: leadId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userMessage = messages?.[messages.length - 1]?.content || "";

    // Step 1: Extract intent + filters using AI with conversation context
    const recentMessages = messages.slice(-6);
    const conversationContext = recentMessages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
      .join("\n");

    const filterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: FILTER_EXTRACTION_PROMPT },
          { role: "user", content: `Histórico da conversa:\n${conversationContext}\n\nÚltima mensagem do usuário: ${userMessage}` },
        ],
        temperature: 0.1,
      }),
    });

    const filterData = await filterResponse.json();
    let filterText = filterData.choices?.[0]?.message?.content || "{}";
    filterText = filterText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let filters: SearchFilters & { intent?: string; is_greeting?: boolean } = {};
    try {
      filters = JSON.parse(filterText);
    } catch {
      filters = {};
    }

    console.log("Extracted intent+filters:", JSON.stringify(filters));

    // If intent is conversation, skip DB query entirely
    const isConversation = filters.intent === "conversation";

    if (isConversation) {
      // Verifica se já existe lead identificado nessa sessão (pra contexto da MarIA)
      const { data: existingForCtx } = sessionId
        ? await supabase.from("leads_maria").select("id, nome, telefone").eq("session_id", sessionId).maybeSingle()
        : { data: null };
      const alreadyCaptured = !!clientLeadCaptured || !!(existingForCtx?.nome && existingForCtx?.telefone);

      // ⚡ PRÉ-PARSER DETERMINÍSTICO: tenta capturar nome+telefone da última msg
      // ANTES de chamar o LLM. Isso elimina o bug do "falta DDD" em números válidos.
      if (!alreadyCaptured && sessionId) {
        const phoneInfo = extractPhoneFromText(userMessage);
        // Tenta combinar com mensagens recentes do usuário (caso tenha mandado nome em msg anterior)
        const recentUserMsgs = messages
          .filter((m: { role: string }) => m.role === "user")
          .slice(-3)
          .map((m: { content: string }) => m.content)
          .join(" ");
        const nameCandidate = extractNameFromText(userMessage) || extractNameFromText(recentUserMsgs);

        if (phoneInfo.normalized && nameCandidate) {
          // Captura completa! Salva direto e responde.
          const leadId = await upsertLeadBySession(supabase, sessionId, {
            nome: nameCandidate,
            telefone: phoneInfo.normalized,
            mensagem_original: recentUserMsgs.slice(0, 500),
            status: "novo",
          });
          if (leadId) {
            const reply = `Salvo, ${nameCandidate.split(" ")[0]}! 🎉 Vou te avisar em primeira mão pelo WhatsApp assim que aparecer um imóvel desse perfil. Quer que eu já liste outras opções pra você dar uma olhada agora?`;
            await saveLastConversationTurn(supabase, leadId, userMessage, reply);
            return new Response(
              JSON.stringify({
                reply, properties: [], all_properties: [], filters_used: {},
                results_count: 0, broader_search: false, lead_saved: true,
                show_results: false, clear_results: false,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        if (phoneInfo.normalized && !nameCandidate) {
          // Só telefone — salva e pede o nome
          await upsertLeadBySession(supabase, sessionId, {
            telefone: phoneInfo.normalized,
            mensagem_original: recentUserMsgs.slice(0, 500),
          });
          const reply = "Anotei o WhatsApp! 📲 Só me diz seu **nome** que eu finalizo seu cadastro e já te aviso assim que rolar novidade.";
          const { data: lead } = await supabase.from("leads_maria").select("id").eq("session_id", sessionId).maybeSingle();
          if (lead?.id) await saveLastConversationTurn(supabase, lead.id, userMessage, reply);
          return new Response(
            JSON.stringify({
              reply, properties: [], all_properties: [], filters_used: {},
              results_count: 0, broader_search: false, lead_saved: false,
              show_results: false, clear_results: false,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Generate conversational response without any property context
      const conversationMessages = [
        { role: "system", content: SYSTEM_PROMPT + "\n\nEsta mensagem NÃO é uma busca de imóveis. É uma mensagem conversacional. Use [NO_RESULTS_YET] obrigatoriamente. NÃO mencione imóveis encontrados, NÃO mostre resultados. Responda de forma natural e amigável." },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: conversationMessages,
          temperature: 0.7,
        }),
      });

      const aiData = await aiResponse.json();
      let assistantMessage = aiData.choices?.[0]?.message?.content || "Desculpe, tive um problema. Pode tentar novamente?";

      // Strip any markers
      assistantMessage = assistantMessage.replace(/^\[(SHOW_RESULTS|NO_RESULTS_YET)\]\s*/g, "");

      // Handle lead capture even in conversation mode
      let leadSaved = false;
      const leadMatch = assistantMessage.match(/\[LEAD_CAPTURE\]\s*(\{[^}]+\})/);
      if (leadMatch) {
        try {
          const leadData = JSON.parse(leadMatch[1]);
          // Tenta o telefone do JSON; se inválido, faz fallback pra mensagem do usuário
          const normalizedPhone = normalizePhone(leadData.telefone) || extractPhoneFromText(userMessage).normalized;
          if (!normalizedPhone) {
            // Telefone realmente inválido — não salva, devolve mensagem pedindo de novo
            assistantMessage = "Quase lá! 😊 Pra eu te avisar pelo WhatsApp preciso do número com DDD. Ex: 47 99999-8888 (ou +54 11 1234-5678 pra Argentina).";
          } else {
            const previousFilters = messages
              .filter((m: { role: string }) => m.role === "user")
              .map((m: { content: string }) => m.content)
              .join(" ");
            const leadId = await upsertLeadBySession(supabase, sessionId, {
              nome: leadData.nome,
              telefone: normalizedPhone,
              interesse: leadData.interesse || null,
              bairro_interesse: leadData.bairro || null,
              tipo_imovel: leadData.tipo || null,
              faixa_preco: leadData.faixa_preco || null,
              mensagem_original: previousFilters || messages[0]?.content || null,
              status: "novo",
            });
            if (leadId) {
              leadSaved = true;
              console.log("Lead promoted:", leadData.nome);
            }
          }
        } catch (e) { console.error("Failed to parse lead:", e); }
        assistantMessage = assistantMessage.replace(/\[LEAD_CAPTURE\]\s*\{[^}]+\}/, "").trim();
      }

      // Salvar turn de conversa (mesmo anônimo) se já existir lead pra essa sessão
      if (sessionId) {
        const { data: existingLead } = await supabase
          .from("leads_maria").select("id").eq("session_id", sessionId).maybeSingle();
        if (existingLead?.id) {
          await saveLastConversationTurn(supabase, existingLead.id, userMessage, assistantMessage);
        }
      }

      return new Response(
        JSON.stringify({
          reply: assistantMessage,
          properties: [],
          all_properties: [],
          filters_used: {},
          results_count: 0,
          broader_search: false,
          lead_saved: leadSaved,
          show_results: false,
          clear_results: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- SEARCH INTENT: proceed with DB query ---

    // Validate and fix enum values
    const validFinalidades = ["compra", "aluguel_anual", "temporada"];
    const validTipos = ["apartamento", "casa", "cobertura", "terreno", "sobrado", "studio", "pousada", "sala_comercial", "outro"];

    if (filters.finalidade && !validFinalidades.includes(filters.finalidade)) {
      const match = validFinalidades.find(v => filters.finalidade!.includes(v.slice(0, 4)) || v.includes(filters.finalidade!.slice(0, 4)));
      filters.finalidade = match || undefined;
    }

    if (filters.tipo && !validTipos.includes(filters.tipo)) {
      const match = validTipos.find(v => filters.tipo!.includes(v.slice(0, 4)) || v.includes(filters.tipo!.slice(0, 4)));
      filters.tipo = match || undefined;
    }

    if (filters.tipo_included && Array.isArray(filters.tipo_included)) {
      filters.tipo_included = filters.tipo_included
        .map(t => validTipos.includes(t) ? t : validTipos.find(v => t.includes(v.slice(0, 4)) || v.includes(t.slice(0, 4))) || null)
        .filter((t): t is string => t !== null);
      if (filters.tipo_included.length === 0) delete filters.tipo_included;
    }

    if (filters.tipo_excluded && Array.isArray(filters.tipo_excluded)) {
      filters.tipo_excluded = filters.tipo_excluded
        .map(t => validTipos.includes(t) ? t : validTipos.find(v => t.includes(v.slice(0, 4)) || v.includes(t.slice(0, 4))) || null)
        .filter((t): t is string => t !== null);
      if (filters.tipo_excluded.length === 0) delete filters.tipo_excluded;
    }

    if (filters.tipo_included && filters.tipo_included.length > 0) {
      delete filters.tipo;
    }

    // Step 2: Query the database
    let query = supabase
      .from("imoveis")
      .select("*")
      .eq("status", "ativo");

    if (filters.finalidade) query = query.eq("finalidade", filters.finalidade);

    if (filters.tipo_included && filters.tipo_included.length > 0) {
      query = query.in("tipo", filters.tipo_included);
    } else if (filters.tipo) {
      query = query.eq("tipo", filters.tipo);
    }

    if (filters.tipo_excluded && filters.tipo_excluded.length > 0) {
      for (const excluded of filters.tipo_excluded) {
        query = query.neq("tipo", excluded);
      }
    }

    if (filters.bairro) query = query.ilike("bairro", `%${filters.bairro}%`);
    if (filters.quartos) query = query.gte("quartos", filters.quartos);
    if (filters.banheiros) query = query.gte("banheiros", filters.banheiros);
    if (filters.vagas_garagem) query = query.gte("vagas_garagem", filters.vagas_garagem);
    if (filters.capacidade_pessoas) query = query.gte("capacidade_pessoas", filters.capacidade_pessoas);

    if (filters.preco_max || filters.preco_min) {
      if (filters.finalidade === "temporada") {
        if (filters.preco_max) query = query.lte("preco_temporada_diaria", filters.preco_max);
        if (filters.preco_min) query = query.gte("preco_temporada_diaria", filters.preco_min);
      } else {
        if (filters.preco_max) query = query.lte("preco", filters.preco_max);
        if (filters.preco_min) query = query.gte("preco", filters.preco_min);
      }
    }

    const booleanFields = ["piscina", "vista_mar", "frente_mar", "mobiliado", "aceita_pet", "churrasqueira", "ar_condicionado", "wifi"] as const;
    for (const field of booleanFields) {
      if (filters[field] === true) query = query.eq(field, true);
    }

    query = query.order("destaque", { ascending: false }).limit(10);

    const { data: properties, error: dbError } = await query;
    if (dbError) { console.error("Database error:", dbError); throw new Error("Erro ao buscar imóveis"); }

    console.log(`Found ${properties?.length || 0} properties`);

    // Step 3: Broader search fallback
    let broaderProperties: typeof properties = [];
    let usedBroaderSearch = false;

    if (!properties || properties.length === 0) {
      let broaderQuery = supabase.from("imoveis").select("*").eq("status", "ativo");
      if (filters.finalidade) broaderQuery = broaderQuery.eq("finalidade", filters.finalidade);
      if (filters.tipo_excluded && filters.tipo_excluded.length > 0) {
        for (const excluded of filters.tipo_excluded) {
          broaderQuery = broaderQuery.neq("tipo", excluded);
        }
      }
      const { data: broader } = await broaderQuery.order("destaque", { ascending: false }).limit(10);
      broaderProperties = broader || [];
      usedBroaderSearch = broaderProperties.length > 0;
    }

    const resultsToUse = properties && properties.length > 0 ? properties : broaderProperties;

    // PRÉ-CADASTRO ANÔNIMO: cria/atualiza lead vinculado à sessão com o contexto da busca
    if (sessionId) {
      const faixaPreco = filters.preco_max
        ? `até ${filters.preco_max}`
        : filters.preco_min ? `a partir de ${filters.preco_min}` : null;
      await upsertLeadBySession(supabase, sessionId, {
        interesse: filters.finalidade ?? null,
        bairro_interesse: filters.bairro ?? null,
        tipo_imovel: filters.tipo ?? (filters.tipo_included?.[0] ?? null),
        faixa_preco: faixaPreco,
        mensagem_original: userMessage,
      });
    }

    // 🚪 GATE DE CAPTAÇÃO: se já há resultados E o lead ainda não foi identificado,
    // mostra apenas o 1º imóvel como teaser e segura o resto até pegar nome+WhatsApp.
    let leadAlreadyCaptured = !!clientLeadCaptured;
    if (!leadAlreadyCaptured && sessionId) {
      const { data: leadRow } = await supabase
        .from("leads_maria")
        .select("nome, telefone")
        .eq("session_id", sessionId)
        .maybeSingle();
      leadAlreadyCaptured = !!(leadRow?.nome && leadRow?.telefone);
    }
    const gateActive = !leadAlreadyCaptured && resultsToUse.length >= 2;

    // Step 4: Generate conversational response
    let typeNote = "";
    if (filters.tipo_included && filters.tipo_included.length > 1 && resultsToUse.length > 0) {
      const foundTypes = new Set(resultsToUse.map((p: Record<string, unknown>) => p.tipo));
      const missingTypes = filters.tipo_included.filter(t => !foundTypes.has(t));
      if (missingTypes.length > 0) {
        typeNote = `\n\nNOTA IMPORTANTE: O usuário pediu os tipos [${filters.tipo_included.join(", ")}], mas NÃO foram encontrados imóveis do tipo [${missingTypes.join(", ")}]. Informe isso claramente ao usuário.`;
      }
    }

    let exclusionNote = "";
    if (filters.tipo_excluded && filters.tipo_excluded.length > 0) {
      exclusionNote = `\n\nALERTA: O usuário EXCLUIU os tipos [${filters.tipo_excluded.join(", ")}]. NUNCA sugira esses tipos.`;
    }

    const gateNote = gateActive
      ? `\n\n🚪 GATE_ATIVO: Encontramos ${resultsToUse.length} imóveis ótimos. Você vai mostrar APENAS 1 (o primeiro = teaser) e segurar os outros ${resultsToUse.length - 1} atrás de uma CTA forte de captação. Use [SHOW_RESULTS] (vou mostrar 1 card). Mensagem deve: (1) celebrar que achou ${resultsToUse.length} opções pro perfil, (2) mostrar o teaser, (3) usar gatilho de escassez/exclusividade pedindo nome + WhatsApp pra liberar o resto. NUNCA peça e-mail. Tom humano e empolgado, sem soar robô.`
      : leadAlreadyCaptured && resultsToUse.length > 0
      ? `\n\n✅ LEAD_CAPTURADO: Esse usuário já é cadastrado. Só apresente os resultados naturalmente. NÃO peça contato de novo.`
      : "";

    const propertyContext = resultsToUse.length > 0
      ? `\n\nResultados encontrados (${resultsToUse.length} imóveis):\n${JSON.stringify(resultsToUse, null, 2)}${usedBroaderSearch ? "\n\nNOTA: A busca exata não retornou resultados. Estes são resultados de uma busca mais ampla (respeitando exclusões). Informe ao usuário e sugira ajustes nos filtros." : ""}${gateNote}${typeNote}${exclusionNote}`
      : `\n\n🚨 SEM_RESULTADOS: Nenhum imóvel encontrado (nem ampliando). Use [NO_RESULTS_YET]. Seja honesta, acolhedora e ATAQUE COM CTA FORTE de captação seguindo o exemplo do prompt. NÃO invente imóveis.${exclusionNote}`;

    const conversationMessages = [
      { role: "system", content: SYSTEM_PROMPT + propertyContext },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: conversationMessages,
        temperature: 0.7,
      }),
    });

    const aiData = await aiResponse.json();
    let assistantMessage = aiData.choices?.[0]?.message?.content || "Desculpe, tive um problema ao processar sua busca. Pode tentar novamente?";

    // Check for show_results flag
    let showResults = true;
    if (assistantMessage.startsWith("[NO_RESULTS_YET]")) {
      showResults = false;
      assistantMessage = assistantMessage.replace(/^\[NO_RESULTS_YET\]\s*/, "");
    } else if (assistantMessage.startsWith("[SHOW_RESULTS]")) {
      showResults = true;
      assistantMessage = assistantMessage.replace(/^\[SHOW_RESULTS\]\s*/, "");
    }

    // Handle lead capture (promote anonymous lead -> identified)
    let leadSaved = false;
    const leadMatch = assistantMessage.match(/\[LEAD_CAPTURE\]\s*(\{[^}]+\})/);
    if (leadMatch) {
      try {
        const leadData = JSON.parse(leadMatch[1]);
        const normalizedPhone = normalizePhone(leadData.telefone) || extractPhoneFromText(userMessage).normalized;
        if (!normalizedPhone) {
          assistantMessage = "Quase lá! 😊 Pra eu te avisar pelo WhatsApp preciso do número com DDD. Ex: 47 99999-8888 (ou +54 11 1234-5678 pra Argentina).";
        } else {
          const previousFilters = messages
            .filter((m: { role: string }) => m.role === "user")
            .map((m: { content: string }) => m.content)
            .join(" ");
          const leadId = await upsertLeadBySession(supabase, sessionId, {
            nome: leadData.nome,
            telefone: normalizedPhone,
            interesse: filters.finalidade || leadData.interesse || null,
            bairro_interesse: filters.bairro || leadData.bairro || null,
            tipo_imovel: filters.tipo || leadData.tipo || null,
            faixa_preco: filters.preco_max ? `até ${filters.preco_max}` : filters.preco_min ? `a partir de ${filters.preco_min}` : leadData.faixa_preco || null,
            mensagem_original: previousFilters || messages[0]?.content || null,
            status: "novo",
          });
          if (leadId) {
            leadSaved = true;
            console.log("Lead promoted:", leadData.nome);
          }
        }
      } catch (e) { console.error("Failed to parse lead:", e); }
      assistantMessage = assistantMessage.replace(/\[LEAD_CAPTURE\]\s*\{[^}]+\}/, "").trim();
    }

    // Salva turn de conversa vinculada ao lead (anônimo ou identificado)
    if (sessionId) {
      const { data: existingLead } = await supabase
        .from("leads_maria").select("id").eq("session_id", sessionId).maybeSingle();
      if (existingLead?.id) {
        await saveLastConversationTurn(supabase, existingLead.id, userMessage, assistantMessage);
      }
    }

    // Fetch agency config for "gestão própria" override
    const { data: agencyConfig } = await supabase
      .from("config_imobiliaria")
      .select("nome, whatsapp")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Build property list for response
    const allProperties = resultsToUse.map((p: Record<string, unknown>) => {
      const isGestaoPropria = p.gestao_propria === true;
      return {
        id: p.id,
        titulo: p.titulo,
        bairro: p.bairro,
        finalidade: p.finalidade,
        tipo: p.tipo,
        preco: p.preco,
        preco_temporada_diaria: p.preco_temporada_diaria,
        quartos: p.quartos,
        suites: p.suites,
        banheiros: p.banheiros,
        vagas_garagem: p.vagas_garagem,
        area_m2: p.area_m2,
        capacidade_pessoas: p.capacidade_pessoas,
        piscina: p.piscina,
        vista_mar: p.vista_mar,
        frente_mar: p.frente_mar,
        mobiliado: p.mobiliado,
        churrasqueira: p.churrasqueira,
        ar_condicionado: p.ar_condicionado,
        wifi: p.wifi,
        aceita_pet: p.aceita_pet,
        fotos: p.fotos,
        link_anuncio: isGestaoPropria ? null : p.link_anuncio,
        anunciante_telefone: isGestaoPropria && agencyConfig?.whatsapp
          ? agencyConfig.whatsapp
          : p.anunciante_telefone,
        gestao_propria: isGestaoPropria,
        imobiliaria_nome: isGestaoPropria ? agencyConfig?.nome ?? null : null,
      };
    });

    // Se o gate ainda está ativo (lead não capturado nessa request), mostra só 1 imóvel teaser.
    // Se o lead foi capturado nessa mesma request, libera tudo.
    const gateStillActive = gateActive && !leadSaved;
    const initialBatch = gateStillActive ? 1 : 3;

    return new Response(
      JSON.stringify({
        reply: assistantMessage,
        properties: showResults ? allProperties.slice(0, initialBatch) : [],
        all_properties: showResults ? allProperties : [],
        filters_used: filters,
        results_count: showResults ? resultsToUse.length : 0,
        broader_search: usedBroaderSearch,
        lead_saved: leadSaved,
        lead_captured: leadAlreadyCaptured || leadSaved,
        gate_active: gateStillActive,
        show_results: showResults,
        clear_results: !showResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in maria-search:", error);
    return new Response(
      JSON.stringify({
        reply: "Desculpe, ocorreu um erro. Pode tentar novamente em instantes? 😊",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
