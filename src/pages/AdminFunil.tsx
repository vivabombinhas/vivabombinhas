import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { KanbanSquare, Phone, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LeadTranscriptSheet } from "@/components/admin/LeadTranscriptSheet";


// The DB enum status_lead currently supports only these values.
// User-requested columns are mapped to the closest existing status;
// unsupported labels are omitted to avoid breaking the DB.
const COLUMNS: { key: string; label: string }[] = [
  { key: "novo", label: "Novo" },
  { key: "contatado", label: "Em atendimento" },
  { key: "convertido", label: "Fechado" },
  { key: "descartado", label: "Perdido" },
  { key: "anonimo", label: "Nutrir" },
];

const STATUS_OPTIONS = COLUMNS.map((c) => c.key);

type Lead = {
  id: string;
  nome: string | null;
  telefone: string | null;
  status: string | null;
  finalidade: string | null;
  bairro_interesse: string | null;
  faixa_preco: string | null;
  orcamento_min: number | null;
  orcamento_max: number | null;
  resumo_ia: string | null;
  next_action_suggested: string | null;
  proximo_passo_sugerido: string | null;
  created_at: string;
  last_contact_at: string | null;
};

const FINALIDADES = ["temporada", "compra", "investimento", "anunciar", "outro"];

function orcamentoLabel(l: Lead) {
  if (l.faixa_preco) return l.faixa_preco;
  if (l.orcamento_min || l.orcamento_max) {
    const fmt = (n: number | null) =>
      n ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "?";
    return `${fmt(l.orcamento_min)} – ${fmt(l.orcamento_max)}`;
  }
  return null;
}

export default function AdminFunil() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [finalidade, setFinalidade] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [days, setDays] = useState("30");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin_funil", days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(days, 10));
      const { data: leads, error } = await supabase
        .from("leads_maria")
        .select(
          "id, nome, telefone, status, finalidade, bairro_interesse, faixa_preco, orcamento_min, orcamento_max, resumo_ia, next_action_suggested, proximo_passo_sugerido, created_at, last_contact_at",
        )
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (leads ?? []) as Lead[];
    },
  });

  const filtered = useMemo(() => {
    let arr = data ?? [];
    if (finalidade !== "all") arr = arr.filter((l) => l.finalidade === finalidade);
    if (statusFilter !== "all") arr = arr.filter((l) => l.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (l) =>
          (l.nome || "").toLowerCase().includes(q) ||
          (l.telefone || "").toLowerCase().includes(q),
      );
    }
    return arr;
  }, [data, finalidade, statusFilter, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const c of COLUMNS) map[c.key] = [];
    for (const l of filtered) {
      const key = STATUS_OPTIONS.includes(l.status || "") ? (l.status as string) : "novo";
      (map[key] ||= []).push(l);
    }
    return map;
  }, [filtered]);

  const updateStatus = async (lead: Lead, newStatus: string) => {
    if (newStatus === lead.status) return;
    const oldStatus = lead.status;
    const { error } = await supabase
      // biome-ignore lint: enum cast handled by supabase
      .from("leads_maria")
      .update({ status: newStatus as never })
      .eq("id", lead.id);
    if (error) {
      toast.error("Erro ao atualizar status: " + error.message);
      return;
    }
    // Observational audit — do not block on failure
    try {
      const { error: aerr } = await supabase.from("lead_status_audit").insert({
        lead_id: lead.id,
        old_status: oldStatus,
        new_status: newStatus,
        source: "admin_funil",
      });
      if (aerr) console.error("[Funil] audit insert failed:", aerr);
    } catch (e) {
      console.error("[Funil] audit exception:", e);
    }
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["admin_funil"] });
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KanbanSquare className="w-6 h-6" /> Funil
          </h1>
          <p className="text-sm text-muted-foreground">
            Kanban comercial dos leads da MarIA. Alteração de etapa via dropdown no card.
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
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nome/telefone"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={finalidade} onValueChange={setFinalidade}>
            <SelectTrigger><SelectValue placeholder="Finalidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas finalidades</SelectItem>
              {FINALIDADES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {COLUMNS.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-6">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum lead encontrado para os filtros atuais.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {COLUMNS.map((col) => {
            const items = grouped[col.key] ?? [];
            return (
              <div key={col.key} className="flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="font-semibold text-sm">{col.label}</div>
                  <Badge variant="outline">{items.length}</Badge>
                </div>
                <div className="flex-1 space-y-2 bg-muted/30 rounded-lg p-2 min-h-[200px]">
                  {items.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-3 text-center">Vazio</div>
                  ) : (
                    items.map((l) => {
                      const orc = orcamentoLabel(l);
                      const next = l.next_action_suggested || l.proximo_passo_sugerido;
                      const updated = l.last_contact_at || l.created_at;
                      return (
                        <div
                          key={l.id}
                          className="bg-background border rounded-md p-3 space-y-1.5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">
                                {l.nome || "Sem nome"}
                              </div>
                              {l.telefone && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {l.telefone}
                                </div>
                              )}
                            </div>
                            {l.finalidade && (
                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                {l.finalidade}
                              </Badge>
                            )}
                          </div>
                          {(l.bairro_interesse || orc) && (
                            <div className="text-xs text-muted-foreground">
                              {l.bairro_interesse}
                              {l.bairro_interesse && orc ? " · " : ""}
                              {orc}
                            </div>
                          )}
                          {next && (
                            <div className="text-xs bg-primary/5 border border-primary/20 rounded px-2 py-1 line-clamp-2">
                              <span className="font-medium">Próximo:</span> {next}
                            </div>
                          )}
                          {l.resumo_ia && (
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {l.resumo_ia}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(updated), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            <Select
                              value={l.status || "novo"}
                              onValueChange={(v) => updateStatus(l, v)}
                            >
                              <SelectTrigger className="h-7 text-xs w-auto min-w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COLUMNS.map((c) => (
                                  <SelectItem key={c.key} value={c.key}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
