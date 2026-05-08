import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Phone, Mail, Filter, Search, MessageCircle, X, Trash2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Checkbox
} from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import LeadDetailSheet from "@/components/admin/LeadDetailSheet";

type LeadStatus = "novo" | "contatado" | "convertido" | "descartado" | "anonimo";

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300" },
  contatado: { label: "Contatado", className: "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-300" },
  convertido: { label: "Convertido", className: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300" },
  descartado: { label: "Descartado", className: "bg-red-500/10 text-red-700 border-red-200 dark:text-red-300" },
  anonimo: { label: "Anônimo", className: "bg-muted text-muted-foreground border-border" },
};

const INTERESSE_MAP: Record<string, string> = {
  compra: "Compra",
  aluguel_anual: "Aluguel anual",
  temporada: "Temporada",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminLeads() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [interesseFilter, setInteresseFilter] = useState<string>("all");
  const [bairroFilter, setBairroFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [showAnonimos, setShowAnonimos] = useState<boolean>(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchActionConfirm, setBatchActionConfirm] = useState<{
    isOpen: boolean;
    status: LeadStatus | null;
  }>({ isOpen: false, status: null });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<string>("historico");
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads_maria", statusFilter, showAnonimos],
    queryFn: async () => {
      let query = supabase
        .from("leads_maria")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as LeadStatus);
      } else if (!showAnonimos) {
        query = query.neq("status", "anonimo");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, ids, status }: { id?: string; ids?: string[]; status: LeadStatus }) => {
      let query = supabase.from("leads_maria").update({ status });
      if (id) {
        query = query.eq("id", id);
      } else if (ids && ids.length > 0) {
        query = query.in("id", ids);
      } else {
        throw new Error("ID ou IDs necessários");
      }
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads_maria"] });
      toast.success("Status atualizado");
      setSelectedLeads([]);
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const deleteLeads = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("leads_maria").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads_maria"] });
      toast.success("Leads excluídos permanentemente");
      setSelectedLeads([]);
      setIsDeleteDialogOpen(false);
    },
    onError: () => toast.error("Erro ao excluir leads"),
  });

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Listas únicas para filtros
  const bairros = useMemo(() => {
    const set = new Set<string>();
    leads?.forEach((l) => l.bairro_interesse && set.add(l.bairro_interesse));
    return Array.from(set).sort();
  }, [leads]);

  // Filtros client-side (busca + interesse + bairro)
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (interesseFilter !== "all" && l.interesse !== interesseFilter) return false;
      if (bairroFilter !== "all" && l.bairro_interesse !== bairroFilter) return false;
      if (!q) return true;
      const hay = [l.nome, l.telefone, l.email, l.bairro_interesse, l.tipo_imovel, l.mensagem_original]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leads, search, interesseFilter, bairroFilter]);

  const counts = {
    total: leads?.length ?? 0,
    novos: leads?.filter((l) => l.status === "novo").length ?? 0,
    filtered: filteredLeads.length,
  };

  const hasActiveFilters =
    statusFilter !== "all" || interesseFilter !== "all" || bairroFilter !== "all" || !!search;

  const clearFilters = () => {
    setStatusFilter("all");
    setInteresseFilter("all");
    setBairroFilter("all");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Leads MarIA
              </h1>
              <p className="text-xs text-muted-foreground">
                {counts.total} leads no total · {counts.novos} novos
                {hasActiveFilters && ` · ${counts.filtered} no filtro`}
              </p>
            </div>
            <Button
              variant={showAnonimos ? "default" : "ghost"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setShowAnonimos((v) => !v)}
              title="Mostrar leads anônimos (sem nome/telefone)"
            >
              {showAnonimos ? "Ocultando anônimos" : "Ver anônimos"}
            </Button>
          </div>

          {/* Filtros */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, telefone, bairro..."
                className="pl-9 h-9"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contatado">Contatado</SelectItem>
                  <SelectItem value="convertido">Convertido</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                  <SelectItem value="anonimo">Anônimo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={interesseFilter} onValueChange={setInteresseFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Interesse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos interesses</SelectItem>
                <SelectItem value="compra">Compra</SelectItem>
                <SelectItem value="aluguel_anual">Aluguel anual</SelectItem>
                <SelectItem value="temporada">Temporada</SelectItem>
              </SelectContent>
            </Select>

            {bairros.length > 0 && (
              <Select value={bairroFilter} onValueChange={setBairroFilter}>
                <SelectTrigger className="w-40 h-9 text-sm">
                  <SelectValue placeholder="Bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos bairros</SelectItem>
                  {bairros.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs gap-1">
                <X className="w-3.5 h-3.5" />
                Limpar
              </Button>
            )}
          </div>

          {/* Barra de Ações em Lote */}
          {selectedLeads.length > 0 && (
            <div className="mt-4 p-2 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-primary">
                  {selectedLeads.length} {selectedLeads.length === 1 ? "lead selecionado" : "leads selecionados"}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedLeads([])} 
                  className="h-7 text-[10px] hover:bg-primary/10"
                >
                  Desmarcar todos
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => {
                    if (selectedLeads.length >= 5) {
                      setBatchActionConfirm({ isOpen: true, status: "descartado" });
                    } else {
                      updateStatus.mutate({ ids: selectedLeads, status: "descartado" });
                    }
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                  Descartar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => {
                    if (selectedLeads.length >= 5) {
                      setBatchActionConfirm({ isOpen: true, status: "convertido" });
                    } else {
                      updateStatus.mutate({ ids: selectedLeads, status: "convertido" });
                    }
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Converter
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Apagar
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : !filteredLeads.length ? (
          <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-xl">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum lead encontrado</p>
            {hasActiveFilters && (
              <Button variant="link" size="sm" onClick={clearFilters} className="mt-1">
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[40px] px-3">
                      <Checkbox 
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead className="w-[24%]">Lead</TableHead>
                    <TableHead className="w-[18%]">Contato</TableHead>
                    <TableHead className="w-[14%]">Interesse</TableHead>
                    <TableHead className="w-[18%]">Bairro / Tipo</TableHead>
                    <TableHead className="w-[10%]">Data</TableHead>
                    <TableHead className="w-[10%] text-right">Ação</TableHead>
                    <TableHead className="w-[12%] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const status = (lead.status as LeadStatus) ?? "novo";
                    const cfg = STATUS_CONFIG[status];
                    const isSelected = selectedLeads.includes(lead.id);
                    return (
                      <TableRow
                        key={lead.id}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/40'}`}
                        onClick={() => { setSelectedLeadId(lead.id); setInitialTab("historico"); setSheetOpen(true); }}
                      >
                        <TableCell className="align-top py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectLead(lead.id)}
                            aria-label={`Selecionar lead ${lead.nome}`}
                          />
                        </TableCell>
                        <TableCell className="align-top py-3">
                          <div className="font-medium text-foreground truncate">
                            {lead.nome ?? <span className="italic text-muted-foreground">Sem nome</span>}
                          </div>
                          {lead.mensagem_original && (
                            <div className="text-xs text-muted-foreground italic line-clamp-1 max-w-[280px]">
                              "{lead.mensagem_original}"
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="align-top py-3">
                          {lead.telefone ? (
                            <a
                              href={`https://wa.me/${lead.telefone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              {lead.telefone}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              sem telefone
                            </span>
                          )}
                          {lead.email && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="align-top py-3">
                          {lead.interesse ? (
                            <Badge variant="secondary" className="text-[10px]">
                              {INTERESSE_MAP[lead.interesse] ?? lead.interesse}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="align-top py-3">
                          <div className="text-sm truncate">{lead.bairro_interesse || <span className="text-muted-foreground">—</span>}</div>
                          {lead.tipo_imovel && (
                            <div className="text-xs text-muted-foreground truncate">{lead.tipo_imovel}</div>
                          )}
                        </TableCell>

                        <TableCell className="align-top py-3">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(lead.created_at)}
                          </span>
                        </TableCell>

                        <TableCell className="align-top py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={status}
                            onValueChange={(val) =>
                              updateStatus.mutate({ id: lead.id, status: val as LeadStatus })
                            }
                          >
                            <SelectTrigger
                              className={`h-7 w-28 text-xs ml-auto border ${cfg.className}`}
                            >
                              <SelectValue>{cfg.label}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="novo">Novo</SelectItem>
                              <SelectItem value="contatado">Contatado</SelectItem>
                              <SelectItem value="convertido">Convertido</SelectItem>
                              <SelectItem value="descartado">Descartado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>

      <LeadDetailSheet
        lead={(leads?.find((l) => l.id === selectedLeadId) as never) ?? null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir leads permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente os {selectedLeads.length} leads selecionados e todos os seus dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteLeads.mutate(selectedLeads)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog 
        open={batchActionConfirm.isOpen} 
        onOpenChange={(open) => !open && setBatchActionConfirm({ ...batchActionConfirm, isOpen: false })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação em lote</AlertDialogTitle>
            <AlertDialogDescription>
              Você selecionou {selectedLeads.length} leads. Tem certeza que deseja alterá-los para 
              <strong> {batchActionConfirm.status === "convertido" ? "Convertido" : "Descartado"}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (batchActionConfirm.status) {
                  updateStatus.mutate({ ids: selectedLeads, status: batchActionConfirm.status });
                  setBatchActionConfirm({ isOpen: false, status: null });
                }
              }}
            >
              Confirmar alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
