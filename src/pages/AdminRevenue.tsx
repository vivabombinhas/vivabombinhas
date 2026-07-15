import { AdminPageBanner } from "@/components/admin/AdminPageBanner";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Plus, TrendingUp, Wallet, Clock, CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";

type Revenue = {
  id: string;
  lead_id: string;
  imovel_id: string | null;
  tipo_negocio: "temporada" | "anual" | "venda" | "destaque";
  parceiro_nome: string | null;
  parceiro_telefone: string | null;
  valor_negocio: number | null;
  comissao_percentual: number | null;
  valor_previsto: number | null;
  valor_pago: number | null;
  status: "previsto" | "negociacao" | "fechado" | "pago" | "cancelado";
  data_fechamento: string | null;
  data_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  leads_maria?: { nome: string | null; telefone: string | null } | null;
  imoveis?: { titulo: string | null; bairro: string | null } | null;
};

const fmtBRL = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const tipoLabel: Record<Revenue["tipo_negocio"], string> = {
  temporada: "Temporada",
  anual: "Aluguel anual",
  venda: "Venda",
  destaque: "Destaque Premium",
};

const statusColor: Record<Revenue["status"], string> = {
  previsto: "bg-slate-500/10 text-slate-700 border-slate-200",
  negociacao: "bg-amber-500/10 text-amber-700 border-amber-200",
  fechado: "bg-blue-500/10 text-blue-700 border-blue-200",
  pago: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  cancelado: "bg-red-500/10 text-red-700 border-red-200",
};

