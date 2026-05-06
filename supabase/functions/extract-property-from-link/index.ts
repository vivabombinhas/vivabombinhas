import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const EXTRACTION_SYSTEM_PROMPT = `Você é um extrator especialista em anúncios de imóveis em Bombinhas/SC.
Receberá o conteúdo (markdown + HTML parcial) de um anúncio (Airbnb, OLX, ZAP, VivaReal, Booking, Instagram, sites de imobiliárias, etc).

REGRAS GERAIS:
- Seja AGRESSIVO em extrair dados que aparecem explicitamente. Não seja conservador demais.
- Se um valor aparece claro no texto (ex: "3 quartos", "R$ 450.000", "120m²"), EXTRAIA.
- Apenas deixe nulo se realmente não houver pista alguma. Não invente.
- Bairros válidos em Bombinhas: Bombas, Centro, Mariscal, Zimbros, Canto Grande, Morrinhos, Quatro Ilhas, Praia da Conceição, Praia de Bombinhas. Normalize variações (ex: "Praia de Mariscal" → "Mariscal").

FINALIDADE:
- "temporada" = aluguel por dias/semanas (Airbnb, Booking, "diária", "por noite", "fim de semana")
- "aluguel_anual" = contrato mensal/anual ("aluguel mensal", "anual", "fiador")
- "compra" = venda ("à venda", "vende-se", "venda")

TIPO: apartamento, casa, cobertura, terreno, sobrado, studio, pousada, sala_comercial, outro.

PREÇO (campos numéricos sem R$, sem pontos, sem vírgulas — use ponto decimal):
- "preco" = preço de venda (compra) OU aluguel mensal (aluguel_anual). Ex: "R$ 1.250.000" → 1250000.
- "preco_temporada_diaria" = diária para temporada. Ex: "R$ 800/noite" → 800.
- Se houver faixa, use o MENOR valor da faixa.

CONTATO: extraia anunciante_nome, anunciante_telefone (só dígitos com DDD, ex: 47999998888), anunciante_email, imobiliaria.

DESCRIÇÃO: gere um resumo 2-4 frases destacando diferenciais (não copie tudo).

CARACTERÍSTICAS booleanas: marque true SE mencionado explicitamente. False só se mencionado que NÃO tem (ex: "não aceita pet"). Caso contrário, deixe undefined.`;

interface ExtractionRequest {
  url?: string;
  text?: string;
}

