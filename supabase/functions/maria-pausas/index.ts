import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-core-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let action = "list";
  let phone: string | undefined;
  let paused: boolean | undefined;

  if (req.method === "GET") {
    action = "list";
  } else {
    try {
      const body = await req.json();
      action = (body?.action ?? "list").toString();
      phone = body?.phone?.toString().trim();
      if (typeof body?.paused === "boolean") paused = body.paused;
    } catch {
      return new Response(JSON.stringify({ error: "invalid json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (action === "list") {
    const { data, error } = await supabase
      .from("maria_pausas")
      .select("phone")
      .eq("paused", true);
    if (error) {
      console.error("[maria-pausas] list error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ phones: (data ?? []).map((r: any) => r.phone) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (action === "set") {
    if (!phone || typeof paused !== "boolean") {
      return new Response(
        JSON.stringify({ error: "phone e paused (boolean) obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { error } = await supabase
      .from("maria_pausas")
      .upsert({ phone, paused, updated_at: new Date().toISOString() }, { onConflict: "phone" });
    if (error) {
      console.error("[maria-pausas] set error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "action inválida" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
