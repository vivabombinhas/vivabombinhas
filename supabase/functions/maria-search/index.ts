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

REGRA CRÍTICA DE FORMATAÇÃO:
- Os detalhes dos imóveis (título, preço, quartos, link, telefone) serão exibidos automaticamente em CARDS VISUAIS na interface.
- Você NÃO deve listar os detalhes dos imóveis no texto. Nada de emojis 🏠📍💰🛏️🔗📞 seguidos de dados.
- Escreva APENAS uma introdução curta e natural sobre os resultados encontrados.
- Exemplo BOM: "Encontrei 2 opções de aluguel anual em Bombas dentro do seu orçamento! Dá uma olhada nos cards abaixo 👇"
- Exemplo RUIM: "🏠 **Apartamento em Bombas** 📍 Bombas 💰 R$ 2.600..." (NUNCA faça isso)
- Se houver mais resultados além dos exibidos, mencione: "Tenho mais X opções, quer ver?"
- Se não houver resultados, sugira ampliar a busca por bairro, preço ou tipo.
- Se a busca for muito ampla, faça uma pergunta curta para refinar.

Regras gerais:
- Sempre seja simpática e prestativa
- Use emojis com moderação
- NUNCA invente imóveis ou dados
- Mantenha respostas curtas (2-3 frases no máximo quando houver resultados)

Bairros de Bombinhas: Bombas, Centro, Mariscal, Zimbros, Canto Grande, Morrinhos, Quatro Ilhas, Praia da Conceição.`;

const FILTER_EXTRACTION_PROMPT = `Analise a CONVERSA COMPLETA do usuário e extraia os filtros de busca acumulados para imóveis em Bombinhas/SC.

REGRA CRÍTICA DE CONTEXTO:
- Considere TODAS as mensagens anteriores do usuário para manter o contexto.
- Se o usuário fez uma busca anterior e agora pede ajustes (ex: "mais barato", "outro bairro", "com piscina"), MANTENHA os filtros anteriores e apenas ajuste o que foi pedido.
- Exemplo: se buscou "aluguel anual em Bombas" e depois disse "tem algo mais barato?", mantenha finalidade=aluguel_anual, bairro=Bombas e reduza o preco_max.
- Se o usuário pedir "mais barato" sem um preço específico, e houve resultados anteriores, defina preco_max como um valor razoavelmente menor.
- Se o usuário iniciar uma busca completamente nova (ex: "quero comprar um terreno"), descarte os filtros anteriores.

Retorne SOMENTE um JSON válido com os filtros encontrados. Se um filtro não foi mencionado nem inferido do contexto, não inclua no JSON.

Campos possíveis:
- finalidade: "compra", "aluguel_anual" ou "temporada"
- tipo: "apartamento", "casa", "cobertura", "terreno", "sobrado", "studio", "pousada", "sala_comercial"
- bairro: nome do bairro (Bombas, Centro, Mariscal, Zimbros, Canto Grande, Morrinhos, Quatro Ilhas, Praia da Conceição)
- preco_min: valor mínimo (número)
- preco_max: valor máximo (número). "até 800 mil" = 800000, "até 3500" para aluguel = 3500, "até 500 por dia" para temporada = 500
- quartos: número de quartos
- banheiros: número de banheiros
- vagas_garagem: número de vagas
- capacidade_pessoas: número de pessoas (para temporada)
- piscina: true/false
- vista_mar: true/false
- frente_mar: true/false
- mobiliado: true/false
- aceita_pet: true/false
- churrasqueira: true/false
- ar_condicionado: true/false
- wifi: true/false
- is_greeting: true se for apenas uma saudação sem busca

