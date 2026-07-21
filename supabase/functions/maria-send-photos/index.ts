// Retorna URLs de fotos de um imóvel para o MarIA Core enviar via Z-API.
// Autenticado por x-core-secret (chamado pelo Core externo, não pelo browser).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-core-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  imovel_id?: string;
  phone?: string | null;
  max_photos?: number | null;
  session_id?: string | null;
  lead_id?: string | null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const provided = req.headers.get("x-core-secret");
  const expected = Deno.env.get("CORE_EDGE_SECRET");
  if (!expected || provided !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const imovelId = body.imovel_id?.toString().trim();
  if (!imovelId) return json({ error: "imovel_id obrigatório" }, 400);

  const maxPhotos = Math.min(Math.max(body.max_photos ?? 5, 1), 8);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: imovel, error } = await supabase
    .from("imoveis")
    .select(
      "id, titulo, bairro, fotos, photos_groups, gestao_propria, status, oculta_para_maria",
    )
    .eq("id", imovelId)
    .maybeSingle();

  if (error) {
    console.error("[maria-send-photos] db error", error);
    return json({ error: error.message }, 500);
  }
  if (!imovel) return json({ error: "imóvel não encontrado" }, 404);
  if (imovel.status !== "ativo" || imovel.oculta_para_maria) {
    return json({ error: "imóvel não disponível" }, 403);
  }

  // Prioridade: fotos principais → likely → doubtful
  const fotosPrincipais: string[] = Array.isArray(imovel.fotos) ? imovel.fotos : [];
  const groups = (imovel.photos_groups ?? {}) as Record<string, unknown>;
  const likely: string[] = Array.isArray(groups.likely) ? (groups.likely as string[]) : [];
  const doubtful: string[] = Array.isArray(groups.doubtful) ? (groups.doubtful as string[]) : [];

  const seen = new Set<string>();
  const photos: string[] = [];
  for (const url of [...fotosPrincipais, ...likely, ...doubtful]) {
    if (typeof url !== "string" || !url.trim()) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    photos.push(url);
    if (photos.length >= maxPhotos) break;
  }

  if (photos.length === 0) {
    return json({
      photos: [],
      caption: "",
      title: imovel.titulo,
      message:
        "Ainda não tenho fotos extras desse imóvel aqui. Posso te conectar com o especialista pra tirar dúvidas?",
    });
  }

  const caption = imovel.gestao_propria
    ? `Mais fotos do ${imovel.titulo} (Exclusivo VIV Bombinhas). Quer conversar com nosso especialista?`
    : `Mais fotos do ${imovel.titulo}. Se gostou, é só me pedir pra chamar nosso especialista.`;

  // Registro leve de observabilidade
  try {
    await supabase.from("maria_core_events").insert({
      session_id: body.session_id ?? null,
      lead_id: body.lead_id ?? null,
      tipo: "photos_sent",
      payload: {
        imovel_id: imovelId,
        phone: body.phone ?? null,
        count: photos.length,
        gestao_propria: !!imovel.gestao_propria,
      },
    });
  } catch (e) {
    console.warn("[maria-send-photos] evento não gravado:", (e as Error).message);
  }

  return json({
    photos,
    caption,
    title: imovel.titulo,
    gestao_propria: !!imovel.gestao_propria,
  });
});
