import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarClock,
  AlarmClock,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Clock,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import LeadDetailSheet from "@/components/admin/LeadDetailSheet";
import { WHATSAPP_TEMPLATES, buildWhatsappLink, openWhatsapp } from "@/lib/whatsapp-templates";

type Bucket = "atrasado" | "hoje" | "esta_semana" | "agendado" | "sem_followup";

const BUCKET_CONFIG: Record<Bucket, { label: string; className: string }> = {
  atrasado: { label: "Atrasado", className: "bg-red-500/10 text-red-700 border-red-200 dark:text-red-300" },
  hoje: { label: "Hoje", className: "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-300" },
  esta_semana: { label: "Esta semana", className: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300" },
  agendado: { label: "Agendado", className: "bg-muted text-muted-foreground border-border" },
  sem_followup: { label: "Sem agenda", className: "bg-secondary text-secondary-foreground border-border" },
};

function bucketOf(iso: string | null | undefined): Bucket {
  if (!iso) return "sem_followup";
  const due = new Date(iso).getTime();
  const now = Date.now();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(); endOfWeek.setDate(endOfWeek.getDate() + 7);

  if (due < startOfToday.getTime()) return "atrasado";
  if (due >= startOfToday.getTime() && due <= endOfToday.getTime()) return "hoje";
  if (due <= endOfWeek.getTime()) return "esta_semana";
  return "agendado";
}

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function addDays(d: number) {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

export default function AdminFollowups() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Bucket | "todos" | "ativos">("ativos");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["followups_leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads_maria")
        .select("*")
        .neq("status", "anonimo")
        .neq("status", "descartado")
        .neq("status", "convertido")
        .order("next_followup_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const reschedule = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number | null }) => {
      const { error } = await supabase
        .from("leads_maria")
        .update({ next_followup_at: days === null ? null : addDays(days) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups_leads"] });
      qc.invalidateQueries({ queryKey: ["leads_maria"] });
      toast.success("Follow-up reagendado");
    },
    onError: () => toast.error("Erro ao reagendar"),
  });

  const markContacted = useMutation({
    mutationFn: async ({ id, nextDays }: { id: string; nextDays: number | null }) => {
      const patch: Record<string, unknown> = {
        last_contact_at: new Date().toISOString(),
        status: "contatado",
      };
      if (nextDays !== null) patch.next_followup_at = addDays(nextDays);
      const { error } = await supabase.from("leads_maria").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["followups_leads"] });
      qc.invalidateQueries({ queryKey: ["leads_maria"] });
      toast.success("Marcado como contatado");
    },
    onError: () => toast.error("Erro ao marcar contato"),
  });

  const enriched = useMemo(() => {
    if (!leads) return [];
    return leads.map((l) => ({ ...l, _bucket: bucketOf(l.next_followup_at) as Bucket }));
  }, [leads]);

  const counts = useMemo(() => {
    const c = { atrasado: 0, hoje: 0, esta_semana: 0, agendado: 0, sem_followup: 0, total: enriched.length };
    enriched.forEach((l) => { c[l._bucket]++; });
    return c;
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((l) => {
      if (filter === "ativos") {
        if (l._bucket === "agendado" || l._bucket === "sem_followup") return false;
      } else if (filter !== "todos" && l._bucket !== filter) return false;
      if (!q) return true;
      return [l.nome, l.telefone, l.bairro_interesse, l.tipo_imovel]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [enriched, filter, search]);

  const tabs: { key: typeof filter; label: string; count: number; tone: string }[] = [
    { key: "ativos", label: "Para hoje + atrasados", count: counts.atrasado + counts.hoje, tone: "text-amber-700" },
    { key: "atrasado", label: "Atrasados", count: counts.atrasado, tone: "text-red-700" },
    { key: "hoje", label: "Hoje", count: counts.hoje, tone: "text-amber-700" },
    { key: "esta_semana", label: "Próx. 7 dias", count: counts.esta_semana, tone: "text-blue-700" },
    { key: "sem_followup", label: "Sem agenda", count: counts.sem_followup, tone: "text-muted-foreground" },
    { key: "todos", label: "Todos ativos", count: counts.total, tone: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold font-display flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary" />
                Follow-ups
              </h1>
              <p className="text-xs text-muted-foreground">
                {counts.atrasado > 0 && (
                  <span className="text-red-600 font-medium">⚠ {counts.atrasado} atrasado(s) · </span>
                )}
                {counts.hoje} para hoje · {counts.esta_semana} esta semana
              </p>
            </div>
          </div>

          {/* KPIs como abas */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  filter === t.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                <span className={filter === t.key ? "" : t.tone}>{t.label}</span>
                <span className={`ml-1.5 font-semibold ${filter === t.key ? "" : "text-foreground"}`}>{t.count}</span>
              </button>
            ))}
            <div className="relative ml-auto min-w-[220px] max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, telefone, bairro..."
                className="pl-9 h-9"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-xl">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-500" />
            <p className="font-medium">Tudo em dia por aqui! 🎉</p>
            <p className="text-xs mt-1">Nenhum follow-up pendente nesse filtro.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[24%]">Lead</TableHead>
                    <TableHead className="w-[14%]">Quando</TableHead>
                    <TableHead className="w-[14%]">Status</TableHead>
                    <TableHead className="w-[22%]">Interesse</TableHead>
                    <TableHead className="w-[14%]">Último contato</TableHead>
                    <TableHead className="w-[12%] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const cfg = BUCKET_CONFIG[l._bucket];
                    return (
                      <TableRow
                        key={l.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => { setSelectedLeadId(l.id); setSheetOpen(true); }}
                      >
                        <TableCell className="align-top py-3">
                          <div className="font-medium truncate">
                            {l.nome ?? <span className="italic text-muted-foreground">Sem nome</span>}
                          </div>
                          {l.telefone && (
                            <div className="text-xs text-muted-foreground">{l.telefone}</div>
                          )}
                        </TableCell>

                        <TableCell className="align-top py-3">
                          <Badge variant="outline" className={`text-[10px] ${cfg.className}`}>
                            {cfg.label}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {fmt(l.next_followup_at)}
                          </div>
                        </TableCell>

                        <TableCell className="align-top py-3">
                          <Badge variant="secondary" className="text-[10px]">{l.status}</Badge>
                        </TableCell>

                        <TableCell className="align-top py-3">
                          <div className="text-sm truncate">
                            {l.bairro_interesse || <span className="text-muted-foreground">—</span>}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {[l.tipo_imovel, l.faixa_preco].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </TableCell>

                        <TableCell className="align-top py-3">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {fmt(l.last_contact_at)}
                          </span>
                        </TableCell>

                        <TableCell className="align-top py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            {l.telefone && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-72">
                                  <DropdownMenuLabel>Mensagens prontas</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {WHATSAPP_TEMPLATES.map((t) => (
                                    <DropdownMenuItem
                                      key={t.id}
                                      onClick={() => {
                                        openWhatsapp(l.telefone!, t.build(l));
                                      }}
                                      className="flex flex-col items-start gap-0.5 py-2"
                                    >
                                      <span className="text-sm font-medium">{t.label}</span>
                                      <span className="text-[10px] text-muted-foreground">{t.description}</span>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-7 px-2">
                                  <AlarmClock className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Reagendar para</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => reschedule.mutate({ id: l.id, days: 1 })}>Amanhã</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => reschedule.mutate({ id: l.id, days: 3 })}>Em 3 dias</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => reschedule.mutate({ id: l.id, days: 7 })}>Em 1 semana</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => reschedule.mutate({ id: l.id, days: 14 })}>Em 2 semanas</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => reschedule.mutate({ id: l.id, days: null })}>Remover agenda</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Marcar contato + reagendar</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => markContacted.mutate({ id: l.id, nextDays: 2 })}>Contatado · próx. em 2 dias</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => markContacted.mutate({ id: l.id, nextDays: 5 })}>Contatado · próx. em 5 dias</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => markContacted.mutate({ id: l.id, nextDays: 7 })}>Contatado · próx. em 1 semana</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => markContacted.mutate({ id: l.id, nextDays: null })}>Contatado · sem reagendar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Dica: clique numa linha para abrir o lead completo (notas, conversa, histórico).
        </p>
      </main>

      <LeadDetailSheet
        lead={(leads?.find((l) => l.id === selectedLeadId) as never) ?? null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
