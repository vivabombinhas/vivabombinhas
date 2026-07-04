import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, RefreshCw, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type MariaMessage = {
  id: string;
  session_id: string | null;
  lead_id: string | null;
  role: string | null;
  content: string | null;
  created_at: string;
  mode: string | null;
  latency_ms: number | null;
};

type LeadLite = {
  id: string;
  nome: string | null;
  telefone: string | null;
  status: string | null;
};

type SessionRow = {
  session_id: string;
  messages: MariaMessage[];
  lastMessage: MariaMessage;
  count: number;
  mode: string | null;
  lead_id: string | null;
};

const MODES = ["router", "search", "consultivo", "temporada", "investimento", "extraction"];

function shortId(id: string) {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

export default function AdminConversas() {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [days, setDays] = useState<string>("30");
  const [openSession, setOpenSession] = useState<SessionRow | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin_conversas", days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(days, 10));
      const { data: msgs, error } = await supabase
        .from("maria_messages")
        .select("id, session_id, lead_id, role, content, created_at, mode, latency_ms")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;

      const leadIds = Array.from(
        new Set((msgs ?? []).map((m) => m.lead_id).filter(Boolean) as string[]),
      );
      let leadsMap: Record<string, LeadLite> = {};
      if (leadIds.length) {
        const { data: leads } = await supabase
          .from("leads_maria")
          .select("id, nome, telefone, status")
          .in("id", leadIds);
        leadsMap = Object.fromEntries((leads ?? []).map((l) => [l.id, l as LeadLite]));
      }
      return { msgs: (msgs ?? []) as MariaMessage[], leadsMap };
    },
  });

  const sessions: SessionRow[] = useMemo(() => {
    const map = new Map<string, SessionRow>();
    for (const m of data?.msgs ?? []) {
      const key = m.session_id || `no-session-${m.id}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          session_id: key,
          messages: [m],
          lastMessage: m,
          count: 1,
          mode: m.mode,
          lead_id: m.lead_id,
        });
      } else {
        existing.messages.push(m);
        existing.count += 1;
        if (new Date(m.created_at) > new Date(existing.lastMessage.created_at)) {
          existing.lastMessage = m;
        }
        if (!existing.mode && m.mode) existing.mode = m.mode;
        if (!existing.lead_id && m.lead_id) existing.lead_id = m.lead_id;
      }
    }
    let arr = Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime(),
    );

    if (modeFilter !== "all") {
      arr = arr.filter((s) => s.mode === modeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (s) =>
          s.session_id.toLowerCase().includes(q) ||
          s.messages.some((m) => (m.content || "").toLowerCase().includes(q)),
      );
    }
    return arr;
  }, [data, modeFilter, search]);

  const openTranscript = (s: SessionRow) => {
    const sorted = [...s.messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    setOpenSession({ ...s, messages: sorted });
  };

  const openLead = openSession ? data?.leadsMap[openSession.lead_id || ""] : undefined;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" /> Conversas
          </h1>
          <p className="text-sm text-muted-foreground">
            Sessões da MarIA agrupadas por session_id (leitura pura).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por session_id ou texto"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os modos</SelectItem>
              {MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Últimas 24h</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isLoading ? "Carregando..." : `${sessions.length} sessão(ões)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma conversa encontrada para os filtros atuais.
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((s) => {
                const lead = data?.leadsMap[s.lead_id || ""];
                return (
                  <button
                    key={s.session_id}
                    onClick={() => openTranscript(s)}
                    className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                            {shortId(s.session_id)}
                          </span>
                          {s.mode && <Badge variant="secondary">{s.mode}</Badge>}
                          <Badge variant="outline">{s.count} msgs</Badge>
                          {lead && (
                            <Badge variant="default">
                              {lead.nome || lead.telefone || shortId(lead.id)}
                            </Badge>
                          )}
                          {lead?.status && (
                            <Badge variant="outline">{lead.status}</Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          <span className="font-medium text-foreground">
                            {s.lastMessage.role === "assistant" ? "MarIA" : "Usuário"}:
                          </span>{" "}
                          {s.lastMessage.content || "—"}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(s.lastMessage.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!openSession} onOpenChange={(o) => !o && setOpenSession(null)}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 flex-wrap">
              Transcript
              {openSession?.mode && <Badge variant="secondary">{openSession.mode}</Badge>}
            </SheetTitle>
            <SheetDescription className="font-mono text-xs">
              {openSession && shortId(openSession.session_id)}
              {openLead && (
                <span className="ml-2 text-foreground">
                  · {openLead.nome || openLead.telefone || shortId(openLead.id)}
                </span>
              )}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 mt-4 pr-4">
            <div className="space-y-3">
              {openSession?.messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-3 text-sm ${
                    m.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary/10 border border-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {m.role === "assistant" ? "MarIA" : m.role === "user" ? "Usuário" : m.role}
                      </span>
                      {m.mode && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          {m.mode}
                        </Badge>
                      )}
                      {m.latency_ms != null && (
                        <span className="text-[10px] text-muted-foreground">
                          {m.latency_ms}ms
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap break-words">{m.content || "—"}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
