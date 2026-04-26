import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTRACTION_SYSTEM_PROMPT = `Você é um especialista em extrair dados de anúncios de imóveis em Bombinhas/SC.
Recebe o conteúdo (markdown) de um anúncio (Airbnb, OLX, ZAP, VivaReal, Instagram, etc) e extrai os campos estruturados.
Seja conservador: se não tiver certeza de um campo, deixe-o nulo. Não invente dados.
Bairros válidos em Bombinhas: Bombas, Centro, Mariscal, Zimbros, Canto Grande, Morrinhos, Quatro Ilhas, Praia da Conceição.
Para finalidade: "temporada" = aluguel por dias/semanas (Airbnb/Booking), "aluguel_anual" = contrato anual, "compra" = venda.
Para tipo: apartamento, casa, cobertura, terreno, sobrado, studio, pousada, sala_comercial, outro.
Preço: extraia o valor numérico (sem R$, sem pontos, sem vírgulas). Se for diária (temporada), use preco_temporada_diaria. Se for mensal (anual) ou total (compra), use preco.`;

interface ExtractionRequest {
  url?: string;
  text?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ExtractionRequest = await req.json();
    const { url, text } = body;

    if (!url && !text) {
      return new Response(
        JSON.stringify({ error: "Forneça um link (url) ou descrição (text)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let content = text || "";
    let sourceUrl = url || null;
    let scrapedImages: string[] = [];

    // Step 1: If URL provided, scrape with Firecrawl
    if (url) {
      const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (!firecrawlKey) {
        return new Response(
          JSON.stringify({ error: "FIRECRAWL_API_KEY não configurada. Conecte o Firecrawl em Connectors." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Scraping URL with Firecrawl:", url);

      const scrapeRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeRes.json();

      if (!scrapeRes.ok) {
        console.error("Firecrawl error:", scrapeData);
        const friendly = scrapeRes.status === 402
          ? "Sem créditos no Firecrawl. Recarregue ou descreva o imóvel manualmente."
          : `Não consegui acessar este link (${scrapeRes.status}). Tente colar o texto do anúncio.`;
        return new Response(
          JSON.stringify({ error: friendly }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Firecrawl v2 returns { success, data: { markdown, metadata, links, ... } }
      const scrapedMd = scrapeData?.data?.markdown || scrapeData?.markdown || "";
      const links = scrapeData?.data?.links || scrapeData?.links || [];
      
      if (!scrapedMd || scrapedMd.length < 100) {
        return new Response(
          JSON.stringify({ error: "Não consegui extrair conteúdo desse link. Tente colar o texto." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract image URLs from markdown
      const imgMatches = scrapedMd.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g);
      for (const m of imgMatches) {
        if (scrapedImages.length < 10) scrapedImages.push(m[1]);
      }

      // Truncate markdown to keep AI request manageable
      content = scrapedMd.slice(0, 12000);
    }

    // Step 2: Extract structured data with Lovable AI (tool calling)
    console.log("Extracting structured data with AI, content length:", content.length);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Extraia os dados estruturados deste anúncio de imóvel${sourceUrl ? ` (origem: ${sourceUrl})` : ""}:\n\n${content}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_property",
              description: "Extrai dados estruturados de um anúncio de imóvel",
              parameters: {
                type: "object",
                properties: {
                  titulo: { type: "string", description: "Título curto e descritivo do imóvel" },
                  descricao: { type: "string", description: "Descrição completa, 2-4 frases" },
                  finalidade: { type: "string", enum: ["temporada", "aluguel_anual", "compra"] },
                  tipo: { type: "string", enum: ["apartamento", "casa", "cobertura", "terreno", "sobrado", "studio", "pousada", "sala_comercial", "outro"] },
                  bairro: { type: "string", description: "Bairro de Bombinhas (ou null)" },
                  endereco: { type: "string", description: "Endereço/rua se disponível" },
                  quartos: { type: "number" },
                  suites: { type: "number" },
                  banheiros: { type: "number" },
                  vagas_garagem: { type: "number" },
                  area_m2: { type: "number" },
                  capacidade_pessoas: { type: "number", description: "Capacidade para temporada" },
                  preco: { type: "number", description: "Preço de venda ou aluguel mensal (R$)" },
                  preco_temporada_diaria: { type: "number", description: "Diária para temporada (R$)" },
                  mobiliado: { type: "boolean" },
                  piscina: { type: "boolean" },
                  vista_mar: { type: "boolean" },
                  frente_mar: { type: "boolean" },
                  churrasqueira: { type: "boolean" },
                  ar_condicionado: { type: "boolean" },
                  aceita_pet: { type: "boolean" },
                  wifi: { type: "boolean" },
                  estacionamento: { type: "boolean" },
                },
                required: ["titulo", "finalidade", "tipo"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_property" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Lovable Cloud." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Falha ao processar com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "Não consegui extrair dados estruturados do conteúdo." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let extracted: Record<string, unknown> = {};
    try {
      extracted = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool arguments:", e);
      return new Response(
        JSON.stringify({ error: "Falha ao interpretar dados extraídos" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...extracted,
          link_anuncio: sourceUrl,
          fotos: scrapedImages,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-property-from-link error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
