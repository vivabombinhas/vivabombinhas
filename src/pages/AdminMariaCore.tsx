import { AdminPageBanner } from "@/components/admin/AdminPageBanner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Activity, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";

type HealthResponse = {
  configured: boolean;
  status: "ok" | "not_configured" | "error" | "timeout";
  message: string;
  latency_ms: number | null;
  http_status: number | null;
  checked_at: string;
};

type CoreEvent = {
  id: string;
  session_id: string | null;
  lead_id: string | null;
  tipo: string;
  payload: any;
  created_at: string;
};

function statusBadge(status: HealthResponse["status"]) {
  switch (status) {
    case "ok":
      return (
        <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20 border border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" /> OK
        </Badge>
      );
    case "not_configured":
      return (
        <Badge variant="secondary">
          <AlertTriangle className="w-3 h-3 mr-1" /> Não configurado
        </Badge>
      );
    case "timeout":
      return (
        <Badge className="bg-yellow-500/15 text-yellow-700 border border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" /> Timeout
        </Badge>
      );
    case "error":
    default:
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" /> Erro
        </Badge>
      );
  }
}

function eventBadge(tipo: string) {
  const map: Record<string, string> = {
    core_timeout: "bg-yellow-500/15 text-yellow-700 border border-yellow-500/30",
    core_error: "bg-red-500/15 text-red-700 border border-red-500/30",
    core_invalid_payload: "bg-orange-500/15 text-orange-700 border border-orange-500/30",
    core_fallback_local: "bg-slate-500/15 text-slate-700 border border-slate-500/30",
  };
  return <Badge className={map[tipo] ?? "bg-slate-500/15 text-slate-700 border border-slate-500/30"}>{tipo}</Badge>;
}

export default function AdminMariaCore() {
  const [refreshTick, setRefreshTick] = useState(0);

  const healthQuery = useQuery({
    queryKey: ["maria_core_health", refreshTick],
    queryFn: async (): Promise<HealthResponse> => {
      const { data, error } = await supabase.functions.invoke("maria-core-health", {
        method: "POST",
      });
      if (error) throw error;
      return data as HealthResponse;
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["maria_core_events", refreshTick],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maria_core_events")
        .select("id, session_id, lead_id, tipo, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as CoreEvent[];
    },
  });

  const countsQuery = useQuery({
    queryKey: ["maria_core_events_counts", refreshTick],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maria_core_events")
        .select("tipo")
        .limit(1000);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[(row as any).tipo] = (counts[(row as any).tipo] ?? 0) + 1;
      }
      return counts;
    },
  });

  const health = healthQuery.data;
  const isConfigured = health?.configured === true;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> MarIA Core
          </h1>
          <p className="text-sm text-muted-foreground">
            Saúde e observabilidade da integração com o backend externo MarIA Core.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshTick((t) => t + 1)}
          disabled={healthQuery.isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${healthQuery.isFetching ? "animate-spin" : ""}`} />
          Recarregar status
        </Button>
      </div>

      {!healthQuery.isLoading && !isConfigured && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>MarIA Core não configurado</AlertTitle>
          <AlertDescription>
            Os secrets <code>MARIA_CORE_API_URL</code> e <code>MARIA_CORE_API_KEY</code> ainda
            não foram definidos. Enquanto isso, todas as edge functions operam em modo
            fallback local (comportamento atual preservado).
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Status do Core</CardTitle>
          </CardHeader>
          <CardContent>
            {healthQuery.isLoading ? (
              <span className="text-sm text-muted-foreground">Verificando…</span>
            ) : health ? (
              <div className="space-y-2">
                {statusBadge(health.status)}
                <p className="text-sm text-muted-foreground">{health.message}</p>
              </div>
            ) : (
              <span className="text-sm text-destructive">
                {(healthQuery.error as any)?.message ?? "Falha ao consultar"}
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Última latência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.latency_ms != null ? `${health.latency_ms} ms` : "—"}
            </div>
            {health?.http_status != null && (
              <p className="text-xs text-muted-foreground">HTTP {health.http_status}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Última verificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {health?.checked_at ? new Date(health.checked_at).toLocaleString("pt-BR") : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {countsQuery.isLoading ? (
            <span className="text-sm text-muted-foreground">Carregando…</span>
          ) : Object.keys(countsQuery.data ?? {}).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento registrado ainda.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(countsQuery.data ?? {})
                .sort((a, b) => b[1] - a[1])
                .map(([tipo, count]) => (
                  <div
                    key={tipo}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5"
                  >
                    {eventBadge(tipo)}
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos 50 eventos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {eventsQuery.isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Carregando…</div>
          ) : (eventsQuery.data ?? []).length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Nenhum evento em <code>maria_core_events</code> ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">Quando</TableHead>
                    <TableHead className="w-[180px]">Tipo</TableHead>
                    <TableHead>Sessão</TableHead>
                    <TableHead>Payload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(eventsQuery.data ?? []).map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(ev.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>{eventBadge(ev.tipo)}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[220px]">
                        {ev.session_id ?? "—"}
                      </TableCell>
                      <TableCell>
                        <pre className="text-[11px] bg-muted/40 rounded p-2 max-w-[520px] overflow-x-auto">
                          {JSON.stringify(ev.payload ?? {}, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
