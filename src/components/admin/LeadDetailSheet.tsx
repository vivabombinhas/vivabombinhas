import { useEffect, useMemo, useState } from "react";
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
  orcamento_min?: number | null;
  orcamento_max?: number | null;
  resumo_ia?: string | null;
  capital_disponivel?: number | null;
  bens_para_permuta?: string | null;
  proximo_passo_sugerido?: string | null;
  chat_history?: any[] | null;
  feedback_corretor?: string | null;
  observacao_interna?: string | null;
  session_id?: string | null;
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
  kind: "lead_created" | "message_user" | "message_bot" | "note" | "contact" | "match" | "followup_set" | "status_change";
  title: string;
  body?: string;
  meta?: string;
};

export default function LeadDetailSheet({ lead, open, onOpenChange, defaultTab = "historico" }: Props) {
  const qc = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [followup, setFollowup] = useState("");
  const [customMessage, setCustomMessage] = useState("");

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
    queryKey: ["maria_messages", lead?.id],
    enabled: !!lead?.id && open,
    queryFn: async () => {
      // 1. Try to fetch from maria_messages table first (real-time history)
      const { data: msgData, error: msgError } = await supabase
        .from("maria_messages")
        .select("*")
        .or(`lead_id.eq.${lead!.id}${lead?.session_id ? `,session_id.eq.${lead.session_id}` : ''}`)
        .order("created_at", { ascending: true });
      
      if (!msgError && msgData && msgData.length > 0) {
        // Deduplicate messages by content and role if necessary, though created_at should handle it
        return msgData;
      }

      // 3. Fallback to legacy lead_conversations
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

  const { data: statusAudit } = useQuery({
    queryKey: ["lead_status_audit", lead?.id],
    enabled: !!lead?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_status_audit")
        .select("*")
        .eq("lead_id", lead!.id)
        .order("created_at", { ascending: false });
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
    mutationFn: async (patch: { 
      next_followup_at?: string | null; 
      last_contact_at?: string | null;
      feedback_corretor?: string | null;
      observacao_interna?: string | null;
    }) => {
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

    // Priority 1: maria_messages (tabela dedicada de histórico)
    if (conversation && conversation.length > 0) {
      conversation.forEach((m: any) => {
        events.push({
          id: `maria-msg-${m.id}`,
          at: m.created_at,
          kind: m.role === "user" ? "message_user" : "message_bot",
          title: m.role === "user" ? `${lead.nome ?? "Visitante"} enviou mensagem` : "MarIA respondeu",
          body: m.content,
        });
      });
    }
    
    // Priority 2: chat_history persistido no JSONB (apenas se não houver mensagens na maria_messages para evitar duplicidade)
    if ((!conversation || conversation.length === 0) && lead.chat_history && Array.isArray(lead.chat_history)) {
      lead.chat_history.forEach((m: any, idx: number) => {
        if (m.content?.startsWith("[contexto")) return;
        events.push({
          id: `chat-${lead.id}-${idx}`,
          at: m.timestamp || lead.created_at,
          kind: m.role === "user" ? "message_user" : "message_bot",
          title: m.role === "user" ? `${lead.nome ?? "Visitante"} enviou mensagem` : "MarIA respondeu",
          body: m.content,
        });
      });
    }

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

    statusAudit?.forEach((a: any) => {
      const statusPart = a.old_status !== a.new_status
        ? `Status: ${a.old_status ?? "—"} → ${a.new_status ?? "—"}`
        : null;
      const scorePart = (a.old_score ?? null) !== (a.new_score ?? null)
        ? `Score: ${a.old_score ?? "—"} → ${a.new_score ?? "—"}`
        : null;
      const title = [statusPart, scorePart].filter(Boolean).join(" · ") || "Atualização de status";
      events.push({
        id: `audit-${a.id}`,
        at: a.created_at,
        kind: "status_change",
        title,
        body: a.trigger_message ?? undefined,
        meta: a.source ?? undefined,
      });
    });

    // Ordenação cronológica (mais recentes primeiro)
    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [lead, conversation, notes, matches, statusAudit]);

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
      case "status_change":
        return <Activity className="w-3.5 h-3.5 text-indigo-600" />;
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

          {lead.resumo_ia && (
            <div className={`mt-4 p-3 border rounded-lg ${
              (lead.proximo_passo_sugerido === 'analise_daniel' || lead.lead_score === 'Premium')
                ? "bg-amber-500/5 border-amber-500/30 shadow-sm"
                : "bg-primary/5 border-primary/20"
            }`}>
              <h4 className={`text-[10px] font-bold uppercase mb-1 flex items-center gap-1 ${
                (lead.proximo_passo_sugerido === 'analise_daniel' || lead.lead_score === 'Premium')
                  ? "text-amber-700"
                  : "text-primary"
              }`}>
                <Sparkles className="w-3 h-3" /> Resumo Estratégico MarIA
              </h4>
              <p className="text-sm italic text-foreground leading-relaxed">"{lead.resumo_ia}"</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4">
             <div className="p-2 bg-muted rounded-md">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Objetivo</p>
                <p className="text-sm font-medium capitalize">{lead.objetivo?.replace('_', ' ') || "—"}</p>
             </div>
             <div className="p-2 bg-muted rounded-md">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Prazo</p>
                <p className="text-sm font-medium capitalize">{lead.prazo_compra?.replace('_', ' ') || "—"}</p>
             </div>
             {lead.capital_disponivel && (
               <div className="p-2 bg-muted rounded-md col-span-2">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold text-emerald-600">Capital Disponível</p>
                  <p className="text-sm font-bold text-emerald-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lead.capital_disponivel)}
                  </p>
               </div>
             )}
             {lead.bens_para_permuta && (
               <div className="p-2 bg-muted rounded-md col-span-2">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold text-amber-600">Bens para Permuta</p>
                  <p className="text-sm font-medium">{lead.bens_para_permuta}</p>
               </div>
             )}
             <div className="p-2 bg-muted rounded-md">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Orçamento</p>
                <p className="text-sm font-medium">
                  {lead.orcamento_min || lead.orcamento_max
                    ? `${lead.orcamento_min ? 'de R$ ' + (lead.orcamento_min/1000000).toFixed(1) + 'M ' : ''}${lead.orcamento_max ? 'até R$ ' + (lead.orcamento_max/1000000).toFixed(1) + 'M' : ''}`
                    : lead.faixa_preco || "—"}
                </p>
              </div>
              <div className="p-2 bg-muted rounded-md col-span-2">
                 <p className="text-[9px] text-muted-foreground uppercase font-bold">ID da Sessão / Origem</p>
                 <p className="text-[10px] font-mono break-all">{lead.id.slice(0, 8)}... / MarIA Chat</p>
              </div>
             <div className="p-2 bg-muted rounded-md">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Lead Score</p>
                <Badge variant="outline" className={`mt-0.5 text-[10px] font-bold ${lead.lead_score === 'Premium' ? 'bg-amber-500 text-white' : 'border-primary/30'}`}>
                  {lead.lead_score || "—"}
                </Badge>
             </div>
          </div>

          <div className="flex gap-2 mt-2">
            <Button 
              variant={lead.feedback_corretor === "valido" ? "default" : "outline"}
              className={`flex-1 h-8 text-xs ${lead.feedback_corretor === "valido" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              onClick={() => updateLead.mutate({ feedback_corretor: "valido" })}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" /> Lead Válido
            </Button>
            <Button 
              variant={lead.feedback_corretor === "invalido" ? "destructive" : "outline"}
              className="flex-1 h-8 text-xs"
              onClick={() => updateLead.mutate({ feedback_corretor: "invalido" })}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Lead Inválido
            </Button>
          </div>


          {lead.telefone && (
            <div className="flex flex-col gap-2 mt-2">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <MessageCircle className="w-4 h-4" /> Mensagem pronta
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

              <div className="p-3 border rounded-lg bg-card mt-2">
                <h4 className="text-[10px] font-bold uppercase mb-2 text-muted-foreground flex items-center gap-1">
                   <MessageSquare className="w-3 h-3" /> Mensagem Personalizada
                </h4>
                <Textarea 
                  className="text-xs min-h-[100px] mb-2"
                  placeholder="Escreva sua mensagem aqui..."
                  value={customMessage || `Olá ${lead.nome?.split(' ')[0] || ''}, aqui é o Daniel do VIV Bombinhas. A MarIA me passou seu interesse em ${lead.tipo_imovel || 'imóveis'} em ${lead.bairro_interesse || 'Bombinhas'}. Como posso te ajudar?`}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full text-xs h-8 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => {
                    const msg = customMessage || `Olá ${lead.nome?.split(' ')[0] || ''}, aqui é o Daniel do VIV Bombinhas. A MarIA me passou seu interesse em ${lead.tipo_imovel || 'imóveis'} em ${lead.bairro_interesse || 'Bombinhas'}. Como posso te ajudar?`;
                    openWhatsapp(lead.telefone!, msg);
                    updateLead.mutate({ last_contact_at: new Date().toISOString() });
                  }}
                >
                  <Phone className="w-3 h-3 mr-1" /> Abrir no WhatsApp
                </Button>
              </div>
            </div>
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
                        <p className={`text-xs mt-1 whitespace-pre-wrap ${
                          ev.kind === 'note' ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}>
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
            {Array.isArray(lead.chat_history) && lead.chat_history.length > 0 ? (
              <div className="space-y-2">
                {lead.chat_history.map((m: any, idx: number) => {
                  if (m.content?.startsWith("[contexto")) return null;
                  return (
                    <div
                      key={`chat-msg-${idx}`}
                      className={`rounded-lg p-2.5 text-sm ${
                        m.role === "user" ? "bg-primary/10 ml-6" : "bg-muted/50 mr-6"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                        {m.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        {m.role === "user" ? (lead.nome ?? "Visitante") : "MarIA"} · {m.timestamp ? formatDateTime(m.timestamp) : formatDateTime(lead.created_at)}
                      </div>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  );
                })}
              </div>
            ) : conversation?.length ? (
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