Exemplos de conversa com contexto:
- Msg1: "aluguel anual em Mariscal até 3500" → {"finalidade":"aluguel_anual","bairro":"Mariscal","preco_max":3500}
- Msg2: "tem algo mais barato?" → {"finalidade":"aluguel_anual","bairro":"Mariscal","preco_max":2500}
- Msg3: "e em Bombas?" → {"finalidade":"aluguel_anual","bairro":"Bombas","preco_max":2500}

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

    // Step 1: Extract filters using AI with full conversation context
    // Build conversation context for filter extraction (last 3 user interactions)
    const recentMessages = messages.slice(-6); // Last ~3 pairs of user/assistant
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
    // Clean markdown code blocks if present
    filterText = filterText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let filters: SearchFilters & { is_greeting?: boolean } = {};
    try {
      filters = JSON.parse(filterText);
    } catch {
      filters = {};
    }

    console.log("Extracted filters:", JSON.stringify(filters));

    // Step 2: Query the database
    let query = supabase
      .from("imoveis")
      .select("*")
      .eq("status", "ativo");

    if (filters.finalidade) {
      query = query.eq("finalidade", filters.finalidade);
    }
    if (filters.tipo) {
      query = query.eq("tipo", filters.tipo);
    }
    if (filters.bairro) {
      query = query.ilike("bairro", `%${filters.bairro}%`);
    }
    if (filters.quartos) {
      query = query.gte("quartos", filters.quartos);
    }
    if (filters.banheiros) {
      query = query.gte("banheiros", filters.banheiros);
    }
    if (filters.vagas_garagem) {
      query = query.gte("vagas_garagem", filters.vagas_garagem);
    }
    if (filters.capacidade_pessoas) {
      query = query.gte("capacidade_pessoas", filters.capacidade_pessoas);
    }

    // Price filtering depends on finalidade
    if (filters.preco_max || filters.preco_min) {
      if (filters.finalidade === "temporada") {
        if (filters.preco_max) query = query.lte("preco_temporada_diaria", filters.preco_max);
        if (filters.preco_min) query = query.gte("preco_temporada_diaria", filters.preco_min);
      } else {
        if (filters.preco_max) query = query.lte("preco", filters.preco_max);
        if (filters.preco_min) query = query.gte("preco", filters.preco_min);
      }
    }

    // Boolean filters
    const booleanFields = ["piscina", "vista_mar", "frente_mar", "mobiliado", "aceita_pet", "churrasqueira", "ar_condicionado", "wifi"] as const;
    for (const field of booleanFields) {
      if (filters[field] === true) {
        query = query.eq(field, true);
      }
    }

    query = query.order("destaque", { ascending: false }).limit(10);

    const { data: properties, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Erro ao buscar imóveis");
    }

    console.log(`Found ${properties?.length || 0} properties`);

    // Step 3: If strict search found nothing, try broader search
    let broaderProperties: typeof properties = [];
    let usedBroaderSearch = false;

    if ((!properties || properties.length === 0) && !filters.is_greeting) {
      const broaderQuery = supabase
        .from("imoveis")
        .select("*")
        .eq("status", "ativo");

      if (filters.finalidade) {
        broaderQuery.eq("finalidade", filters.finalidade);
      }

      const { data: broader } = await broaderQuery
        .order("destaque", { ascending: false })
        .limit(10);

      broaderProperties = broader || [];
      usedBroaderSearch = broaderProperties.length > 0;
    }

    const resultsToUse = properties && properties.length > 0 ? properties : broaderProperties;

    // Step 4: Generate conversational response
    const propertyContext = resultsToUse.length > 0
      ? `\n\nResultados encontrados (${resultsToUse.length} imóveis):\n${JSON.stringify(resultsToUse, null, 2)}${usedBroaderSearch ? "\n\nNOTA: A busca exata não retornou resultados. Estes são resultados de uma busca mais ampla. Informe ao usuário e sugira ajustes nos filtros." : ""}`
      : filters.is_greeting
        ? "\n\nO usuário está apenas cumprimentando. Responda de forma amigável, se apresente como MarIA e pergunte como pode ajudar na busca de imóveis em Bombinhas."
        : "\n\nNenhum imóvel encontrado com os critérios informados. Sugira ao usuário ampliar a busca mudando o bairro, faixa de preço ou tipo de imóvel.";

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
    const assistantMessage = aiData.choices?.[0]?.message?.content || "Desculpe, tive um problema ao processar sua busca. Pode tentar novamente?";

    // Return top 3 properties as structured data for card rendering
    const topProperties = resultsToUse.slice(0, 3).map((p: Record<string, unknown>) => ({
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
      link_anuncio: p.link_anuncio,
      anunciante_telefone: p.anunciante_telefone,
    }));

    return new Response(
      JSON.stringify({
        reply: assistantMessage,
        properties: topProperties,
        filters_used: filters,
        results_count: resultsToUse.length,
        broader_search: usedBroaderSearch,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in maria-search:", error);
    return new Response(
      JSON.stringify({
        reply: "Desculpe, ocorreu um erro. Pode tentar novamente em instantes? 😊",
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
