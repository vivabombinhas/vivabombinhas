import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, Phone, Mail, Filter, LogOut, FileSpreadsheet, ClipboardList, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import LeadDetailSheet from "@/components/admin/LeadDetailSheet";

type LeadStatus = "novo" | "contatado" | "convertido" | "descartado" | "anonimo";

const STATUS_CONFIG: Record<LeadStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  novo: { label: "Novo", variant: "default" },
  contatado: { label: "Contatado", variant: "secondary" },
  convertido: { label: "Convertido", variant: "outline" },
  descartado: { label: "Destructive", variant: "destructive" },
  anonimo: { label: "Anônimo", variant: "outline" },
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  novo: "bg-blue-500/10 text-blue-700 border-blue-200",
  contatado: "bg-amber-500/10 text-amber-700 border-amber-200",
  convertido: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  descartado: "bg-red-500/10 text-red-700 border-red-200",
  anonimo: "bg-muted text-muted-foreground border-border",
};

const INTERESSE_MAP: Record<string, string> = {
  compra: "Compra",
  aluguel_anual: "Aluguel Anual",
  temporada: "Temporada",
};

export default function AdminLeads() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAnonimos, setShowAnonimos] = useState<boolean>(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
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
        // Por padrão, esconde leads anônimos (sem nome/telefone)
        query = query.neq("status", "anonimo");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingMatches } = useQuery({
    queryKey: ["lead_matches_pending_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("lead_matches")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase
        .from("leads_maria")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads_maria"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const counts = {
    all: leads?.length ?? 0,
    novo: leads?.filter((l) => l.status === "novo").length ?? 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Leads MarIA
            </h1>
            <p className="text-xs text-muted-foreground">
              {counts.all} leads • {counts.novo} novos
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contatado">Contatado</SelectItem>
                <SelectItem value="convertido">Convertido</SelectItem>
                <SelectItem value="descartado">Descartado</SelectItem>
                <SelectItem value="anonimo">Anônimo</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showAnonimos ? "default" : "ghost"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setShowAnonimos((v) => !v)}
              title="Mostrar leads anônimos (sem nome/telefone)"
            >
              {showAnonimos ? "Ocultar anônimos" : "Ver anônimos"}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !leads?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-card border border-border rounded-xl p-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {/* Lead info - clickable */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedLeadId(lead.id); setSheetOpen(true); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { setSelectedLeadId(lead.id); setSheetOpen(true); } }}
                    className="flex-1 min-w-0 space-y-1.5 text-left cursor-pointer hover:opacity-80 transition"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {lead.nome ?? <span className="italic text-muted-foreground">Sem nome (anônimo)</span>}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 ${STATUS_COLORS[(lead.status as LeadStatus) ?? "novo"]}`}
                      >
                        {STATUS_CONFIG[(lead.status as LeadStatus) ?? "novo"]?.label ?? "Novo"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {lead.telefone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          <a href={`https://wa.me/${lead.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent hover:underline">
                            {lead.telefone}
                          </a>
                        </span>
                      ) : (
                        <span className="italic">Sem telefone</span>
                      )}
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {lead.email}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap text-xs">
                      {lead.interesse && (
                        <Badge variant="secondary" className="text-[10px]">
                          {INTERESSE_MAP[lead.interesse] ?? lead.interesse}
                        </Badge>
                      )}
                      {lead.bairro_interesse && (
                        <Badge variant="secondary" className="text-[10px]">
                          {lead.bairro_interesse}
                        </Badge>
                      )}
                      {lead.tipo_imovel && (
                        <Badge variant="secondary" className="text-[10px]">
                          {lead.tipo_imovel}
                        </Badge>
                      )}
                      {lead.faixa_preco && (
                        <Badge variant="secondary" className="text-[10px]">
                          {lead.faixa_preco}
                        </Badge>
                      )}
                    </div>

                    {lead.mensagem_original && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2">
                        "{lead.mensagem_original}"
                      </p>
                    )}

                    <p className="text-[10px] text-muted-foreground/60">
                      {new Date(lead.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Status selector */}
                  <Select
                    value={(lead.status as LeadStatus) ?? "novo"}
                    onValueChange={(val) =>
                      updateStatus.mutate({ id: lead.id, status: val as LeadStatus })
                    }
                  >
                    <SelectTrigger className="w-32 h-8 text-xs shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="contatado">Contatado</SelectItem>
                      <SelectItem value="convertido">Convertido</SelectItem>
                      <SelectItem value="descartado">Descartado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <LeadDetailSheet
        lead={(leads?.find((l) => l.id === selectedLeadId) as never) ?? null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
