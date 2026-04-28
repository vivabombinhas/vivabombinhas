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

FLUXO DE CAPTAÇÃO DE LEAD (importante!):
- Há DOIS momentos pra oferecer salvar a busca:
  (a) Após mostrar resultados de uma busca com imóveis encontrados — adicione naturalmente no final: "Se quiser, posso salvar sua busca e te avisar pelo WhatsApp quando aparecerem imóveis novos nesse perfil 💛"
  (b) Quando NÃO houver nenhum imóvel que case com a busca — aí seja proativa e direta: "Ainda não tenho exatamente isso no catálogo, mas Bombinhas recebe novidades toda semana. Posso te avisar no WhatsApp assim que chegar? Me passa seu nome e número 😊"
- NÃO ofereça em saudações, perguntas exploratórias, ou follow-ups sobre os mesmos resultados já mostrados.
- Ofereça NO MÁXIMO uma vez por conversa (não repita se já ofereceu antes).
- Se o usuário aceitar (ex: "quero", "sim", "pode salvar", "manda", "beleza", "topo"), peça os dados de forma amigável:
  "Show! 🎉 Me passa seu nome e número de WhatsApp **com DDD** (ex: 47 99999-8888) que eu salvo aqui. E-mail é opcional."
- ⚠️ VALIDAÇÃO DE TELEFONE — REGRA CRÍTICA:
  * O telefone DEVE ter DDD (10 ou 11 dígitos no total). Exemplos válidos: "47999998888", "(47) 99999-8888", "47 9 9999-8888".
  * Se o usuário mandar um número CURTO (8 ou 9 dígitos, sem DDD), NÃO confirme nem salve. Responda algo tipo:
    "Quase lá! 😊 Faltou o DDD da sua cidade. Pode me mandar o número completo? Ex: 47 99999-8888"
  * Só emita [LEAD_CAPTURE] quando tiver nome + telefone com DDD válido.
- Quando o usuário fornecer nome e telefone válidos, responda com: [LEAD_CAPTURE] seguido de um JSON com os dados. Exemplo:
  [LEAD_CAPTURE]{"nome":"João Silva","telefone":"47999998888","email":"joao@email.com","interesse":"aluguel_anual","bairro":"Bombas","tipo":"apartamento","faixa_preco":"até 3500"}
  Depois do JSON, escreva uma confirmação amigável como: "Pronto, salvei sua busca! Vou te avisar assim que surgir algo no seu perfil. 📲"
  IMPORTANTE: Inclua no JSON os campos interesse (finalidade), bairro, tipo e faixa_preco baseados no contexto da conversa anterior.
