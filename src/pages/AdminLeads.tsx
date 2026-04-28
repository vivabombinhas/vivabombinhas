import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, Phone, Mail, Filter, LogOut, FileSpreadsheet, ClipboardList, Sparkles } from "lucide-react";
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

type LeadStatus = "novo" | "contatado" | "convertido" | "descartado";

const STATUS_CONFIG: Record<LeadStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  novo: { label: "Novo", variant: "default" },
  contatado: { label: "Contatado", variant: "secondary" },
  convertido: { label: "Convertido", variant: "outline" },
  descartado: { label: "Destructive", variant: "destructive" },
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  novo: "bg-blue-500/10 text-blue-700 border-blue-200",
  contatado: "bg-amber-500/10 text-amber-700 border-amber-200",
  convertido: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  descartado: "bg-red-500/10 text-red-700 border-red-200",
};

const INTERESSE_MAP: Record<string, string> = {
  compra: "Compra",
  aluguel_anual: "Aluguel Anual",
  temporada: "Temporada",
};

export default function AdminLeads() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads_maria", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("leads_maria")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as LeadStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Leads MarIA
            </h1>
            <p className="text-xs text-muted-foreground">
              {counts.all} leads • {counts.novo} novos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/importar-link">
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Importar por link</span>
              </Button>
            </Link>
            <Link to="/admin/importar">
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            </Link>
            <Link to="/admin/submissions">
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Submissões</span>
              </Button>
            </Link>
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
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-destructive"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/admin/leads";
              }}
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
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
                  {/* Lead info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{lead.nome}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 ${STATUS_COLORS[(lead.status as LeadStatus) ?? "novo"]}`}
                      >
                        {(lead.status as LeadStatus) === "novo" ? "Novo" : (lead.status as LeadStatus) === "contatado" ? "Contatado" : (lead.status as LeadStatus) === "convertido" ? "Convertido" : "Descartado"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <a href={`https://wa.me/55${lead.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                          {lead.telefone}
                        </a>
                      </span>
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
    </div>
  );
}
