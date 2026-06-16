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

function isLikelyPropertyPhoto(url: string): { ok: boolean; reason: string } {
  const u = url.toLowerCase();
  if (u.startsWith("data:image")) {
    return u.length > 2000 ? { ok: true, reason: "data-url-large" } : { ok: false, reason: "data-url-placeholder" };
  }
  const badPatterns = [
    "logo", "icon", "avatar", "favicon", "sprite", "placeholder",
    "/static/", "/assets/icons", "share-", "social-", "/badges/",
    "google-play", "app-store", "whatsapp.svg", "pixel.gif",
    "1x1", "spacer", "blank.", "loading.", "/flags/", "/emoji",
    "marker", "/map", "/pin", "/heart", "/star",
    "/perfil", "/profile", "/anunciante", "/agency", "/agente",
    "/banner", "thumb-small", "_small.", "_thumb.", "small_thumb",
  ];
  for (const p of badPatterns) if (u.includes(p)) return { ok: false, reason: `bad-pattern:${p}` };

  const goodExt = /\.(jpe?g|png|webp|avif)(\?|$|#)/i.test(u);
  const cdnPatterns = ["muscache.com", "olx.", "zap", "vivareal", "imovelweb", "booking.com", "cloudfront", "cloudinary", "imgur", "cdn", "images", "img.", "foto"];
  const looksLikeCdn = cdnPatterns.some((p) => u.includes(p));
  if (!goodExt && !looksLikeCdn) return { ok: false, reason: "no-ext-no-cdn" };

  if (/[?&](w|width)=([1-9]?\d)(&|$)/i.test(u)) return { ok: false, reason: "url-width<100" };
  if (/\b(16x16|24x24|32x32|48x48|50x50|64x64|96x96|100x100|120x120|150x150)\b/.test(u)) return { ok: false, reason: "tiny-dimension" };

  return { ok: true, reason: "accepted" };
}

// Collapse known thumbnail-size variants so big/small versions of same photo dedupe together
function photoKey(url: string): string {
  let key = url.split("#")[0].split("?")[0].toLowerCase();
  key = key.replace(/[-_](\d{2,4})x(\d{2,4})(?=\.[a-z]+$)/i, "");
  key = key.replace(/\/im_w_\d+\//, "/");
  key = key.replace(/\/policy\/[^/]+\//, "/original/");
  return key;
}

function dedupeAndFilterPhotos(
  urls: string[],
  max = 30,
): { photos: string[]; logs: Array<{ url: string; status: string; reason: string }> } {
  const seen = new Set<string>();
  const out: string[] = [];
  const logs: Array<{ url: string; status: string; reason: string }> = [];
  for (const raw of urls) {
    if (!raw) continue;
    const url = raw.trim().split("#")[0];
    const check = isLikelyPropertyPhoto(url);
    if (!check.ok) { logs.push({ url, status: "excluded", reason: check.reason }); continue; }
    const key = photoKey(url);
    if (seen.has(key)) { logs.push({ url, status: "excluded", reason: "duplicate" }); continue; }
    seen.add(key);
    out.push(url);
    logs.push({ url, status: "included", reason: check.reason });
    if (out.length >= max) break;
  }
  return { photos: out, logs };
}

// Remove blocks whose class/id/aria-label hint they are related/similar/recommended content.
function stripRelatedSections(html: string): { cleaned: string; removed: number } {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  let removed = 0;
  cleaned = cleaned
    .replace(/<header\b[\s\S]*?<\/header>/gi, () => { removed++; return " "; })
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, () => { removed++; return " "; })
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, () => { removed++; return " "; })
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, () => { removed++; return " "; });

  const relatedHint = /(similar|relacionad|recomend|recommended|related|outros[-_ ]?im(o|ó)veis|veja[-_ ]?tamb|sugest|may[-_ ]?like|tamb[-_ ]?gostar|outros[-_ ]?an(uncios|úncios))/i;
  for (const tag of ["section", "div", "ul", "article"]) {
    const openRe = new RegExp(`<${tag}\\b[^>]*>`, "gi");
    let result = "";
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = openRe.exec(cleaned)) !== null) {
      if (!relatedHint.test(m[0])) continue;
      const startIdx = m.index;
      const closeRe = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
      closeRe.lastIndex = openRe.lastIndex;
      let depth = 1, endIdx = -1;
      let cm: RegExpExecArray | null;
      while ((cm = closeRe.exec(cleaned)) !== null) {
        if (cm[0].startsWith("</")) { depth--; if (depth === 0) { endIdx = cm.index + cm[0].length; break; } }
        else depth++;
        if (closeRe.lastIndex - startIdx > 300000) break;
      }
      if (endIdx > 0) {
        result += cleaned.slice(lastIndex, startIdx);
        lastIndex = endIdx;
        removed++;
        openRe.lastIndex = endIdx;
      }
    }
    result += cleaned.slice(lastIndex);
    cleaned = result;
  }
  return { cleaned, removed };
}