export default function AdminRevenue() {
  const qc = useQueryClient();
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [editing, setEditing] = useState<Revenue | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin_revenue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_revenue")
        .select("*, leads_maria(nome, telefone), imoveis(titulo, bairro)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Revenue[];
    },
  });

  const filtered = useMemo(() => {
    return (rows || []).filter((r) => {
      if (filterTipo !== "todos" && r.tipo_negocio !== filterTipo) return false;
      if (filterStatus !== "todos" && r.status !== filterStatus) return false;
      return true;
    });
  }, [rows, filterTipo, filterStatus]);

  const kpis = useMemo(() => {
    const list = rows || [];
    const sum = (k: keyof Revenue) =>
      list.reduce((acc, r) => acc + (Number(r[k] as number) || 0), 0);
    const previstoAtivo = list
      .filter((r) => r.status !== "cancelado" && r.status !== "pago")
      .reduce((a, r) => a + (Number(r.valor_previsto) || 0), 0);
    const pago = sum("valor_pago");
    const aReceber = list
      .filter((r) => r.status === "fechado")
      .reduce((a, r) => a + ((Number(r.valor_previsto) || 0) - (Number(r.valor_pago) || 0)), 0);
    const porTipo = (t: Revenue["tipo_negocio"]) =>
      list.filter((r) => r.tipo_negocio === t && r.status !== "cancelado")
          .reduce((a, r) => a + (Number(r.valor_previsto) || 0), 0);
    return {
      total: list.length,
      previstoAtivo,
      pago,
      aReceber,
      temporada: porTipo("temporada"),
      anual: porTipo("anual"),
      venda: porTipo("venda"),
      destaque: porTipo("destaque"),
    };
  }, [rows]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este registro de receita?")) return;
    const { error } = await supabase.from("lead_revenue").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Removido" });
    qc.invalidateQueries({ queryKey: ["admin_revenue"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminPageBanner
        title="Receita e comissões"
        description="Registro dos negócios fechados, valores previstos, pagos e comissões. É onde você acompanha quanto a plataforma está gerando de dinheiro."
      />
      <header className="border-b border-border bg-card/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold font-display">Receita</h1>
              <p className="text-xs text-muted-foreground">
                Origem da receita por lead, parceiro, tipo de negócio e pagamento
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo registro
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={Clock} title="Previsto (ativos)" value={fmtBRL(kpis.previstoAtivo)} sub={`${kpis.total} negócios`} color="text-amber-600 bg-amber-500/10" />
          <KpiCard icon={Wallet} title="A receber" value={fmtBRL(kpis.aReceber)} sub="Fechados não pagos" color="text-blue-600 bg-blue-500/10" />
          <KpiCard icon={CheckCircle2} title="Pago" value={fmtBRL(kpis.pago)} sub="Comissão recebida" color="text-emerald-600 bg-emerald-500/10" />
          <KpiCard icon={TrendingUp} title="Por tipo (previsto)" value="" sub={`Destaque ${fmtBRL(kpis.destaque)} · Temp ${fmtBRL(kpis.temporada)} · Anual ${fmtBRL(kpis.anual)} · Venda ${fmtBRL(kpis.venda)}`} color="text-purple-600 bg-purple-500/10" />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="temporada">Temporada</SelectItem>
              <SelectItem value="anual">Aluguel anual</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
              <SelectItem value="destaque">Destaque Premium</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="previsto">Previsto</SelectItem>
              <SelectItem value="negociacao">Negociação</SelectItem>
              <SelectItem value="fechado">Fechado</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Nenhum registro de receita ainda. Clique em <strong>Novo registro</strong> para começar a rastrear.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((r) => (
                <li key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{r.leads_maria?.nome || "Lead sem nome"}</span>
                      <Badge variant="outline" className="text-xs">{tipoLabel[r.tipo_negocio]}</Badge>
                      <Badge className={`text-xs border ${statusColor[r.status]} hover:${statusColor[r.status]}`}>{r.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {r.imoveis?.titulo || "Sem imóvel"} · Parceiro: {r.parceiro_nome || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Previsto</div>
                      <div className="font-semibold">{fmtBRL(r.valor_previsto)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Pago</div>
                      <div className="font-semibold text-emerald-700">{fmtBRL(r.valor_pago)}</div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <RevenueSheet
        open={creating || !!editing}
        record={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["admin_revenue"] }); setCreating(false); setEditing(null); }}
      />
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, sub, color }: { icon: any; title: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {value && <div className="text-2xl font-bold">{value}</div>}
      <div className="text-sm text-muted-foreground mt-0.5">{title}</div>
      <div className="text-xs text-muted-foreground mt-2">{sub}</div>
    </div>
  );
}

function RevenueSheet({ open, record, onClose, onSaved }: { open: boolean; record: Revenue | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!record;

  // Lead picker (busca simples)
  const { data: leads } = useQuery({
    queryKey: ["revenue_leads_picker"],
    enabled: open && !isEdit,
    queryFn: async () => {
      const { data } = await supabase
        .from("leads_maria")
        .select("id, nome, telefone")
        .neq("status", "anonimo")
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const [form, setForm] = useState<Partial<Revenue>>({});

  // reset form when opening
  useMemo(() => {
    if (open) {
      setForm(record ?? {
        tipo_negocio: "temporada",
        status: "previsto",
        valor_pago: 0,
      } as Partial<Revenue>);
    }
  }, [open, record]);

  const update = (k: keyof Revenue, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const recalcPrevisto = (valor?: number | null, pct?: number | null) => {
    if (valor != null && pct != null) {
      update("valor_previsto", Number(((valor * pct) / 100).toFixed(2)));
    }
  };

  const handleSave = async () => {
    if (!form.lead_id) {
      toast({ title: "Selecione um lead", variant: "destructive" });
      return;
    }
    if (!form.tipo_negocio) {
      toast({ title: "Selecione o tipo de negócio", variant: "destructive" });
      return;
    }
    const payload = {
      lead_id: form.lead_id,
      imovel_id: form.imovel_id || null,
      tipo_negocio: form.tipo_negocio,
      parceiro_nome: form.parceiro_nome || null,
      parceiro_telefone: form.parceiro_telefone || null,
      valor_negocio: form.valor_negocio ?? null,
      comissao_percentual: form.comissao_percentual ?? null,
      valor_previsto: form.valor_previsto ?? null,
      valor_pago: form.valor_pago ?? 0,
      status: form.status || "previsto",
      data_fechamento: form.data_fechamento || null,
      data_pagamento: form.data_pagamento || null,
      observacoes: form.observacoes || null,
    };

    const { error } = isEdit
      ? await supabase.from("lead_revenue").update(payload).eq("id", record!.id)
      : await supabase.from("lead_revenue").insert(payload);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: isEdit ? "Atualizado" : "Receita registrada" });
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar receita" : "Nova receita"}</SheetTitle>
          <SheetDescription>
            Vincule a um lead, defina parceiro, tipo de negócio e valores.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {!isEdit && (
            <div>
              <Label>Lead</Label>
              <Select value={form.lead_id || ""} onValueChange={(v) => update("lead_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione um lead" /></SelectTrigger>
                <SelectContent>
                  {(leads || []).map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nome || "Sem nome"} {l.telefone ? `· ${l.telefone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de negócio</Label>
              <Select value={form.tipo_negocio} onValueChange={(v) => update("tipo_negocio", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporada">Temporada</SelectItem>
                  <SelectItem value="anual">Aluguel anual</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="destaque">Destaque Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="previsto">Previsto</SelectItem>
                  <SelectItem value="negociacao">Negociação</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Parceiro / Corretor</Label>
              <Input value={form.parceiro_nome || ""} onChange={(e) => update("parceiro_nome", e.target.value)} placeholder="Nome" />
            </div>
            <div>
              <Label>Telefone parceiro</Label>
              <Input value={form.parceiro_telefone || ""} onChange={(e) => update("parceiro_telefone", e.target.value)} placeholder="(47) ..." />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Valor do negócio</Label>
              <Input type="number" step="0.01" value={form.valor_negocio ?? ""} onChange={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                update("valor_negocio", v);
                recalcPrevisto(v, form.comissao_percentual);
              }} />
            </div>
            <div>
              <Label>Comissão %</Label>
              <Input type="number" step="0.1" value={form.comissao_percentual ?? ""} onChange={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                update("comissao_percentual", v);
                recalcPrevisto(form.valor_negocio, v);
              }} />
            </div>
            <div>
              <Label>Previsto</Label>
              <Input type="number" step="0.01" value={form.valor_previsto ?? ""} onChange={(e) => update("valor_previsto", e.target.value === "" ? null : Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Valor pago</Label>
              <Input type="number" step="0.01" value={form.valor_pago ?? 0} onChange={(e) => update("valor_pago", e.target.value === "" ? 0 : Number(e.target.value))} />
            </div>
            <div>
              <Label>Data fechamento</Label>
              <Input type="date" value={form.data_fechamento || ""} onChange={(e) => update("data_fechamento", e.target.value)} />
            </div>
            <div>
              <Label>Data pagamento</Label>
              <Input type="date" value={form.data_pagamento || ""} onChange={(e) => update("data_pagamento", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={form.observacoes || ""} onChange={(e) => update("observacoes", e.target.value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">Salvar</Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
