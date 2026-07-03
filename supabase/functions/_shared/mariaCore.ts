// ============================================================================
// MarIA Core — server-side client (Edge Functions only)
// ============================================================================
//
// Este módulo centraliza toda a comunicação com o backend externo MarIA Core.
//
// ⚠️  NUNCA importar este arquivo do frontend React.
//     A chave MARIA_CORE_API_KEY vive somente em Deno.env do backend.
//
// ---------------------------------------------------------------------------
// COMO CONFIGURAR OS SECRETS (quando o MarIA Core estiver hospedado):
// ---------------------------------------------------------------------------
// No projeto Lovable, adicionar dois secrets de backend:
//   1. MARIA_CORE_API_URL   → ex: https://api.mariacore.exemplo.com
//   2. MARIA_CORE_API_KEY   → chave bearer emitida pelo MarIA Core
//
// Enquanto qualquer um dos dois estiver ausente, este client opera em modo
// "not_configured": nenhuma request sai, e as edge functions recebem uma
// resposta tratada em vez de estourar exceção.
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 15_000;

export type MariaCoreStatus = "ok" | "not_configured" | "error" | "timeout";

export interface MariaCoreResult<T> {
  status: MariaCoreStatus;
  data?: T;
  error?: string;
  http_status?: number;
  latency_ms?: number;
}

function readConfig(): { url?: string; key?: string; configured: boolean } {
  const url = Deno.env.get("MARIA_CORE_API_URL")?.trim();
  const key = Deno.env.get("MARIA_CORE_API_KEY")?.trim();
  return { url, key, configured: Boolean(url && key) };
}

/**
 * Indica se o MarIA Core está configurado neste ambiente.
 * Útil para as edge functions decidirem entre chamar o Core ou usar o
 * fallback local (ex: manter a lógica atual do maria-search enquanto o Core
 * não existe).
 */
export function isMariaCoreConfigured(): boolean {
  return readConfig().configured;
}

/**
 * Chamada tipada ao MarIA Core.
 *
 * - Faz fetch com timeout (default 15s, override por chamada).
 * - Loga sempre latência, endpoint e status HTTP.
 * - Nunca lança: sempre devolve um MariaCoreResult<T>.
 */
export async function callMariaCore<T = unknown>(
  endpoint: string,
  init: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    headers?: Record<string, string>;
    timeoutMs?: number;
  } = {},
): Promise<MariaCoreResult<T>> {
  const { url, key, configured } = readConfig();

  if (!configured) {
    console.warn(
      `[mariaCore] not_configured — endpoint=${endpoint} — defina MARIA_CORE_API_URL e MARIA_CORE_API_KEY nos secrets do backend.`,
    );
    return {
      status: "not_configured",
      error:
        "MarIA Core ainda não está configurado. Adicione MARIA_CORE_API_URL e MARIA_CORE_API_KEY nos secrets do projeto.",
    };
  }

  const method = init.method ?? (init.body ? "POST" : "GET");
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  const fullUrl = `${url!.replace(/\/+$/, "")}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        ...(init.headers ?? {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });

    const latency_ms = Date.now() - startedAt;
    const rawText = await response.text();
    let parsed: unknown = undefined;
    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = rawText;
      }
    }

    console.log(
      `[mariaCore] ${method} ${endpoint} → ${response.status} (${latency_ms}ms)`,
    );

    if (!response.ok) {
      return {
        status: "error",
        error: typeof parsed === "string"
          ? parsed
          : `MarIA Core respondeu ${response.status}`,
        http_status: response.status,
        latency_ms,
      };
    }

    return {
      status: "ok",
      data: parsed as T,
      http_status: response.status,
      latency_ms,
    };
  } catch (err) {
    const latency_ms = Date.now() - startedAt;
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    if (isAbort) {
      console.error(
        `[mariaCore] timeout ${method} ${endpoint} após ${timeoutMs}ms`,
      );
      return {
        status: "timeout",
        error: `MarIA Core não respondeu em ${timeoutMs}ms`,
        latency_ms,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[mariaCore] falha ${method} ${endpoint}: ${message}`);
    return { status: "error", error: message, latency_ms };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Health check do MarIA Core.
 *
 * Retorna um objeto amigável para expor em telas de admin ou logs.
 * Nunca lança. Quando os secrets não estão presentes, devolve
 * "MarIA Core não configurado".
 */
export async function checkMariaCoreHealth(): Promise<{
  status: MariaCoreStatus;
  message: string;
  latency_ms?: number;
  http_status?: number;
}> {
  if (!isMariaCoreConfigured()) {
    return {
      status: "not_configured",
      message: "MarIA Core não configurado",
    };
  }

  const result = await callMariaCore<{ status?: string; version?: string }>(
    "/health",
    { method: "GET", timeoutMs: 5_000 },
  );

  if (result.status === "ok") {
    return {
      status: "ok",
      message: "MarIA Core disponível",
      latency_ms: result.latency_ms,
      http_status: result.http_status,
    };
  }

  return {
    status: result.status,
    message: result.error ?? "Falha desconhecida ao checar MarIA Core",
    latency_ms: result.latency_ms,
    http_status: result.http_status,
  };
}