- Se o usuário fornecer dados parciais (só nome sem telefone, ou telefone sem DDD), peça o que falta de forma gentil.
- NUNCA force a captação. Se o usuário não quiser, respeite e continue ajudando normalmente.

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1]?.content || "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
          const previousFilters = messages
            .filter((m: { role: string }) => m.role === "user")
            .map((m: { content: string }) => m.content)
            .join(" ");

          const { data: leadRow, error: leadError } = await supabase
            .from("leads_maria")
            .insert({
              nome: leadData.nome,
              telefone: leadData.telefone,
              email: leadData.email || null,
              interesse: leadData.interesse || null,
              bairro_interesse: leadData.bairro || null,
              tipo_imovel: leadData.tipo || null,
              faixa_preco: leadData.faixa_preco || null,
              mensagem_original: previousFilters || messages[0]?.content || null,
              origem: "maria_chat",
            })
            .select("id")
            .single();

          if (leadError) console.error("Lead save error:", leadError);
          else {
            leadSaved = true;
            console.log("Lead saved:", leadData.nome);
            if (leadRow?.id) {
              const convRows = messages.map((m: { role: string; content: string }) => ({
                lead_id: leadRow.id,
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
              }));
              if (convRows.length) {
                const { error: convErr } = await supabase.from("lead_conversations").insert(convRows);
                if (convErr) console.error("Conv save error:", convErr);
              }
            }
          }
        } catch (e) { console.error("Failed to parse lead:", e); }
        assistantMessage = assistantMessage.replace(/\[LEAD_CAPTURE\]\s*\{[^}]+\}/, "").trim();
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

    const propertyContext = resultsToUse.length > 0
      ? `\n\nResultados encontrados (${resultsToUse.length} imóveis):\n${JSON.stringify(resultsToUse, null, 2)}${usedBroaderSearch ? "\n\nNOTA: A busca exata não retornou resultados. Estes são resultados de uma busca mais ampla (respeitando exclusões). Informe ao usuário e sugira ajustes nos filtros. Ao final, ofereça PROATIVAMENTE salvar a busca: 'Posso te avisar no WhatsApp assim que aparecer algo do jeitinho que você quer 💛 — quer que eu te avise?'" : ""}${typeNote}${exclusionNote}`
      : `\n\nNenhum imóvel encontrado com os critérios informados (nem ampliando a busca). MODO CAPTADORA ATIVADO:\n1. Use [NO_RESULTS_YET] (não há cards pra mostrar).\n2. Seja honesta e acolhedora: diga que ainda não tem nada que case 100% com o que ele quer no nosso catálogo.\n3. OFEREÇA IMEDIATAMENTE salvar a busca: 'Mas posso te avisar pelo WhatsApp assim que chegar um imóvel desse perfil 💛 Aparecem novidades quase toda semana em Bombinhas. Topa? Me passa seu nome e WhatsApp.'\n4. NÃO sugira tipos que o usuário excluiu. NÃO invente imóveis.${exclusionNote}`;

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

    // Handle lead capture
    let leadSaved = false;
    const leadMatch = assistantMessage.match(/\[LEAD_CAPTURE\]\s*(\{[^}]+\})/);
    if (leadMatch) {
      try {
        const leadData = JSON.parse(leadMatch[1]);
        const previousFilters = messages
          .filter((m: { role: string }) => m.role === "user")
          .map((m: { content: string }) => m.content)
          .join(" ");

        const { data: leadRow, error: leadError } = await supabase
          .from("leads_maria")
          .insert({
            nome: leadData.nome,
            telefone: leadData.telefone,
            email: leadData.email || null,
            interesse: filters.finalidade || leadData.interesse || null,
            bairro_interesse: filters.bairro || leadData.bairro || null,
            tipo_imovel: filters.tipo || leadData.tipo || null,
            faixa_preco: filters.preco_max ? `até ${filters.preco_max}` : filters.preco_min ? `a partir de ${filters.preco_min}` : leadData.faixa_preco || null,
            mensagem_original: previousFilters || messages[0]?.content || null,
            origem: "maria_chat",
          })
          .select("id")
          .single();

        if (leadError) console.error("Lead save error:", leadError);
        else {
          leadSaved = true;
          console.log("Lead saved:", leadData.nome);
          if (leadRow?.id) {
            const convRows = messages.map((m: { role: string; content: string }) => ({
              lead_id: leadRow.id,
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            }));
            if (convRows.length) {
              const { error: convErr } = await supabase.from("lead_conversations").insert(convRows);
              if (convErr) console.error("Conv save error:", convErr);
            }
          }
        }
      } catch (e) { console.error("Failed to parse lead:", e); }
      assistantMessage = assistantMessage.replace(/\[LEAD_CAPTURE\]\s*\{[^}]+\}/, "").trim();
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

    return new Response(
      JSON.stringify({
        reply: assistantMessage,
        properties: showResults ? allProperties.slice(0, 3) : [],
        all_properties: showResults ? allProperties : [],
        filters_used: filters,
        results_count: showResults ? resultsToUse.length : 0,
        broader_search: usedBroaderSearch,
        lead_saved: leadSaved,
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
