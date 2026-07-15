import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-core-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  purpose?: string;
  neighborhood?: string | null;
  guest_count?: number | null;
  budget_max?: number | null;
  budget_min?: number | null;
  limit?: number | null;
  property_type?: "apartamento" | "casa" | "cobertura" | "terreno" | "casa_ou_apartamento" | null;
}

function mapPropertyType(pt?: string | null): string[] | null {
  if (!pt) return null;
  switch (pt) {
    case "apartamento": return ["apartamento"];
    case "casa": return ["casa", "sobrado"];
    case "cobertura": return ["cobertura"];
    case "terreno": return ["terreno"];
    case "casa_ou_apartamento": return ["casa", "sobrado", "apartamento"];
    default: return null;
  }
}

const SITE_URL = "https://vivabombinhas.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const provided = req.headers.get("x-core-secret");
  const expected = Deno.env.get("CORE_EDGE_SECRET");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const purpose = (body.purpose ?? "temporada").toLowerCase();
  const finalidade = purpose === "compra"
    ? "compra"
    : purpose === "aluguel_anual" || purpose === "aluguel"
    ? "aluguel_anual"
    : "temporada";

  const limit = Math.min(Math.max(body.limit ?? 3, 1), 20);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let q = supabase
    .from("imoveis")
    .select(
      "id, titulo, bairro, micro_regiao, preco, preco_temporada_diaria, fotos, link_anuncio, codigo, capacidade_pessoas, qualidade_score, destaque_premium, destaque",
    )
    .eq("status", "ativo")
    .or("oculta_para_maria.is.null,oculta_para_maria.eq.false")
    .eq("finalidade", finalidade);

  if (body.neighborhood) {
    const n = body.neighborhood.trim();
    q = q.or(`bairro.ilike.%${n}%,micro_regiao.ilike.%${n}%`);
  }
  if (body.guest_count && body.guest_count > 0) {
    q = q.gte("capacidade_pessoas", body.guest_count);
  }

  const tipos = mapPropertyType(body.property_type);
  if (tipos && tipos.length > 0) {
    q = q.in("tipo", tipos);
  }

  const priceCol = finalidade === "temporada"
    ? "preco_temporada_diaria"
    : "preco";
  if (body.budget_max != null) q = q.lte(priceCol, body.budget_max);
  if (body.budget_min != null) q = q.gte(priceCol, body.budget_min);

  q = q
    .order("destaque_premium", { ascending: false, nullsFirst: false })
    .order("qualidade_score", { ascending: false, nullsFirst: false })
    .order("destaque", { ascending: false, nullsFirst: false })
    .limit(limit);

  const { data, error } = await q;
  if (error) {
    console.error("[buscar-imoveis] db error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const properties = (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.titulo,
    neighborhood: r.bairro ?? r.micro_regiao ?? null,
    daily_price: finalidade === "temporada"
      ? Number(r.preco_temporada_diaria) || null
      : Number(r.preco) || null,
    photo_url: Array.isArray(r.fotos) && r.fotos.length > 0 ? r.fotos[0] : null,
    link: r.link_anuncio || `${SITE_URL}/imovel/${r.id}`,
    capacity: r.capacidade_pessoas ?? null,
  }));

  return new Response(JSON.stringify({ properties }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
