import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, Send, Calendar as CalendarIcon, MessageCircle, RefreshCw, CheckCircle2, UserPlus, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bot,
  Filter,
  Flame,
  Inbox,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { buildPersonalizedMessage, type ViewedProperty } from "@/lib/whatsapp-templates";
import { sendWhatsappMessage } from "@/lib/send-whatsapp-message";

// Invoca uma edge function e extrai a mensagem de erro real que o MarIA Core devolveu.
// A edge maria-core-whatsapp responde com { status, error, ... } em corpo JSON,
// e supabase-js lança FunctionsHttpError quando status != 2xx — o corpo fica em error.context.
async function invokeCore(
  fnName: string,
  body: Record<string, unknown>,
): Promise<{ data: any }> {
  const { data, error } = await supabase.functions.invoke(fnName, { body });
  if (error) {
    let humano = "";
    try {
      const ctx: any = (error as any).context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        humano = parsed?.error || parsed?.message || "";
      } else if (ctx && typeof ctx.text === "function") {
        const raw = await ctx.text();
        try { humano = JSON.parse(raw)?.error || raw; } catch { humano = raw; }
      }
    } catch { /* ignore */ }
    throw new Error(humano || error.message || "Falha ao chamar MarIA Core");
  }
  const inner: any = data;
  if (inner && inner.status && inner.status !== "ok") {
    throw new Error(inner.error || "MarIA Core recusou a operação");
  }
  return { data };
}



type Lead = any;

const priorityScore = (l: Lead) => {
  let s = 0;
  if (l.quer_falar_daniel) s += 100;
  if (["contatado", "novo"].includes(l.status)) s += 40;
  if (["compra", "investimento", "morar"].includes((l.finalidade || "").toLowerCase())) s += 30;
  if (l.next_action_suggested) s += 15;
  if (l.resumo_ia) s += 10;
  return s;
};

const temperatura = (score: number) => {
  if (score >= 100) return { label: "Quente", cls: "bg-red-500 text-white", icon: Flame };
  if (score >= 40) return { label: "Morno", cls: "bg-amber-500 text-white", icon: Flame };
  return { label: "Novo", cls: "bg-slate-400 text-white", icon: Sparkles };
};

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const isToday = (d?: string | null) => {
  if (!d) return false;
  const dt = new Date(d);
  const now = new Date();
  return (
    dt.getDate() === now.getDate() &&
    dt.getMonth() === now.getMonth() &&
    dt.getFullYear() === now.getFullYear()
  );
};

