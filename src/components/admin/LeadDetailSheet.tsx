import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  StickyNote,
  Bot,
  User,
  Trash2,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Home,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WHATSAPP_TEMPLATES, buildWhatsappLink, openWhatsapp } from "@/lib/whatsapp-templates";

interface Lead {
  id: string;
  nome: string | null;
  telefone: string | null;
  email?: string | null;
  interesse?: string | null;
  bairro_interesse?: string | null;
  tipo_imovel?: string | null;
  faixa_preco?: string | null;
  mensagem_original?: string | null;
  status?: string | null;
  created_at: string;
  next_followup_at?: string | null;
  last_contact_at?: string | null;
  lead_score?: string | null;
  objetivo?: string | null;
  prazo_compra?: string | null;
  orcamento_max?: number | null;
  resumo_ia?: string | null;
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "historico" | "notas" | "conversa";
}

const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
};

type TimelineEvent = {
  id: string;
  at: string;
  kind: "lead_created" | "message_user" | "message_bot" | "note" | "contact" | "match" | "followup_set";
  title: string;
  body?: string;
  meta?: string;
};

export default function LeadDetailSheet({ lead, open, onOpenChange, defaultTab = "historico" }: Props) {
  const qc = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [followup, setFollowup] = useState("");

  const { data: notes } = useQuery({
    queryKey: ["lead_notes", lead?.id],
    enabled: !!lead?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", lead!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: conversation } = useQuery({
    queryKey: ["lead_conversations", lead?.id],
    enabled: !!lead?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_conversations")
        .select("*")
        .eq("lead_id", lead!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: matches } = useQuery({
    queryKey: ["lead_matches_for_lead", lead?.id],
    enabled: !!lead?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_matches")
        .select("id, score, status, match_reasons, created_at, updated_at, imovel_id, imoveis(titulo, bairro, preco)")
        .eq("lead_id", lead!.id)
        .order("score", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("lead_notes").insert({ lead_id: lead!.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewNote("");
      qc.invalidateQueries({ queryKey: ["lead_notes", lead?.id] });
      toast.success("Nota adicionada");
    },
    onError: () => toast.error("Erro ao adicionar nota"),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead_notes", lead?.id] }),
  });

  const updateLead = useMutation({
    mutationFn: async (patch: { next_followup_at?: string | null; last_contact_at?: string | null }) => {
      const { error } = await supabase.from("leads_maria").update(patch).eq("id", lead!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads_maria"] });
      toast.success("Salvo");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  // Timeline unificada — merge cronológico de todos os eventos do lead
  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!lead) return [];
    const events: TimelineEvent[] = [];

    events.push({
      id: `created-${lead.id}`,
      at: lead.created_at,
      kind: "lead_created",
      title: "Lead capturado",
      body: lead.mensagem_original ?? undefined,
      meta: lead.bairro_interesse ?? undefined,
    });

    conversation?.forEach((m: any) => {
      events.push({
        id: `msg-${m.id}`,
        at: m.created_at,
        kind: m.role === "user" ? "message_user" : "message_bot",
        title: m.role === "user" ? `${lead.nome ?? "Visitante"} enviou mensagem` : "MarIA respondeu",
        body: m.content,
      });
    });

    notes?.forEach((n: any) => {
      events.push({
        id: `note-${n.id}`,
        at: n.created_at,
        kind: "note",
        title: "Anotação interna",
        body: n.content,
      });
    });

    matches?.forEach((m: any) => {
      events.push({
        id: `match-${m.id}`,
        at: m.created_at,
        kind: "match",
        title: `Match ${m.score} pts — ${m.imoveis?.titulo ?? "Imóvel"}`,
        meta: m.status,
        body: (m.match_reasons || []).join(" · "),
      });
    });

    if (lead.last_contact_at) {
      events.push({
        id: `contact-${lead.id}`,
        at: lead.last_contact_at,
        kind: "contact",
        title: "Contato realizado",
        meta: "Marcado manualmente",
      });
    }

    if (lead.next_followup_at) {
      events.push({
        id: `followup-${lead.id}`,
        at: lead.next_followup_at,
        kind: "followup_set",
        title: "Follow-up agendado",
        meta: "Próximo contato",
      });
    }

    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [lead, conversation, notes, matches]);

  if (!lead) return null;

  const waLink = lead.telefone ? buildWhatsappLink(lead.telefone, "") : null;

  const iconFor = (kind: TimelineEvent["kind"]) => {
    switch (kind) {
      case "lead_created":
        return <Sparkles className="w-3.5 h-3.5 text-primary" />;
      case "message_user":
        return <User className="w-3.5 h-3.5 text-blue-600" />;
      case "message_bot":
        return <Bot className="w-3.5 h-3.5 text-purple-600" />;
      case "note":
        return <StickyNote className="w-3.5 h-3.5 text-amber-600" />;
      case "contact":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "match":
        return <Home className="w-3.5 h-3.5 text-fuchsia-600" />;
      case "followup_set":
        return <Calendar className="w-3.5 h-3.5 text-orange-600" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{lead.nome ?? "Lead anônimo"}</SheetTitle>
          <SheetDescription>
            Lead desde {formatDateTime(lead.created_at)}
          </SheetDescription>
        </SheetHeader>

        {/* Contato */}
        <section className="mt-4 space-y-2 text-sm">
          {waLink ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent hover:underline">
              <Phone className="w-4 h-4" /> {lead.telefone}
            </a>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground italic">
              <Phone className="w-4 h-4" /> Sem telefone (lead anônimo)
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" /> {lead.email}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {lead.interesse && <Badge variant="secondary" className="text-[10px]">{lead.interesse}</Badge>}
            {lead.bairro_interesse && <Badge variant="secondary" className="text-[10px]">{lead.bairro_interesse}</Badge>}
            {lead.tipo_imovel && <Badge variant="secondary" className="text-[10px]">{lead.tipo_imovel}</Badge>}
            {lead.faixa_preco && <Badge variant="secondary" className="text-[10px]">{lead.faixa_preco}</Badge>}
          </div>

          {lead.telefone && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2">
                  <MessageCircle className="w-4 h-4" /> Enviar mensagem pronta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[320px]">
                <DropdownMenuLabel>Templates de WhatsApp</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {WHATSAPP_TEMPLATES.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => {
                      openWhatsapp(lead.telefone!, t.build(lead));
                      // Marca contato automaticamente ao abrir o WhatsApp
                      updateLead.mutate({ last_contact_at: new Date().toISOString() });
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
        </section>

        <Separator className="my-4" />

        {/* Follow-up */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Próximo follow-up
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Amanhã", days: 1 },
              { label: "+3 dias", days: 3 },
              { label: "+1 semana", days: 7 },
              { label: "+2 semanas", days: 14 },
            ].map((opt) => (
              <Button
                key={opt.days}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + opt.days);
                  d.setHours(10, 0, 0, 0);
                  updateLead.mutate({ next_followup_at: d.toISOString() });
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={followup || toLocalInput(lead.next_followup_at)}
              onChange={(e) => setFollowup(e.target.value)}
              className="h-9 text-sm"
            />
            <Button
              size="sm"
              onClick={() => {
                const iso = followup ? new Date(followup).toISOString() : null;
                updateLead.mutate({ next_followup_at: iso });
              }}
            >
              Salvar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Agendado: {formatDateTime(lead.next_followup_at)} · Último contato: {formatDateTime(lead.last_contact_at)}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => updateLead.mutate({ last_contact_at: new Date().toISOString() })}
          >
            Marcar contato feito agora
          </Button>
        </section>

        <Separator className="my-4" />

        {/* Tabs com histórico unificado, notas, conversa */}
        <Tabs key={`${lead.id}-${defaultTab}`} defaultValue={defaultTab} className="w-full pb-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="historico" className="text-xs gap-1">
              <Activity className="w-3.5 h-3.5" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="notas" className="text-xs gap-1">
              <StickyNote className="w-3.5 h-3.5" /> Notas
              {notes?.length ? <span className="ml-1 text-[10px] opacity-70">({notes.length})</span> : null}
            </TabsTrigger>
            <TabsTrigger value="conversa" className="text-xs gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> Chat
              {conversation?.length ? <span className="ml-1 text-[10px] opacity-70">({conversation.length})</span> : null}
            </TabsTrigger>
          </TabsList>

          {/* TIMELINE UNIFICADA */}
          <TabsContent value="historico" className="mt-3">
            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">
                Sem interações registradas ainda.
              </p>
            ) : (
              <div className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-px before:bg-border">
                {timeline.map((ev) => (
                  <div key={ev.id} className="relative">
                    <span className="absolute -left-[18px] top-1 w-3.5 h-3.5 rounded-full bg-background border border-border flex items-center justify-center">
                      {iconFor(ev.kind)}
                    </span>
                    <div className="bg-muted/40 rounded-md px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium">{ev.title}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDateTime(ev.at)}
                        </span>
                      </div>
                      {ev.body && (
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-4">
                          {ev.body}
                        </p>
                      )}
                      {ev.meta && (
                        <Badge variant="outline" className="text-[9px] mt-1.5 h-4">
                          {ev.meta}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* NOTAS */}
          <TabsContent value="notas" className="mt-3 space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ex: Cliente quer visitar sábado de manhã..."
              rows={2}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={() => newNote.trim() && addNote.mutate(newNote.trim())}
              disabled={!newNote.trim() || addNote.isPending}
            >
              Adicionar nota
            </Button>

            <div className="space-y-2 mt-3">
              {notes?.length ? notes.map((n) => (
                <div key={n.id} className="bg-muted/50 rounded-lg p-3 text-sm group relative">
                  <p className="whitespace-pre-wrap pr-7">{n.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(n.created_at)}</p>
                  <button
                    onClick={() => deleteNote.mutate(n.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                    aria-label="Remover nota"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground italic">Nenhuma anotação ainda.</p>
              )}
            </div>
          </TabsContent>

          {/* CONVERSA MARIA */}
          <TabsContent value="conversa" className="mt-3">
            {conversation?.length ? (
              <div className="space-y-2">
                {conversation.map((m: any) => (
                  <div
                    key={m.id}
                    className={`rounded-lg p-2.5 text-sm ${
                      m.role === "user" ? "bg-primary/10 ml-6" : "bg-muted/50 mr-6"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                      {m.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      {m.role === "user" ? (lead.nome ?? "Visitante") : "MarIA"} · {formatDateTime(m.created_at)}
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {lead.mensagem_original ? `"${lead.mensagem_original}"` : "Sem histórico de conversa salvo."}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
