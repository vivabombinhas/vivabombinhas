import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, Check, Sparkles, Home, MapPin } from "lucide-react";
import { buildWhatsappLink, openWhatsapp } from "@/lib/whatsapp-templates";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type AlertRow = {
  id: string;
  score: number;
  match_reasons: string[] | null;
  created_at: string;
  status: string;
  lead: {
    id: string;
    nome: string | null;
    telefone: string | null;
    bairro_interesse: string | null;
    tipo_imovel: string | null;
    faixa_preco: string | null;
    status: string;
  } | null;
  imovel: {
    id: string;
    titulo: string;
    bairro: string | null;
    tipo: string;
    preco: number | null;
    quartos: number | null;
    link_anuncio: string | null;
  } | null;
};

export default function AdminAlerts() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "sent">("pending");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["smart_alerts", tab],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_matches")
        .select(
          `id, score, match_reasons, created_at, status,
           lead:leads_maria!lead_matches_lead_id_fkey(id, nome, telefone, bairro_interesse, tipo_imovel, faixa_preco, status),
           imovel:imoveis!lead_matches_imovel_id_fkey(id, titulo, bairro, tipo, preco, quartos, link_anuncio)`
        )
        .eq("status", tab === "pending" ? "pending" : "sent")
        .order("score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        // Fallback sem foreign key alias se schema cache não reconhecer
        const { data: d2 } = await supabase
          .from("lead_matches")
          .select("*")
          .eq("status", tab === "pending" ? "pending" : "sent")
          .order("score", { ascending: false })
          .limit(100);
        return (d2 ?? []) as unknown as AlertRow[];
      }
      return (data ?? []) as unknown as AlertRow[];
    },
  });

  const summary = useMemo(() => {
    const total = alerts.length;
    const hot = alerts.filter((a) => a.score >= 60).length;
    const leads = new Set(alerts.map((a) => a.lead?.id).filter(Boolean)).size;
    return { total, hot, leads };
  }, [alerts]);

  const markAs = async (id: string, status: "sent" | "dismissed") => {
    const { error } = await supabase
      .from("lead_matches")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar alerta");
      return;
    }
    toast.success(status === "sent" ? "Marcado como notificado" : "Alerta descartado");
    qc.invalidateQueries({ queryKey: ["smart_alerts"] });
  };

  const sendWhatsapp = async (alert: AlertRow) => {
    if (!alert.lead?.telefone || !alert.imovel) {
      toast.error("Lead sem telefone ou imóvel ausente");
      return;
    }
    const nome = alert.lead.nome?.split(" ")[0] ?? "tudo bem";
    const preco = alert.imovel.preco
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(alert.imovel.preco)
      : "";
    const msg = `Oi ${nome}! 🎯 Apareceu um imóvel novo que combina com o que você procura:\n\n*${alert.imovel.titulo}*${alert.imovel.bairro ? `\n📍 ${alert.imovel.bairro}` : ""}${alert.imovel.quartos ? `\n🛏️ ${alert.imovel.quartos} quartos` : ""}${preco ? `\n💰 ${preco}` : ""}${alert.imovel.link_anuncio ? `\n\n${alert.imovel.link_anuncio}` : ""}\n\nQuer mais detalhes ou agendar uma visita?`;
    openWhatsapp(alert.lead.telefone, msg);
    // marca como notificado e atualiza last_contact_at do lead
    await supabase.from("lead_matches").update({ status: "sent" }).eq("id", alert.id);
    await supabase.from("leads_maria").update({ last_contact_at: new Date().toISOString() }).eq("id", alert.lead.id);
    qc.invalidateQueries({ queryKey: ["smart_alerts"] });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Alertas Inteligentes</h1>
          <p className="text-sm text-muted-foreground">
            Imóveis novos cruzados automaticamente com leads existentes — feche o loop antes do lead esfriar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Pendentes</div>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Score alto (≥60)</div>
            <div className="text-2xl font-bold text-primary">{summary.hot}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase">Leads únicos</div>
            <div className="text-2xl font-bold">{summary.leads}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "pending" ? "default" : "outline"} size="sm" onClick={() => setTab("pending")}>
          Pendentes
        </Button>
        <Button variant={tab === "sent" ? "default" : "outline"} size="sm" onClick={() => setTab("sent")}>
          Já notificados
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando alertas…</div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nenhum alerta {tab === "pending" ? "pendente" : "enviado"} no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={a.score >= 60 ? "default" : "secondary"}>Score {a.score}</Badge>
                  {a.lead?.status && <Badge variant="outline">{a.lead.status}</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 bg-muted/30">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Lead</div>
                    <div className="font-semibold">{a.lead?.nome ?? "—"}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                      {a.lead?.tipo_imovel && <span>🏠 {a.lead.tipo_imovel}</span>}
                      {a.lead?.bairro_interesse && <span><MapPin className="inline w-3 h-3" /> {a.lead.bairro_interesse}</span>}
                      {a.lead?.faixa_preco && <span>💰 {a.lead.faixa_preco}</span>}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Imóvel novo</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Home className="w-3 h-3" /> {a.imovel?.titulo ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                      {a.imovel?.bairro && <span>📍 {a.imovel.bairro}</span>}
                      {a.imovel?.quartos ? <span>🛏️ {a.imovel.quartos}</span> : null}
                      {a.imovel?.preco && (
                        <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(a.imovel.preco)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {a.match_reasons && a.match_reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {a.match_reasons.map((r, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                )}

                {tab === "pending" && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" onClick={() => sendWhatsapp(a)} disabled={!a.lead?.telefone}>
                      <MessageCircle className="w-3 h-3 mr-1" /> Enviar no WhatsApp
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => markAs(a.id, "sent")}>
                      <Check className="w-3 h-3 mr-1" /> Marcar notificado
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => markAs(a.id, "dismissed")}>
                      Descartar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