export default function AdminAtendimento() {
  const qc = useQueryClient();
  const { setOpen: setSidebarOpen } = useSidebar();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterFinalidade, setFilterFinalidade] = useState<string>("todas");
  const [onlyHot, setOnlyHot] = useState(false);
  const [followupToday, setFollowupToday] = useState(false);
  const [mobileTab, setMobileTab] = useState<"fila" | "conversa" | "contexto">("fila");
  const [reply, setReply] = useState("");
  const [readyMessage, setReadyMessage] = useState("");
  const [followupCustom, setFollowupCustom] = useState("");
  const [confirmReply, setConfirmReply] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);
  const [confirmHandoff, setConfirmHandoff] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  // Colapsa a sidebar do admin ao entrar no cockpit (uma vez só)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  // Autogrow do textarea (3–8 linhas)
  useEffect(() => {
    const el = replyRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineH = 20; // ~text-xs line-height
    const min = lineH * 3 + 16;
    const max = lineH * 8 + 16;
    el.style.height = Math.min(max, Math.max(min, el.scrollHeight)) + "px";
  }, [reply]);


  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["atendimento_leads"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads_maria")
        .select("*")
        .not("status", "in", "(convertido,descartado,anonimo)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Última mensagem por lead (usado para ordenar a fila por atividade real
  // e destacar conversas ao vivo). Refetch curto para "conversando agora".
  const { data: lastMsgMap = {} } = useQuery<Record<string, string>>({
    queryKey: ["atendimento_last_msgs", leads.map((l: any) => l.id).join(",")],
    enabled: leads.length > 0,
    refetchInterval: 15_000,
    queryFn: async () => {
      const ids = leads.map((l: any) => l.id).filter(Boolean);
      if (!ids.length) return {};
      const { data, error } = await supabase
        .from("maria_messages")
        .select("lead_id, created_at")
        .in("lead_id", ids)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        const lid = (row as any).lead_id as string | null;
        if (!lid) continue;
        if (!map[lid]) map[lid] = (row as any).created_at;
      }
      return map;
    },
  });

  const lastActivityAt = (l: any): number => {
    const fromMsgs = lastMsgMap[l.id];
    const ts = fromMsgs || l.last_contact_at || l.created_at;
    return ts ? new Date(ts).getTime() : 0;
  };

  const statusOptions = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l: any) => l.status && s.add(l.status));
    return Array.from(s);
  }, [leads]);

  const finalidadeOptions = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l: any) => l.finalidade && s.add(l.finalidade));
    return Array.from(s);
  }, [leads]);

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...leads]
      .filter((l: any) => {
        if (filterStatus !== "todos" && l.status !== filterStatus) return false;
        if (filterFinalidade !== "todas" && l.finalidade !== filterFinalidade) return false;
        if (onlyHot && priorityScore(l) < 100) return false;
        if (followupToday && !isToday(l.next_followup_at)) return false;
        if (!q) return true;
        return [l.nome, l.telefone, l.bairro_interesse, l.interesse, l.resumo_ia]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(q));
      })
      .sort((a: any, b: any) => {
        // Ordena por FAIXA de temperatura (Quente > Morno > Novo), não pelo
        // score cru — assim, dentro da mesma faixa, quem mandou mensagem mais
        // recente sobe, mesmo que outro lead tenha score levemente maior.
        const bandRank = (score: number) => (score >= 100 ? 2 : score >= 40 ? 1 : 0);
        const diff = bandRank(priorityScore(b)) - bandRank(priorityScore(a));
        if (diff !== 0) return diff;
        // Desempate por atividade real: última mensagem recebida naquela sessão.
        return lastActivityAt(b) - lastActivityAt(a);
      });
  }, [leads, search, filterStatus, filterFinalidade, onlyHot, followupToday, lastMsgMap]);


  const selected: any = sorted.find((l: any) => l.id === selectedId) || leads.find((l: any) => l.id === selectedId) || null;

  const { data: messages = [] } = useQuery({
    queryKey: ["atendimento_msgs", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const sid = selected?.maria_core_session_id || selected?.session_id;
      if (!sid) return [];
      const { data } = await supabase
        .from("maria_messages")
        .select("id, role, content, created_at, mode")
        .eq("session_id", sid)
        .order("created_at", { ascending: true })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["atendimento_notes", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", selected!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: audit = [] } = useQuery({
    queryKey: ["atendimento_audit", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_status_audit")
        .select("*")
        .eq("lead_id", selected!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["atendimento_matches", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_matches")
        .select("id, score, imoveis(titulo, bairro, preco, quartos, tipo)")
        .eq("lead_id", selected!.id)
        .order("score", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const viewedProperties = useMemo<ViewedProperty[]>(() => {
    return (matches as any[])
      .filter((m) => m.imoveis)
      .map((m) => ({
        titulo: m.imoveis?.titulo ?? null,
        bairro: m.imoveis?.bairro ?? null,
        preco: m.imoveis?.preco ?? null,
        quartos: m.imoveis?.quartos ?? null,
        tipo: m.imoveis?.tipo ?? null,
      }));
  }, [matches]);

  const regenerateReadyMessage = useCallback(() => {
    if (!selected) {
      setReadyMessage("");
      return "";
    }
    const msg = buildPersonalizedMessage(selected as any, viewedProperties);
    setReadyMessage(msg);
    return msg;
  }, [selected, viewedProperties]);

  // Sempre re-sincroniza a mensagem pronta quando o lead selecionado muda
  // ou quando o conteúdo-chave desse lead muda (resumo_ia, imóveis vistos).
  // Usamos uma "assinatura" em string para não depender da identidade do objeto
  // `selected` (que muda a cada refetch), evitando ficar preso em um lead antigo.
  const readySignature = useMemo(() => {
    if (!selected) return "";
    return [
      selected.id,
      selected.resumo_ia ?? "",
      selected.nome ?? "",
      selected.bairro_interesse ?? "",
      selected.tipo_imovel ?? "",
      selected.faixa_preco ?? "",
      viewedProperties.length,
    ].join("|");
  }, [selected, viewedProperties]);

  useEffect(() => {
    if (!selected) {
      setReadyMessage("");
      setFollowupCustom("");
      return;
    }
    setReadyMessage(buildPersonalizedMessage(selected as any, viewedProperties));
    setFollowupCustom("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readySignature]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selected?.id]);

  // Realtime: subscribe to new messages for the current session
  const sessionId = selected?.maria_core_session_id || selected?.session_id;
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`maria_messages:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "maria_messages", filter: `session_id=eq.${sessionId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["atendimento_msgs", selected?.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, selected?.id, qc]);

  useEffect(() => {
    setReply("");
  }, [selected?.id]);

  // Estado WhatsApp (MarIA pausada/atendendo) via MarIA Core
  const phone = selected?.telefone as string | undefined;
  const modeQuery = useQuery({
    queryKey: ["wa_mode", phone],
    enabled: !!phone,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("maria-core-whatsapp", {
        body: { action: "get_mode", phone },
      });
      if (error) throw error;
      const inner: any = (data as any)?.data ?? data;
      return { paused: !!inner?.maria_paused };
    },
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Nenhum lead selecionado");
      const sid = selected?.maria_core_session_id || selected?.session_id;
      if (!sid) throw new Error("Lead sem sessão vinculada");
      if (!phone) throw new Error("Lead sem telefone");
      // Envio + registro no CRM acontecem na edge function (service role),
      // via helper compartilhado com o painel de Leads.
      return await sendWhatsappMessage({
        phone,
        message: reply,
        leadId: selected.id,
        sessionId: sid,
      });
    },
    onSuccess: (res) => {
      setReply("");
      if (res?.warning) toast.warning(res.warning);
      else toast.success("Enviado via WhatsApp. MarIA pausada neste contato.");
      qc.invalidateQueries({ queryKey: ["atendimento_msgs", selected?.id] });
      qc.invalidateQueries({ queryKey: ["wa_mode", phone] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao enviar"),
  });

  const resumeMaria = useMutation({
    mutationFn: async () => {
      if (!phone) throw new Error("Lead sem telefone");
      await invokeCore("maria-core-whatsapp", { action: "set_mode", phone, paused: false });
    },
    onSuccess: () => {
      toast.success("MarIA voltou a atender este contato.");
      qc.invalidateQueries({ queryKey: ["wa_mode", phone] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao retomar MarIA"),
  });

  const openLead = (l: Lead) => {
    setSelectedId(l.id);
    setMobileTab("conversa");
  };

  const markContacted = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const old = selected.status;
      const { error } = await supabase
        .from("leads_maria")
        .update({ status: "contatado" })
        .eq("id", selected.id);
      if (error) throw error;
      try {
        await supabase.from("lead_status_audit").insert({
          lead_id: selected.id,
          old_status: old,
          new_status: "contatado",
          source: "admin_atendimento",
        });
      } catch (e) {
        console.warn("audit insert falhou", e);
      }
    },
    onSuccess: () => {
      toast.success("Lead marcado como em atendimento");
      qc.invalidateQueries({ queryKey: ["atendimento_leads"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao atualizar"),
  });

  // Atualizações genéricas no lead (follow-up, contato, status, feedback, handoff)
  const updateLeadPatch = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      if (!selected) throw new Error("Nenhum lead selecionado");
      const { error } = await supabase.from("leads_maria").update(patch).eq("id", selected.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atendimento_leads"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao salvar"),
  });

  const changeStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!selected) return;
      const old = selected.status;
      const { error } = await supabase
        .from("leads_maria")
        .update({ status: newStatus as any })
        .eq("id", selected.id);
      if (error) throw error;
      try {
        await supabase.from("lead_status_audit").insert({
          lead_id: selected.id,
          old_status: old,
          new_status: newStatus,
          source: "admin_atendimento",
        });
      } catch (e) {
        console.warn("audit insert falhou", e);
      }
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["atendimento_leads"] });
      qc.invalidateQueries({ queryKey: ["atendimento_audit", selected?.id] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao trocar status"),
  });

  // Envia a "mensagem pronta" pelo mesmo canal do MarIA Core (helper compartilhado)
  const sendReady = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Nenhum lead selecionado");
      const sid = selected?.maria_core_session_id || selected?.session_id;
      if (!sid) throw new Error("Lead sem sessão vinculada");
      if (!phone) throw new Error("Lead sem telefone");
      return await sendWhatsappMessage({
        phone,
        message: readyMessage,
        leadId: selected.id,
        sessionId: sid,
      });
    },
    onSuccess: (res) => {
      if (res?.warning) toast.warning(res.warning);
      else toast.success("Mensagem pronta enviada. MarIA pausada.");
      qc.invalidateQueries({ queryKey: ["atendimento_msgs", selected?.id] });
      qc.invalidateQueries({ queryKey: ["atendimento_leads"] });
      qc.invalidateQueries({ queryKey: ["wa_mode", phone] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao enviar"),
  });

  const handoffDaniel = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Nenhum lead selecionado");
      if (selected.quer_falar_daniel) throw new Error("Handoff já enviado");
      const { error } = await supabase
        .from("leads_maria")
        .update({ quer_falar_daniel: true, proximo_passo_sugerido: "analise_daniel" })
        .eq("id", selected.id);
      if (error) throw error;
      const sid = selected?.maria_core_session_id || selected?.session_id;
      try {
        await supabase.functions.invoke("notify-broker", {
          body: {
            lead_name: selected.nome || "Lead sem nome",
            lead_phone: selected.telefone || "",
            session_id: sid,
          },
        });
      } catch (e) {
        console.warn("notify-broker falhou", e);
      }
    },
    onSuccess: () => {
      toast.success("Daniel foi avisado deste lead");
      qc.invalidateQueries({ queryKey: ["atendimento_leads"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha no handoff"),
  });

  // ---------- Blocos reutilizados nas 3 zonas ----------

  const FilaZone = (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 space-y-2 border-b bg-background sticky top-0 z-10">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nome, telefone, bairro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={onlyHot ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setOnlyHot((v) => !v)}
          >
            <Flame className="w-3 h-3 mr-1" /> Só quentes
          </Button>
          <Button
            size="sm"
            variant={followupToday ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setFollowupToday((v) => !v)}
          >
            Follow-up hoje
          </Button>
        </div>
        <div className="flex gap-1">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 text-xs h-7 rounded border bg-background px-2"
          >
            <option value="todos">Todos status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterFinalidade}
            onChange={(e) => setFilterFinalidade(e.target.value)}
            className="flex-1 text-xs h-7 rounded border bg-background px-2"
          >
            <option value="todas">Todas finalidades</option>
            {finalidadeOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Filter className="w-3 h-3" /> {sorted.length} de {leads.length} leads
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading && <p className="text-xs text-muted-foreground p-4">Carregando...</p>}
        {!isLoading && sorted.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-8">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nenhum lead na fila.
          </div>
        )}
        {sorted.map((l: any) => {
          const score = priorityScore(l);
          const t = temperatura(score);
          const active = l.id === selectedId;
          const lastMs = lastMsgMap[l.id] ? Date.now() - new Date(lastMsgMap[l.id]).getTime() : Infinity;
          const isLive = lastMs < 5 * 60 * 1000;
          return (
            <button
              key={l.id}
              onClick={() => openLead(l)}
              className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                active ? "border-primary bg-primary/5" : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold text-sm truncate flex items-center gap-1">
                  {isLive && (
                    <span
                      title="Conversando agora (última mensagem < 5 min)"
                      className="relative inline-flex shrink-0"
                    >
                      <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                  <User className="w-3 h-3 shrink-0" />
                  {l.nome || "Sem nome"}
                </div>
                <Badge className={`${t.cls} text-[10px] px-1.5 py-0`}>{t.label}</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                <Phone className="w-2.5 h-2.5" /> {l.telefone || "—"}
              </div>
              <div className="flex flex-wrap gap-1">
                {isLive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-medium">
                    conversando agora
                  </span>
                )}
                {l.finalidade && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{l.finalidade}</span>
                )}
                {l.bairro_interesse && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{l.bairro_interesse}</span>
                )}
                {l.quer_falar_daniel && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white">Daniel</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const ConversaZone = (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b bg-background sticky top-0 z-10 space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">
            {selected ? `Conversa com ${selected.nome || "Lead"}` : "Selecione um lead"}
          </h3>
        </div>
        {selected && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[11px] text-muted-foreground">
              {messages.length} mensagens · sessão {selected?.maria_core_session_id || selected?.session_id || "—"}
            </p>
            {phone && (
              <div className="flex items-center gap-1.5">
                {modeQuery.isLoading ? (
                  <Badge variant="outline" className="text-[10px]">Verificando MarIA…</Badge>
                ) : modeQuery.data?.paused ? (
                  <>
                    <Badge className="bg-amber-500 text-white text-[10px]">
                      MarIA pausada — você está atendendo
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      onClick={() => resumeMaria.mutate()}
                      disabled={resumeMaria.isPending}
                    >
                      {resumeMaria.isPending ? "…" : "Devolver pra MarIA"}
                    </Button>
                  </>
                ) : (
                  <Badge className="bg-emerald-600 text-white text-[10px]">MarIA atendendo</Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
        {!selected && (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground text-sm">
            <div>
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              Escolha um lead na fila para ver a conversa completa aqui.
            </div>
          </div>
        )}
        {selected && messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Sem mensagens registradas para esta sessão.
          </p>
        )}
        {selected && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((m: any) => {
              const isCliente = m.role === "user";
              const isAtendente = !isCliente && m.mode === "atendente_whatsapp";
              return (
                <div
                  key={m.id}
                  className={`flex ${isCliente ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                      isCliente
                        ? "bg-background border rounded-bl-sm"
                        : isAtendente
                        ? "bg-emerald-600 text-white rounded-br-sm"
                        : "bg-primary text-primary-foreground rounded-br-sm"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1 opacity-80">
                      {isCliente ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      <span className="text-[10px] font-semibold">
                        {isCliente ? "Cliente" : isAtendente ? "Atendente (WhatsApp)" : "MarIA"}
                      </span>
                      <span className="text-[10px]">· {fmtDate(m.created_at)}</span>
                    </div>
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {selected && (
        <div className="p-3 border-t bg-background space-y-2">
          <Textarea
            ref={replyRef}
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (reply.trim() && !sendReply.isPending) setConfirmReply(true);
              }
            }}
            placeholder={
              phone
                ? "Responder via WhatsApp (envia pelo MarIA Core e pausa a MarIA)…"
                : "Lead sem telefone — não é possível enviar via WhatsApp."
            }
            className="text-xs resize-none overflow-y-auto"
            disabled={sendReply.isPending || !phone}
          />
          <div className="flex justify-between items-center gap-2">
            <p className="text-[10px] text-muted-foreground">
              💬 Envio real via WhatsApp pelo MarIA Core. A MarIA pausa automaticamente neste contato.
            </p>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setConfirmReply(true)}
              disabled={sendReply.isPending || !reply.trim() || !phone}
            >
              {sendReply.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              {sendReply.isPending ? "Enviando…" : "Enviar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const ContextoZone = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!selected && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Contexto do lead aparecerá aqui.
          </div>
        )}
        {selected && (
          <>
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <User className="w-4 h-4" /> {selected.nome || "Sem nome"}
              </h3>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div><span className="text-muted-foreground">Tel:</span> {selected.telefone || "—"}</div>
                <div><span className="text-muted-foreground">Status:</span> {selected.status}</div>
                <div><span className="text-muted-foreground">Finalidade:</span> {selected.finalidade || "—"}</div>
                <div><span className="text-muted-foreground">Bairro:</span> {selected.bairro_interesse || "—"}</div>
                <div><span className="text-muted-foreground">Tipo:</span> {selected.tipo_imovel || "—"}</div>
                <div><span className="text-muted-foreground">Faixa:</span> {selected.faixa_preco || "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Criado:</span> {fmtDate(selected.created_at)}</div>
              </div>
            </div>

            {selected.next_action_suggested && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-800 rounded-lg p-3">
                <div className="text-[10px] font-bold uppercase text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Próxima ação sugerida
                </div>
                <p className="text-xs font-medium text-green-900 dark:text-green-100">
                  {selected.next_action_suggested}
                </p>
              </div>
            )}

            {selected.resumo_ia && (
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Resumo IA</div>
                <p className="text-xs bg-muted p-2 rounded">{selected.resumo_ia}</p>
              </div>
            )}

            <Separator />

            {/* Mensagem pronta (personalizada) — envia pelo mesmo canal do MarIA Core */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> Mensagem pronta
                </h4>
                <button
                  type="button"
                  onClick={() => regenerateReadyMessage()}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Regenerar
                </button>
              </div>
              <Textarea
                value={readyMessage}
                onChange={(e) => setReadyMessage(e.target.value)}
                className="text-xs min-h-[120px]"
                placeholder="Mensagem personalizada..."
                disabled={sendReady.isPending || !phone}
              />
              <Button
                size="sm"
                className="w-full h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setConfirmReady(true)}
                disabled={sendReady.isPending || !readyMessage.trim() || !phone}
              >
                {sendReady.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                {sendReady.isPending ? "Enviando…" : "Enviar via WhatsApp"}
              </Button>
              {!phone && (
                <p className="text-[10px] text-muted-foreground italic text-center">
                  Lead sem telefone — envio indisponível.
                </p>
              )}
            </div>

            <Separator />

            {/* Follow-up */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" /> Follow-up
              </h4>
              {selected.next_followup_at && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1">
                  Agendado: {fmtDate(selected.next_followup_at)}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {[
                  { label: "Amanhã", days: 1 },
                  { label: "+3 dias", days: 3 },
                  { label: "+1 semana", days: 7 },
                  { label: "+2 semanas", days: 14 },
                ].map((opt) => (
                  <Button
                    key={opt.days}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] px-2"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + opt.days);
                      d.setHours(10, 0, 0, 0);
                      updateLeadPatch.mutate({ next_followup_at: d.toISOString() });
                    }}
                    disabled={updateLeadPatch.isPending}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-1">
                <Input
                  type="datetime-local"
                  value={followupCustom}
                  onChange={(e) => setFollowupCustom(e.target.value)}
                  className="h-7 text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2"
                  onClick={() =>
                    updateLeadPatch.mutate({
                      next_followup_at: followupCustom ? new Date(followupCustom).toISOString() : null,
                    })
                  }
                >
                  Salvar
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-[10px] gap-1"
                onClick={() => updateLeadPatch.mutate({ last_contact_at: new Date().toISOString() })}
                disabled={updateLeadPatch.isPending}
              >
                <CheckCircle2 className="w-3 h-3" /> Marcar contato feito agora
              </Button>
              {selected.last_contact_at && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Último contato: {fmtDate(selected.last_contact_at)}
                </p>
              )}
            </div>

            <Separator />

            {/* Handoff Daniel */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                <UserPlus className="w-3 h-3" /> Handoff para Daniel
              </h4>
              {selected.quer_falar_daniel ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded px-2 py-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Já enviado ao Daniel
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => setConfirmHandoff(true)}
                  disabled={handoffDaniel.isPending}
                >
                  {handoffDaniel.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                  {handoffDaniel.isPending ? "Enviando…" : "Enviar para Daniel"}
                </Button>
              )}
            </div>

            <Separator />

            {/* Status + validade */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Status do lead</h4>
              <div className="flex gap-1">
                <select
                  value={selected.status || "novo"}
                  onChange={(e) => changeStatus.mutate(e.target.value)}
                  disabled={changeStatus.isPending}
                  className="flex-1 text-xs h-7 rounded border bg-background px-2"
                >
                  {["novo", "contatado", "convertido", "descartado"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-[10px] px-2"
                  onClick={() => markContacted.mutate()}
                  disabled={markContacted.isPending || selected.status === "contatado"}
                >
                  Em atendimento
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={selected.feedback_corretor === "valido" ? "default" : "outline"}
                  className={`flex-1 h-7 text-[10px] gap-1 ${selected.feedback_corretor === "valido" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                  onClick={() => updateLeadPatch.mutate({ feedback_corretor: "valido" })}
                  disabled={updateLeadPatch.isPending}
                >
                  <ThumbsUp className="w-3 h-3" /> Válido
                </Button>
                <Button
                  size="sm"
                  variant={selected.feedback_corretor === "invalido" ? "destructive" : "outline"}
                  className="flex-1 h-7 text-[10px] gap-1"
                  onClick={() => updateLeadPatch.mutate({ feedback_corretor: "invalido" })}
                  disabled={updateLeadPatch.isPending}
                >
                  <ThumbsDown className="w-3 h-3" /> Inválido
                </Button>
              </div>
            </div>

            <Separator />


            <Tabs defaultValue="notas">
              <TabsList className="w-full h-8">
                <TabsTrigger value="notas" className="text-xs flex-1">Notas ({notes.length})</TabsTrigger>
                <TabsTrigger value="hist" className="text-xs flex-1">Histórico ({audit.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="notas" className="space-y-1.5 mt-2">
                {notes.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">Sem notas.</p>
                )}
                {notes.map((n: any) => (
                  <div key={n.id} className="text-xs p-2 bg-muted rounded">
                    <div className="text-[10px] text-muted-foreground mb-0.5">{fmtDate(n.created_at)}</div>
                    {n.content}
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="hist" className="space-y-1.5 mt-2">
                {audit.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">Sem histórico.</p>
                )}
                {audit.map((a: any) => (
                  <div key={a.id} className="text-xs p-2 bg-muted rounded">
                    <div className="text-[10px] text-muted-foreground">{fmtDate(a.created_at)} · {a.source}</div>
                    <div>{a.old_status || "—"} → <strong>{a.new_status}</strong></div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-2 border-b shrink-0">
        <Inbox className="w-5 h-5 text-primary" />
        <div className="min-w-0">
          <h1 className="text-sm font-bold leading-tight">Atendimento — Cockpit</h1>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Fila, conversa e ações do lead numa tela só.
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Sobre o cockpit"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-xs">
            Layout de 3 zonas: fila à esquerda, conversa no meio, contexto e ações à direita.
            Próximas etapas: mensagem pronta, follow-up, handoff, copiloto MarIA.
          </TooltipContent>
        </Tooltip>
      </header>

      {/* Desktop: 3 colunas */}
      <div className="hidden lg:grid flex-1 min-h-0 grid-cols-[260px_1fr_320px] overflow-hidden">
        <div className="border-r min-h-0 min-w-0 overflow-hidden">{FilaZone}</div>
        <div className="border-r min-h-0 min-w-0 overflow-hidden">{ConversaZone}</div>
        <div className="min-h-0 min-w-0 overflow-hidden">{ContextoZone}</div>
      </div>

      {/* Mobile: tabs */}
      <div className="lg:hidden flex-1 min-h-0 flex flex-col overflow-hidden">
        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full rounded-none">
            <TabsTrigger value="fila" className="flex-1">Fila ({sorted.length})</TabsTrigger>
            <TabsTrigger value="conversa" className="flex-1" disabled={!selected}>Conversa</TabsTrigger>
            <TabsTrigger value="contexto" className="flex-1" disabled={!selected}>Contexto</TabsTrigger>
          </TabsList>
          <TabsContent value="fila" className="flex-1 min-h-0 m-0 overflow-hidden">{FilaZone}</TabsContent>
          <TabsContent value="conversa" className="flex-1 min-h-0 m-0 overflow-hidden">{ConversaZone}</TabsContent>
          <TabsContent value="contexto" className="flex-1 min-h-0 m-0 overflow-hidden">{ContextoZone}</TabsContent>
        </Tabs>
      </div>

      {/* Confirmação: enviar resposta livre */}
      <AlertDialog open={confirmReply} onOpenChange={setConfirmReply}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar mensagem via WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-xs">
                <div>
                  Vai para <strong>{selected?.nome || "Lead"}</strong> ({phone || "—"}). A MarIA pausa neste contato.
                </div>
                <div className="bg-muted p-2 rounded whitespace-pre-wrap max-h-40 overflow-y-auto">{reply}</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendReply.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendReply.isPending}
              onClick={(e) => {
                e.preventDefault();
                sendReply.mutate(undefined, { onSuccess: () => setConfirmReply(false) });
              }}
            >
              {sendReply.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              {sendReply.isPending ? "Enviando…" : "Confirmar envio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação: enviar mensagem pronta */}
      <AlertDialog open={confirmReady} onOpenChange={setConfirmReady}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar mensagem pronta?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-xs">
                <div>
                  Vai para <strong>{selected?.nome || "Lead"}</strong> ({phone || "—"}). A MarIA pausa neste contato.
                </div>
                <div className="bg-muted p-2 rounded whitespace-pre-wrap max-h-48 overflow-y-auto">{readyMessage}</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendReady.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendReady.isPending}
              onClick={(e) => {
                e.preventDefault();
                sendReady.mutate(undefined, { onSuccess: () => setConfirmReady(false) });
              }}
            >
              {sendReady.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              {sendReady.isPending ? "Enviando…" : "Confirmar envio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação: handoff para Daniel */}
      <AlertDialog open={confirmHandoff} onOpenChange={setConfirmHandoff}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encaminhar para o Daniel?</AlertDialogTitle>
            <AlertDialogDescription>
              O Daniel receberá aviso deste lead ({selected?.nome || "sem nome"} — {phone || "sem telefone"}) e o lead será marcado como pedido de especialista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={handoffDaniel.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={handoffDaniel.isPending}
              onClick={(e) => {
                e.preventDefault();
                handoffDaniel.mutate(undefined, { onSuccess: () => setConfirmHandoff(false) });
              }}
            >
              {handoffDaniel.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              {handoffDaniel.isPending ? "Enviando…" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
