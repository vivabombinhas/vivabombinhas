import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Phone, UserCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
  maria_core_session_id?: string | null;
  [key: string]: unknown;
};


type ColumnDef = { key: string; label: string };

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef[];
  onStatusChange: (lead: Lead, newStatus: string) => void;
  onAssume?: (lead: Lead) => void;
}

function digits(s?: string | null) {
  return (s || "").replace(/\D/g, "");
}

function whatsappUrl(tel?: string | null) {
  const d = digits(tel);
  if (!d) return null;
  const withCc = d.startsWith("55") ? d : `55${d}`;
  return `https://wa.me/${withCc}`;
}

function orcamentoLabel(l: Lead) {
  if (l.faixa_preco) return l.faixa_preco;
  if (l.orcamento_min || l.orcamento_max) {
    const fmt = (n: number | null) =>
      n
        ? n.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          })
        : "?";
    return `${fmt(l.orcamento_min)} – ${fmt(l.orcamento_max)}`;
  }
  return null;
}

export function LeadTranscriptSheet({
  lead,
  open,
  onOpenChange,
  columns,
  onStatusChange,
  onAssume,
}: Props) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["lead_transcript", lead?.id],
    enabled: !!lead?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maria_messages")
        .select("id, session_id, role, content, created_at, mode, latency_ms")
        .eq("lead_id", lead!.id)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const wa = whatsappUrl(lead?.telefone);
  const orc = lead ? orcamentoLabel(lead) : null;
  const next = lead?.next_action_suggested || lead?.proximo_passo_sugerido;

  const sessions = new Map<string, typeof messages>();
  for (const m of messages ?? []) {
    const k = m.session_id || "sem-sessao";
    if (!sessions.has(k)) sessions.set(k, [] as any);
    (sessions.get(k) as any).push(m);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            {lead?.nome || "Sem nome"}
            {lead?.finalidade && (
              <Badge variant="secondary">{lead.finalidade}</Badge>
            )}
            {lead?.status && <Badge variant="outline">{lead.status}</Badge>}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {lead?.telefone || "sem telefone"}
            {lead?.bairro_interesse ? ` · ${lead.bairro_interesse}` : ""}
            {orc ? ` · ${orc}` : ""}
          </SheetDescription>
        </SheetHeader>

        {lead && (
          <div className="p-4 border-b space-y-3 bg-muted/30">
            {lead.resumo_ia && (
              <div className="text-sm">
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  Resumo IA
                </div>
                <p className="whitespace-pre-wrap">{lead.resumo_ia}</p>
              </div>
            )}
            {next && (
              <div className="text-sm bg-primary/5 border border-primary/20 rounded p-2">
                <span className="font-medium">Próximo passo:</span> {next}
              </div>
            )}
            <div className="flex flex-wrap gap-2 items-center">
              {wa && (
                <Button size="sm" asChild>
                  <a href={wa} target="_blank" rel="noopener noreferrer">
                    <Phone className="w-4 h-4" /> Abrir WhatsApp
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </Button>
              )}
              {onAssume && lead.status !== "contatado" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAssume(lead)}
                >
                  <UserCheck className="w-4 h-4" /> Assumir atendimento
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Etapa:</span>
                <Select
                  value={lead.status || "novo"}
                  onValueChange={(v) => onStatusChange(lead, v)}
                >
                  <SelectTrigger className="h-8 text-xs w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 pt-3 pb-1 flex items-center gap-2 text-sm font-semibold">
          <MessageCircle className="w-4 h-4" /> Conversa
          {messages && (
            <Badge variant="outline" className="text-[10px]">
              {messages.length} msgs
            </Badge>
          )}
        </div>
        <ScrollArea className="flex-1 px-4 pb-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground p-4">
              Carregando conversa...
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              Nenhuma mensagem encontrada para este lead.
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(sessions.entries()).map(([sid, msgs]) => (
                <div key={sid} className="space-y-2">
                  <div className="text-[10px] font-mono text-muted-foreground border-b pb-1">
                    session: {sid.slice(0, 8)}…
                  </div>
                  {(msgs as any[]).map((m) => (
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
                            {m.role === "assistant"
                              ? "MarIA"
                              : m.role === "user"
                                ? "Usuário"
                                : m.role}
                          </span>
                          {m.mode && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4"
                            >
                              {m.mode}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(m.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap break-words">
                        {m.content || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