// Try to find the main gallery container. Returns null if not confident.
function extractGalleryHtml(html: string): { gallery: string; matchedBy: string } | null {
  const hints = [
    "property-gallery", "listing-gallery", "imovel-gallery", "image-gallery",
    "main-gallery", "gallery-main", "photo-gallery", "galeria-imovel",
    "galeria-principal", "fotos-imovel", "main-carousel", "principal-carousel",
    "swiper-main", "main-swiper", "photos-container", "gallery-container",
    "fotos-anuncio", "anuncio-fotos", "imagens-imovel", "imovel-fotos",
    "ad-gallery", "ad-photos", "lightbox-gallery", "carousel-photos",
    "carrossel-fotos",
  ];
  const hintRe = new RegExp(`(class|id|data-testid|aria-label)=["'][^"']*(${hints.join("|")})[^"']*["']`, "i");
  for (const tag of ["section", "div", "ul"]) {
    const openRe = new RegExp(`<${tag}\\b[^>]*>`, "gi");
    let m: RegExpExecArray | null;
    while ((m = openRe.exec(html)) !== null) {
      const openTag = m[0];
      if (!hintRe.test(openTag)) continue;
      const matched = openTag.match(hintRe)?.[2] || "gallery";
      const startIdx = m.index;
      const closeRe = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
      closeRe.lastIndex = openRe.lastIndex;
      let depth = 1, endIdx = -1;
      let cm: RegExpExecArray | null;
      while ((cm = closeRe.exec(html)) !== null) {
        if (cm[0].startsWith("</")) { depth--; if (depth === 0) { endIdx = cm.index + cm[0].length; break; } }
        else depth++;
        if (closeRe.lastIndex - startIdx > 500000) break;
      }
      if (endIdx > 0) return { gallery: html.slice(startIdx, endIdx), matchedBy: matched };
    }
  }
  return null;
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
    let photosConfidence: "high" | "low" = "low";
    let photosWarning: string | null = null;

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

      // ===== Image extraction scoped to the main gallery =====
      const candidateImages: string[] = [];
      const ogImages: string[] = [];

      // Always capture OG image up-front (it's usually the main listing photo)
      if (scrapedHtml) {
        for (const m of scrapedHtml.matchAll(/<meta[^>]+property=["']og:image[^"']*["'][^>]+content=["']([^"']+)["']/gi)) {
          ogImages.push(m[1]);
        }
      }

      if (scrapedHtml && sourceUrl) {
        const baseUrl = new URL(sourceUrl);
        const resolve = (raw: string): string | null => {
          try {
            let u = raw;
            if (u.startsWith("//")) u = baseUrl.protocol + u;
            else if (u.startsWith("/")) u = baseUrl.origin + u;
            else if (!u.startsWith("http") && !u.startsWith("data:")) u = new URL(u, baseUrl.origin + baseUrl.pathname).href;
            return u;
          } catch { return null; }
        };

        // 1) Strip headers/footers/nav/asides and any "similar/related/recommended" blocks
        const { cleaned, removed: removedSections } = stripRelatedSections(scrapedHtml);
        console.log(`[gallery] stripped ${removedSections} related/chrome sections`);

        // 2) Try to scope to the main gallery container; fall back to the cleaned HTML
        const gallery = extractGalleryHtml(cleaned);
        let scope: string;
        let scopeLabel: string;
        if (gallery) {
          scope = gallery.gallery;
          scopeLabel = `gallery(${gallery.matchedBy})`;
          photosConfidence = "high";
          console.log(`[gallery] matched main gallery container by "${gallery.matchedBy}"`);
        } else {
          scope = cleaned;
          scopeLabel = "cleaned-main";
          photosConfidence = "low";
          photosWarning =
            "Não foi possível identificar com segurança a galeria principal. Revise as fotos manualmente antes de salvar.";
          console.log("[gallery] no main gallery container matched — using cleaned main content");
        }

        // 3) Collect <img> with lazy-load attributes, scoped
        const imgRegex = /<img\b[^>]*>/gi;
        let tagMatch: RegExpExecArray | null;
        while ((tagMatch = imgRegex.exec(scope)) !== null) {
          const tag = tagMatch[0];
          const attrRe = /(src|data-src|data-lazy|data-original|data-large|data-full|data-zoom|data-image|data-bg)=["']([^"']+)["']/gi;
          let a: RegExpExecArray | null;
          while ((a = attrRe.exec(tag)) !== null) {
            const u = resolve(a[2]);
            if (u) candidateImages.push(u);
          }
          // srcset on this img tag — prefer the largest descriptor
          const srcsetMatch = /srcset=["']([^"']+)["']/i.exec(tag);
          if (srcsetMatch) {
            const parts = srcsetMatch[1].split(",").map((p) => p.trim());
            // pick last (usually largest)
            const last = parts[parts.length - 1]?.split(/\s+/)[0];
            if (last) { const u = resolve(last); if (u) candidateImages.push(u); }
          }
        }

        // 4) <source srcset=...> inside scoped <picture>
        for (const m of scope.matchAll(/<source\b[^>]*srcset=["']([^"']+)["'][^>]*>/gi)) {
          const parts = m[1].split(",").map((p) => p.trim().split(/\s+/)[0]);
          const last = parts[parts.length - 1];
          if (last) { const u = resolve(last); if (u) candidateImages.push(u); }
        }

        // 5) Markdown images, only if they also appear in the scope (avoid related-section markdown)
        for (const m of scrapedMd.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g)) {
          const u = m[1];
          if (scope.includes(u) || gallery === null) candidateImages.push(u);
        }

        console.log(`[gallery] scope=${scopeLabel}, raw candidates=${candidateImages.length}`);
      }

      // Always prepend OG image as a strong hint (it's the listing's hero image)
      for (const og of ogImages.reverse()) candidateImages.unshift(og);

      const { photos, logs } = dedupeAndFilterPhotos(candidateImages, 40);
      scrapedImages = photos;
      const includedCount = logs.filter((l) => l.status === "included").length;
      const excludedCount = logs.length - includedCount;
      console.log(`[gallery] photos kept=${includedCount}, excluded=${excludedCount}, total raw=${candidateImages.length}`);
      // Sample a few exclusion reasons for debugging
      const excludeSample = logs.filter((l) => l.status === "excluded").slice(0, 8);
      if (excludeSample.length) {
        console.log("[gallery] sample excluded:", JSON.stringify(excludeSample));
      }

      if (scrapedImages.length === 0) {
        photosWarning = photosWarning ?? "Nenhuma foto da galeria principal foi identificada. Adicione manualmente antes de salvar.";
      } else if (scrapedImages.length < 3 && photosConfidence === "low") {
        photosWarning = photosWarning ?? "Poucas fotos detectadas e a galeria principal não foi confirmada. Revise antes de salvar.";
      }

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
          photos_confidence: photosConfidence,
          photos_warning: photosWarning,
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
