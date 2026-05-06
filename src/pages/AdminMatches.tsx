import { useState, useMemo } from "react";
import { buildWhatsappLink as buildWALink, openWhatsapp } from "@/lib/whatsapp-templates";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  Phone,
  MapPin,
  Home,
  DollarSign,
  Check,
  X,
  Filter,
  MessageCircle,
  Search,
  ExternalLink,
  Users,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

type MatchStatus = "pending" | "sent" | "converted" | "dismissed";

const STATUS_CONFIG: Record<MatchStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-300" },
  sent: { label: "Enviado", className: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300" },
  converted: { label: "Convertido", className: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300" },
  dismissed: { label: "Descartado", className: "bg-muted text-muted-foreground border-border" },
};

const formatCurrency = (v?: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function scoreColor(score: number) {
  if (score >= 70) return "from-emerald-400 to-emerald-600";
  if (score >= 50) return "from-amber-400 to-amber-600";
  return "from-rose-400 to-rose-600";
}

function scoreTextClass(score: number) {
  if (score >= 70) return "text-emerald-700 dark:text-emerald-400";
  if (score >= 50) return "text-amber-700 dark:text-amber-400";
  return "text-rose-700 dark:text-rose-400";
}

export default function AdminMatches() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grouped">("grouped");
  const [expandedLeads, setExpandedLeads] = useState<Record<string, boolean>>({});
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggleLead = (leadId: string) => {
    setExpandedLeads(prev => ({ ...prev, [leadId]: !prev[leadId] }));
  };

  const { data: matches, isLoading } = useQuery({
    queryKey: ["lead_matches", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("lead_matches")
        .select(`
          *,
          lead:leads_maria(id, nome, telefone, bairro_interesse, tipo_imovel, faixa_preco, interesse, mensagem_original),
          imovel:imoveis(id, titulo, bairro, tipo, preco, preco_temporada_diaria, quartos, fotos, link_anuncio)
        `)
        .order("score", { ascending: false })
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        q = q.eq("status", statusFilter as MatchStatus);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
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

  const getMatchWhatsappLink = (m: any) => {
    const preco = m.imovel?.preco ?? m.imovel?.preco_temporada_diaria;
    const msg = `Oi ${m.lead?.nome?.split(" ")[0] || ""}! Aqui é da Viva Bombinhas 🌊\n\nLembra que você procurava ${m.lead?.tipo_imovel || "imóvel"} em ${m.lead?.bairro_interesse || "Bombinhas"}? Acabou de entrar uma opção que combina muito com o que você queria:\n\n🏠 *${m.imovel?.titulo}*\n📍 ${m.imovel?.bairro}\n💰 ${formatCurrency(preco)}\n\nQuer que eu te mande mais detalhes e fotos?`;
    return buildWALink(m.lead?.telefone || "", msg);
  };

  const handleWhatsapp = (e: React.MouseEvent, m: any) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const preco = m.imovel?.preco ?? m.imovel?.preco_temporada_diaria;
      const msg = `Oi ${m.lead?.nome?.split(" ")[0] || ""}! Aqui é da Viva Bombinhas 🌊\n\nLembra que você procurava ${m.lead?.tipo_imovel || "imóvel"} em ${m.lead?.bairro_interesse || "Bombinhas"}? Acabou de entrar uma opção que combina muito com o que você queria:\n\n🏠 *${m.imovel?.titulo}*\n📍 ${m.imovel?.bairro}\n💰 ${formatCurrency(preco)}\n\nQuer que eu te mande mais detalhes e fotos?`;
      openWhatsapp(m.lead?.telefone || "", msg);
    } catch {
      /* ignore */
    }
    if (m.status === "pending") updateStatus.mutate({ id: m.id, status: "sent" });
  };

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    const q = search.trim().toLowerCase();
    return matches.filter((m: any) => {
      if (scoreFilter === "high" && m.score < 70) return false;
      if (scoreFilter === "mid" && (m.score < 50 || m.score >= 70)) return false;
      if (scoreFilter === "low" && m.score >= 50) return false;
      if (!q) return true;
      const hay = [
        m.lead?.nome,
        m.lead?.telefone,
        m.lead?.bairro_interesse,
        m.imovel?.titulo,
        m.imovel?.bairro,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [matches, search, scoreFilter]);

  const groupedMatches = useMemo(() => {
    const groups: Record<string, { lead: any; matches: any[]; maxScore: number }> = {};
    filteredMatches.forEach((m: any) => {
      const leadId = m.lead_id || "unknown";
      if (!groups[leadId]) {
        groups[leadId] = { lead: m.lead, matches: [], maxScore: 0 };
      }
      groups[leadId].matches.push(m);
      if (m.score > groups[leadId].maxScore) {
        groups[leadId].maxScore = m.score;
      }
    });
    return Object.values(groups).sort((a, b) => b.maxScore - a.maxScore);
  }, [filteredMatches]);

  const counts = {
    total: matches?.length || 0,
    filtered: filteredMatches.length,
    pending: matches?.filter((m: any) => m.status === "pending").length || 0,
    high: matches?.filter((m: any) => m.score >= 70).length || 0,
    leads: groupedMatches.length,
  };

  const hasActiveFilters = statusFilter !== "pending" || scoreFilter !== "all" || !!search;

  const clearFilters = () => {
    setStatusFilter("pending");
    setScoreFilter("all");
    setSearch("");
  };

  const openDetails = (m: any) => {
    setSelectedMatch(m);
    setSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Matches
              </h1>
              <p className="text-xs text-muted-foreground">
                {counts.total} matches · {counts.leads} usuários · {counts.pending} pendentes
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por lead, imóvel, bairro..."
                className="pl-9 h-9"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="converted">Convertidos</SelectItem>
                  <SelectItem value="dismissed">Descartados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer score</SelectItem>
                <SelectItem value="high">Alto (≥70)</SelectItem>
                <SelectItem value="mid">Médio (50-69)</SelectItem>
                <SelectItem value="low">Baixo (&lt;50)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-muted/50 p-1 rounded-lg border border-border ml-auto">
              <Button
                variant={viewMode === "grouped" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grouped")}
                className="h-7 px-2 gap-1.5 text-[11px]"
              >
                <Users className="w-3.5 h-3.5" />
                Por Usuário
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-7 px-2 gap-1.5 text-[11px]"
              >
                <List className="w-3.5 h-3.5" />
                Lista Simples
              </Button>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs gap-1">
                <X className="w-3.5 h-3.5" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : !filteredMatches.length ? (
          <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-xl">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum match encontrado</p>
            <p className="text-xs mt-1">Matches são gerados automaticamente quando novos imóveis ou leads entram.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[22%]">Lead</TableHead>
                    <TableHead className="w-[28%]">Imóvel</TableHead>
                    <TableHead className="w-[18%]">Score</TableHead>
                    <TableHead className="w-[12%]">Status</TableHead>
                    <TableHead className="w-[20%] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((m: any) => {
                    const cfg = STATUS_CONFIG[m.status as MatchStatus];
                    const preco = m.imovel?.preco ?? m.imovel?.preco_temporada_diaria;
                    const reasons: string[] = m.match_reasons || [];
                    const hasBairro = reasons.some((r) => r.startsWith("Bairro"));
                    const hasTipo = reasons.some((r) => r.startsWith("Tipo"));
                    const hasPreco = reasons.some((r) => r.toLowerCase().startsWith("pre"));
                    return (
                      <TableRow
                        key={m.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => openDetails(m)}
                      >
                        <TableCell className="align-top py-3">
                          <div className="font-medium text-sm truncate">
                            {m.lead?.nome || <span className="italic text-muted-foreground">Sem nome</span>}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {m.lead?.telefone || "—"}
                          </div>
                          {m.lead?.bairro_interesse && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              quer {m.lead.tipo_imovel || "imóvel"} em {m.lead.bairro_interesse}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="align-top py-3">
                          <div className="font-medium text-sm line-clamp-1">{m.imovel?.titulo}</div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                            {m.imovel?.bairro && (
                              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{m.imovel.bairro}</span>
                            )}
                            {m.imovel?.tipo && (
                              <span className="flex items-center gap-0.5"><Home className="w-3 h-3" />{m.imovel.tipo}</span>
                            )}
                            {preco != null && (
                              <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" />{formatCurrency(preco)}</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="align-top py-3">
                          <div className={`text-sm font-bold ${scoreTextClass(m.score)}`}>
                            {m.score}<span className="text-xs font-normal text-muted-foreground">/100</span>
                          </div>
                          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden mt-1">
                            <div
                              className={`h-full bg-gradient-to-r ${scoreColor(m.score)}`}
                              style={{ width: `${Math.min(100, m.score)}%` }}
                            />
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            <span
                              className={`text-[9px] px-1 rounded ${hasBairro ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                              title={hasBairro ? "Bairro confere" : "Bairro não confere"}
                            >B</span>
                            <span
                              className={`text-[9px] px-1 rounded ${hasTipo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                              title={hasTipo ? "Tipo confere" : "Tipo não confere"}
                            >T</span>
                            <span
                              className={`text-[9px] px-1 rounded ${hasPreco ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                              title={hasPreco ? "Preço confere" : "Preço não confere"}
                            >P</span>
                          </div>
                        </TableCell>

                        <TableCell className="align-top py-3">
                          <Badge variant="outline" className={`text-[10px] ${cfg.className}`}>
                            {cfg.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="align-top py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {m.lead?.telefone && (
                              <Button
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={(e) => handleWhatsapp(e, m)}
                                title="Enviar WhatsApp pré-formatado"
                              >
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </Button>
                            )}
                            {m.status !== "converted" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                onClick={() => updateStatus.mutate({ id: m.id, status: "converted" })}
                                title="Marcar como convertido"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {m.status !== "dismissed" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => updateStatus.mutate({ id: m.id, status: "dismissed" })}
                                title="Descartar match"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>

      {/* Sheet de detalhes */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedMatch && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Detalhes do match
                </SheetTitle>
                <SheetDescription>
                  Score {selectedMatch.score}/100 ·{" "}
                  {STATUS_CONFIG[selectedMatch.status as MatchStatus]?.label}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Foto do imóvel */}
                {selectedMatch.imovel?.fotos?.[0] && (
                  <img
                    src={selectedMatch.imovel.fotos[0]}
                    alt={selectedMatch.imovel.titulo}
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover rounded-lg"
                  />
                )}

                {/* Lead */}
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Lead</h4>
                  <div className="bg-muted/40 rounded-lg p-3 space-y-1.5">
                    <div className="font-medium">{selectedMatch.lead?.nome || "Sem nome"}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedMatch.lead?.telefone || "—"}
                    </div>
                    {selectedMatch.lead?.bairro_interesse && (
                      <div className="text-sm">
                        Procura <strong>{selectedMatch.lead.tipo_imovel || "imóvel"}</strong> em{" "}
                        <strong>{selectedMatch.lead.bairro_interesse}</strong>
                        {selectedMatch.lead.faixa_preco && <> · faixa {selectedMatch.lead.faixa_preco}</>}
                      </div>
                    )}
                    {selectedMatch.lead?.mensagem_original && (
                      <p className="text-xs italic text-muted-foreground mt-1">
                        "{selectedMatch.lead.mensagem_original}"
                      </p>
                    )}
                  </div>
                </section>

                {/* Imóvel */}
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Imóvel</h4>
                  <div className="bg-muted/40 rounded-lg p-3 space-y-1.5">
                    <div className="font-medium">{selectedMatch.imovel?.titulo}</div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                      {selectedMatch.imovel?.bairro && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedMatch.imovel.bairro}</span>
                      )}
                      {selectedMatch.imovel?.tipo && (
                        <span className="flex items-center gap-1"><Home className="w-3 h-3" />{selectedMatch.imovel.tipo}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(selectedMatch.imovel?.preco ?? selectedMatch.imovel?.preco_temporada_diaria)}
                      </span>
                    </div>
                    {selectedMatch.imovel?.link_anuncio && (
                      <a
                        href={selectedMatch.imovel.link_anuncio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Ver anúncio original <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </section>

                {/* Score breakdown */}
                <section>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Por que combinou ({selectedMatch.score}/100)
                  </h4>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-3">
                    <div
                      className={`h-full bg-gradient-to-r ${scoreColor(selectedMatch.score)}`}
                      style={{ width: `${Math.min(100, selectedMatch.score)}%` }}
                    />
                  </div>
                  {(selectedMatch.match_reasons || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sem critérios registrados.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selectedMatch.match_reasons.map((r: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md px-2.5 py-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-emerald-900 dark:text-emerald-200">{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Ações */}
                <section className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {selectedMatch.lead?.telefone && (
                    <Button
                      className="gap-1.5 flex-1 min-w-[140px]"
                      onClick={(e) => handleWhatsapp(e, selectedMatch)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Enviar WhatsApp
                    </Button>
                  )}
                  {selectedMatch.status !== "converted" && (
                    <Button
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        updateStatus.mutate({ id: selectedMatch.id, status: "converted" });
                        setSheetOpen(false);
                      }}
                    >
                      <Check className="w-4 h-4" />
                      Converteu
                    </Button>
                  )}
                  {selectedMatch.status !== "dismissed" && (
                    <Button
                      variant="ghost"
                      className="gap-1.5 text-muted-foreground"
                      onClick={() => {
                        updateStatus.mutate({ id: selectedMatch.id, status: "dismissed" });
                        setSheetOpen(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                      Descartar
                    </Button>
                  )}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
