import { useState } from "react";
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
import { Phone, Mail, MessageSquare, Calendar, StickyNote, Bot, User, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function LeadDetailSheet({ lead, open, onOpenChange }: Props) {
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

  if (!lead) return null;

  const waLink = lead.telefone ? `https://wa.me/${lead.telefone.replace(/\D/g, "")}` : null;

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
        </section>

        <Separator className="my-4" />

        {/* Follow-up */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Próximo follow-up
          </h3>
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
            Último contato: {formatDateTime(lead.last_contact_at)}
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

        {/* Notas */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-primary" /> Anotações
          </h3>
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
        </section>

        <Separator className="my-4" />

        {/* Conversa MarIA */}
        <section className="space-y-2 pb-6">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Conversa com a MarIA
          </h3>
          {conversation?.length ? (
            <div className="space-y-2">
              {conversation.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-primary/10 ml-6"
                      : "bg-muted/50 mr-6"
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
        </section>
      </SheetContent>
    </Sheet>
  );
}