// Filtra fotos: remove ícones, logos, avatars, placeholders, sprites
function isLikelyPropertyPhoto(url: string): boolean {
  const u = url.toLowerCase();
  
  // Ignore base64 data URLs if they are small (placeholders)
  if (u.startsWith("data:image")) {
    // If it's a very short data URL, it's definitely a placeholder
    return u.length > 2000; 
  }

  // Remove obvious non-photo URLs
  const badPatterns = [
    "logo", "icon", "avatar", "favicon", "sprite", "placeholder",
    "/static/", "/assets/icons", "share-", "social-", "/badges/",
    "google-play", "app-store", "whatsapp.svg", "pixel.gif",
    "1x1", "spacer", "blank.", "loading.", "/flags/", "/emoji",
    "marker", "map", "pin", "heart", "star",
  ];
  if (badPatterns.some((p) => u.includes(p))) return false;

  // Must be image extension or common CDN pattern
  const goodExt = /\.(jpe?g|png|webp|avif)(\?|$|#)/i.test(u);
  const cdnPatterns = [
    "muscache.com", "olx.", "zap", "vivareal", "imovelweb", "booking.com", 
    "cloudfront", "cloudinary", "imgur", "cdn", "images", "img.", "foto"
  ];
  const looksLikeCdn = cdnPatterns.some((p) => u.includes(p));

  if (!goodExt && !looksLikeCdn) return false;

  // Reject tiny images by URL hint (e.g., w=50, 64x64)
  if (/[?&](w|width)=([1-9]?\d)(&|$)/i.test(u)) return false; // width < 100
  if (/\b(32x32|64x64|100x100|50x50)\b/.test(u)) return false;

  return true;
}

function dedupeAndFilterPhotos(urls: string[], max = 30): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    if (!raw) continue;
    // Normalize: remove tracking params noise but keep core URL
    const url = raw.trim().split("#")[0];
    const key = url.split("?")[0].toLowerCase();
    if (seen.has(key)) continue;
    if (!isLikelyPropertyPhoto(url)) continue;
    seen.add(key);
    out.push(url);
    if (out.length >= max) break;
  }
  return out;
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

    // Step 1: Scrape with Firecrawl (markdown + html for richer extraction)
    if (url) {
      const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (!firecrawlKey) {
        return new Response(
          JSON.stringify({ error: "FIRECRAWL_API_KEY não configurada. Conecte o Firecrawl em Connectors." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Scraping URL with Firecrawl:", url);

      async function doScrape(onlyMain: boolean, waitFor: number) {
        return await fetch("https://api.firecrawl.dev/v2/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["markdown", "html"],
            onlyMainContent: onlyMain,
            waitFor,
            timeout: 45000,
          }),
        });
      }

      let scrapeRes = await doScrape(true, 2500);
      let scrapeData: any = null;
      
      try {
        scrapeData = await scrapeRes.json();
      } catch (e) {
        console.error("Failed to parse Firecrawl response:", e);
      }

      if (!scrapeRes.ok) {
        console.error("Firecrawl error:", scrapeRes.status, scrapeData);
        
        // Fallback: Try a direct fetch if Firecrawl is out of credits or failing
        console.log("Attempting direct fetch fallback...");
        try {
          const directRes = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            },
          });
          
          if (directRes.ok) {
            const html = await directRes.text();
            console.log("Direct fetch successful, HTML length:", html.length);
            scrapeData = { data: { html, markdown: "" } };
            scrapeRes = { ok: true } as any;
          } else if (scrapeRes.status === 402) {
            return new Response(
              JSON.stringify({ error: "Sem créditos no Firecrawl. Recarregue ou descreva o imóvel manualmente." }),
              { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (directErr) {
          console.error("Direct fetch also failed:", directErr);
          if (scrapeRes.status === 402) {
            return new Response(
              JSON.stringify({ error: "Sem créditos no Firecrawl. Recarregue ou descreva o imóvel manualmente." }),
              { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      let scrapedMd: string = scrapeData?.data?.markdown || scrapeData?.markdown || "";
      let scrapedHtml: string = scrapeData?.data?.html || scrapeData?.html || "";

      // Retry without onlyMainContent if content too short (some sites strip everything)
      if (scrapedMd.length < 200) {
        console.log("Content too short, retrying without onlyMainContent. Length:", scrapedMd.length);
        scrapeRes = await doScrape(false, 5000);
        scrapeData = await scrapeRes.json();
        if (scrapeRes.ok) {
          scrapedMd = scrapeData?.data?.markdown || scrapeData?.markdown || scrapedMd;
          scrapedHtml = scrapeData?.data?.html || scrapeData?.html || scrapedHtml;
        }
      }

      // Fallback: derive text from HTML if markdown still weak
      if (scrapedMd.length < 200 && scrapedHtml) {
        const stripped = scrapedHtml
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (stripped.length > scrapedMd.length) {
          console.log("Using HTML-derived text fallback. Length:", stripped.length);
          scrapedMd = stripped;
        }
      }

      if (!scrapedMd || scrapedMd.length < 80) {
        return new Response(
          JSON.stringify({ error: "Não consegui extrair conteúdo desse link. Tente colar o texto do anúncio no campo de descrição." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract image URLs from markdown
      const candidateImages: string[] = [];
      for (const m of scrapedMd.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g)) {
        candidateImages.push(m[1]);
      }
      
      // Extract from HTML with relative URL resolution
      if (scrapedHtml && sourceUrl) {
        const baseUrl = new URL(sourceUrl);
        
        // Find all img tags and look for src, data-src, data-lazy, etc.
        const imgRegex = /<img[^>]+(?:src|data-src|data-lazy|data-original|data-srcset)=["']([^"']+)["']/gi;
        let match;
        while ((match = imgRegex.exec(scrapedHtml)) !== null) {
          let imgUrl = match[1];
          try {
            // Resolve relative URLs
            if (imgUrl.startsWith("//")) {
              imgUrl = baseUrl.protocol + imgUrl;
            } else if (imgUrl.startsWith("/")) {
              imgUrl = baseUrl.origin + imgUrl;
            } else if (!imgUrl.startsWith("http") && !imgUrl.startsWith("data:")) {
              imgUrl = new URL(imgUrl, baseUrl.origin + baseUrl.pathname).href;
            }
            candidateImages.push(imgUrl);
          } catch (e) {
            console.error("Error resolving image URL:", imgUrl, e);
          }
        }

        // srcset handling
        for (const m of scrapedHtml.matchAll(/srcset=["']([^"']+)["']/gi)) {
          const parts = m[1].split(",").map((p) => p.trim().split(" ")[0]);
          if (parts.length > 0) {
            let imgUrl = parts[parts.length - 1];
            try {
              if (imgUrl.startsWith("//")) {
                imgUrl = baseUrl.protocol + imgUrl;
              } else if (imgUrl.startsWith("/")) {
                imgUrl = baseUrl.origin + imgUrl;
              } else if (!imgUrl.startsWith("http")) {
                imgUrl = new URL(imgUrl, baseUrl.origin + baseUrl.pathname).href;
              }
              candidateImages.push(imgUrl);
            } catch (e) {}
          }
        }
        
        // OG image / meta
        for (const m of scrapedHtml.matchAll(/<meta[^>]+property=["']og:image[^"']*["'][^>]+content=["']([^"']+)["']/gi)) {
          candidateImages.unshift(m[1]); // priority
        }
      }

      scrapedImages = dedupeAndFilterPhotos(candidateImages, 40);
      console.log(`Found ${candidateImages.length} candidate images, filtered to ${scrapedImages.length}`);

      // Bigger context window for better extraction
      content = scrapedMd.slice(0, 35000);
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
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Extraia TODOS os dados estruturados deste anúncio${sourceUrl ? ` (URL: ${sourceUrl})` : ""}. Seja completo:\n\n${content}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_property",
              description: "Extrai dados estruturados completos de um anúncio de imóvel",
              parameters: {
                type: "object",
                properties: {
                  titulo: { type: "string", description: "Título curto e descritivo" },
                  descricao: { type: "string", description: "Resumo 2-4 frases destacando diferenciais" },
                  finalidade: { type: "string", enum: ["temporada", "aluguel_anual", "compra"] },
                  tipo: { type: "string", enum: ["apartamento", "casa", "cobertura", "terreno", "sobrado", "studio", "pousada", "sala_comercial", "outro"] },
                  bairro: { type: "string", description: "Bairro de Bombinhas" },
                  endereco: { type: "string", description: "Rua/endereço" },
                  quartos: { type: "number" },
                  suites: { type: "number" },
                  banheiros: { type: "number" },
                  vagas_garagem: { type: "number" },
                  area_m2: { type: "number" },
                  capacidade_pessoas: { type: "number" },
                  preco: { type: "number", description: "Venda ou aluguel mensal (R$)" },
                  preco_temporada_diaria: { type: "number", description: "Diária temporada (R$)" },
                  condominio: { type: "number", description: "Taxa mensal de condomínio (R$)" },
                  iptu_anual: { type: "number", description: "IPTU anual (R$)" },
                  mobiliado: { type: "boolean" },
                  piscina: { type: "boolean" },
                  vista_mar: { type: "boolean" },
                  frente_mar: { type: "boolean" },
                  churrasqueira: { type: "boolean" },
                  ar_condicionado: { type: "boolean" },
                  aceita_pet: { type: "boolean" },
                  wifi: { type: "boolean" },
                  estacionamento: { type: "boolean" },
                  anunciante_nome: { type: "string" },
                  anunciante_telefone: { type: "string", description: "Só dígitos com DDD" },
                  anunciante_email: { type: "string" },
                  imobiliaria: { type: "string" },
                  codigo: { type: "string", description: "Código/referência do anúncio" },
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
      console.error("No tool call in AI response:", JSON.stringify(aiData).slice(0, 1000));
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
