import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Inbox, MessageSquare, Phone, Sparkles, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { buildPersonalizedMessage } from "@/lib/whatsapp-templates";

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

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AdminAtendimento() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

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

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...leads]
      .filter((l) => {
        if (!q) return true;
        return [l.nome, l.telefone, l.bairro_interesse, l.interesse, l.resumo_ia]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(q));
      })
      .sort((a, b) => priorityScore(b) - priorityScore(a));
  }, [leads, search]);

  const selected: any = sorted.find((l: any) => l.id === selectedId) || null;

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
        .limit(100);
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

  const openLead = (l: Lead) => {
    setSelectedId(l.id);
    try {
      setDraft(buildPersonalizedMessage(l));
    } catch {
      setDraft(`Oi ${l.nome || ""}, aqui é o Daniel da Viva Bombinhas. Vi seu interesse e gostaria de te ajudar.`);
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      toast.success("Mensagem copiada");
    } catch {
      toast.error("Não foi possível copiar");
    }
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

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center gap-3">
        <Inbox className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Atendimento</h1>
          <p className="text-sm text-muted-foreground">Inbox operacional priorizado por urgência comercial</p>
        </div>
      </header>

      <Input
        placeholder="Buscar por nome, telefone, bairro, interesse..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Inbox className="w-10 h-10 mx-auto mb-2 opacity-50" />
            Nenhum lead na fila de atendimento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sorted.map((l: any) => (
            <Card
              key={l.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => openLead(l)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold flex items-center gap-1 truncate">
                      <User className="w-3.5 h-3.5" />
                      {l.nome || "Sem nome"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {l.telefone || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {l.quer_falar_daniel && <Badge className="bg-red-500">Daniel</Badge>}
                    <Badge variant="outline">{l.status}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  {l.finalidade && <Badge variant="secondary">{l.finalidade}</Badge>}
                  {l.bairro_interesse && <Badge variant="outline">{l.bairro_interesse}</Badge>}
                  {(l.faixa_preco || l.capital_disponivel) && (
                    <Badge variant="outline">{l.faixa_preco || `Capital: ${l.capital_disponivel}`}</Badge>
                  )}
                </div>
                {l.resumo_ia && (
                  <p className="text-xs text-muted-foreground line-clamp-2 flex items-start gap-1">
                    <Sparkles className="w-3 h-3 mt-0.5 shrink-0" /> {l.resumo_ia}
                  </p>
                )}
                {l.next_action_suggested && (
                  <p className="text-xs font-medium text-primary line-clamp-1">→ {l.next_action_suggested}</p>
                )}
                <div className="text-[10px] text-muted-foreground">
                  Atualizado {fmtDate(l.updated_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" /> {selected.nome || "Sem nome"}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Telefone:</span> {selected.telefone || "—"}</div>
                  <div><span className="text-muted-foreground">Status:</span> {selected.status}</div>
                  <div><span className="text-muted-foreground">Finalidade:</span> {selected.finalidade || "—"}</div>
                  <div><span className="text-muted-foreground">Bairro:</span> {selected.bairro_interesse || "—"}</div>
                  <div><span className="text-muted-foreground">Tipo:</span> {selected.tipo_imovel || "—"}</div>
                  <div><span className="text-muted-foreground">Faixa:</span> {selected.faixa_preco || "—"}</div>
                  <div><span className="text-muted-foreground">Criado:</span> {fmtDate(selected.created_at)}</div>
                  <div><span className="text-muted-foreground">Atualizado:</span> {fmtDate(selected.updated_at)}</div>
                </div>

                {selected.resumo_ia && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Resumo IA</div>
                    <p className="text-sm bg-muted p-2 rounded">{selected.resumo_ia}</p>
                  </div>
                )}

                {selected.next_action_suggested && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Próxima ação sugerida</div>
                    <p className="text-sm font-medium text-primary">{selected.next_action_suggested}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Mensagem WhatsApp sugerida
                  </div>
                  <Textarea rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={copyMessage}>
                      <Copy className="w-4 h-4 mr-1" /> Copiar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => markContacted.mutate()}
                      disabled={markContacted.isPending || selected.status === "contatado"}
                    >
                      Marcar como em atendimento
                    </Button>
                  </div>
                </div>

                {messages.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Últimas mensagens da MarIA</div>
                      <ScrollArea className="h-64 border rounded p-2">
                        <div className="space-y-2">
                          {messages.map((m: any) => (
                            <div key={m.id} className={`text-xs ${m.role === "user" ? "text-foreground" : "text-muted-foreground"}`}>
                              <span className="font-semibold">[{m.role}]</span> {m.content}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}

                {notes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Notas</div>
                      <div className="space-y-1">
                        {notes.map((n: any) => (
                          <div key={n.id} className="text-xs p-2 bg-muted rounded">{n.content}</div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
