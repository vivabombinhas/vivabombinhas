import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Phone, MapPin, Home, DollarSign, Check, X, Filter, MessageCircle } from "lucide-react";
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

type MatchStatus = "pending" | "sent" | "converted" | "dismissed";

const STATUS_LABEL: Record<MatchStatus, string> = {
  pending: "Pendente",
  sent: "Enviado",
  converted: "Convertido",
  dismissed: "Descartado",
};

const formatCurrency = (v?: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function AdminMatches() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const { data: matches, isLoading } = useQuery({
    queryKey: ["lead_matches", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("lead_matches")
        .select(`
          *,
          lead:leads_maria(id, nome, telefone, bairro_interesse, tipo_imovel, faixa_preco, interesse),
          imovel:imoveis(id, titulo, bairro, tipo, preco, preco_temporada_diaria, quartos, fotos, link_anuncio)
        `)
        .order("score", { ascending: false })
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        q = q.eq("status", statusFilter as MatchStatus);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MatchStatus }) => {
      const { error } = await supabase.from("lead_matches").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead_matches"] });
      toast.success("Match atualizado");
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const buildWhatsappLink = (m: any) => {
    const tel = m.lead?.telefone?.replace(/\D/g, "") || "";
    const preco = m.imovel?.preco ?? m.imovel?.preco_temporada_diaria;
    const msg = `Oi ${m.lead?.nome?.split(" ")[0] || ""}! Aqui é da Viva Bombinhas 🌊\n\nLembra que você procurava ${m.lead?.tipo_imovel || "imóvel"} em ${m.lead?.bairro_interesse || "Bombinhas"}? Acabou de entrar uma opção que combina muito com o que você queria:\n\n🏠 *${m.imovel?.titulo}*\n📍 ${m.imovel?.bairro}\n💰 ${formatCurrency(preco)}\n\nQuer que eu te mande mais detalhes e fotos?`;
    return `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`;
  };

  const counts = {
    all: matches?.length || 0,
    pending: matches?.filter((m: any) => m.status === "pending").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> Matches
            </h1>
            <p className="text-xs text-muted-foreground">
              {counts.all} matches no filtro atual
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="sent">Enviados</SelectItem>
                <SelectItem value="converted">Convertidos</SelectItem>
                <SelectItem value="dismissed">Descartados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !matches?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum match {statusFilter !== "all" ? STATUS_LABEL[statusFilter as MatchStatus]?.toLowerCase() : ""}</p>
            <p className="text-xs mt-1">Matches são gerados automaticamente quando novos imóveis ou leads entram no sistema.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m: any) => {
              const preco = m.imovel?.preco ?? m.imovel?.preco_temporada_diaria;
              const foto = m.imovel?.fotos?.[0];
              return (
                <div key={m.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Foto */}
                    {foto && (
                      <img
                        src={foto}
                        alt={m.imovel?.titulo}
                        className="w-full md:w-32 h-32 object-cover rounded-lg"
                        loading="lazy"
                      />
                    )}

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Header: lead + score */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm">{m.lead?.nome}</h3>
                            <Badge variant="secondary" className="text-[10px]">
                              {m.score} pts
                            </Badge>
                            <Badge
                              variant={m.status === "pending" ? "default" : "outline"}
                              className="text-[10px]"
                            >
                              {STATUS_LABEL[m.status as MatchStatus]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {m.lead?.telefone}
                          </p>
                        </div>
                      </div>

                      {/* Imóvel */}
                      <div className="bg-muted/40 rounded-lg p-3 text-sm">
                        <p className="font-medium line-clamp-1">{m.imovel?.titulo}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                          {m.imovel?.bairro && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.imovel.bairro}</span>
                          )}
                          {m.imovel?.tipo && (
                            <span className="flex items-center gap-1"><Home className="w-3 h-3" />{m.imovel.tipo}</span>
                          )}
                          {preco != null && (
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(preco)}</span>
                          )}
                        </div>
                      </div>

                      {/* Detalhamento do Score */}
                      {(() => {
                        const reasons: string[] = m.match_reasons || [];
                        const bairroReason = reasons.find((r) => r.startsWith("Bairro"));
                        const tipoReason = reasons.find((r) => r.startsWith("Tipo"));
                        const precoReason = reasons.find((r) => r.toLowerCase().startsWith("preço") || r.toLowerCase().startsWith("preco"));
                        const criterios = [
                          { label: "Bairro", pts: 40, hit: !!bairroReason, detail: bairroReason?.replace(/^Bairro:\s*/i, "") },
                          { label: "Tipo", pts: 30, hit: !!tipoReason, detail: tipoReason?.replace(/^Tipo:\s*/i, "") },
                          { label: "Preço", pts: 30, hit: !!precoReason, detail: precoReason },
                        ];
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="font-medium">Compatibilidade</span>
                              <span>{m.score}/100 pts</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                                style={{ width: `${Math.min(100, m.score)}%` }}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {criterios.map((c) => (
                                <div
                                  key={c.label}
                                  className={`rounded-md border px-2 py-1.5 text-[11px] ${
                                    c.hit
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                      : "bg-muted/40 border-border text-muted-foreground"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-medium flex items-center gap-1">
                                      {c.hit ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-50" />}
                                      {c.label}
                                    </span>
                                    <span className="text-[10px] opacity-80">
                                      {c.hit ? `+${c.pts}` : `0/${c.pts}`}
                                    </span>
                                  </div>
                                  {c.hit && c.detail && (
                                    <div className="mt-0.5 truncate opacity-80" title={c.detail}>
                                      {c.detail}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Ações */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href={buildWhatsappLink(m)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            // Fallback para preview em iframe: força abertura no top window
                            try {
                              const url = buildWhatsappLink(m);
                              const win = window.open(url, "_blank", "noopener,noreferrer");
                              if (!win) {
                                window.top!.location.href = url;
                              }
                              e.preventDefault();
                            } catch {
                              // deixa o comportamento padrão do <a> rolar
                            }
                            if (m.status === "pending") updateStatus.mutate({ id: m.id, status: "sent" });
                          }}
                        >
                          <Button size="sm" className="h-8 gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </Button>
                        </a>
                        {m.status !== "converted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                            onClick={() => updateStatus.mutate({ id: m.id, status: "converted" })}
                          >
                            <Check className="w-3.5 h-3.5" /> Converteu
                          </Button>
                        )}
                        {m.status !== "dismissed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5 text-muted-foreground"
                            onClick={() => updateStatus.mutate({ id: m.id, status: "dismissed" })}
                          >
                            <X className="w-3.5 h-3.5" /> Descartar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
