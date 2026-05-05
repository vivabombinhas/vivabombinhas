import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Users,
  Home,
  Sparkles,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CalendarClock,
  DollarSign,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin_dashboard_stats"],
    queryFn: async () => {
      const today = startOfToday();
      const weekAgo = startOfWeek();
      const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
      const nowIso = new Date().toISOString();

      const [
        leadsHoje,
        leadsSemana,
        leadsNovos,
        matchesPendentes,
        matchesAltoScore,
        imoveisAtivos,
        submissoesPendentes,
        destaquesPendentes,
        followupsAtrasados,
        followupsHoje,
        ultimosLeads,
        topMatches,
        revenue,
        destaquesAtivos,
      ] = await Promise.all([
        supabase.from("leads_maria").select("*", { count: "exact", head: true }).gte("created_at", today).neq("status", "anonimo"),
        supabase.from("leads_maria").select("*", { count: "exact", head: true }).gte("created_at", weekAgo).neq("status", "anonimo"),
        supabase.from("leads_maria").select("*", { count: "exact", head: true }).eq("status", "novo"),
        supabase.from("lead_matches").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("lead_matches").select("*", { count: "exact", head: true }).eq("status", "pending").gte("score", 70),
        supabase.from("imoveis").select("*", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("imoveis_submissions").select("*", { count: "exact", head: true }).eq("status_submission", "pendente"),
        supabase.from("imoveis_submissions").select("*", { count: "exact", head: true }).eq("status_submission", "pendente").ilike("observacoes", "%[DESTAQUE-PAGO-SIMULADO]%"),
        supabase.from("leads_maria").select("*", { count: "exact", head: true }).not("next_followup_at", "is", null).lt("next_followup_at", nowIso).neq("status", "convertido").neq("status", "descartado").neq("status", "anonimo"),
        supabase.from("leads_maria").select("*", { count: "exact", head: true }).not("next_followup_at", "is", null).gte("next_followup_at", nowIso).lte("next_followup_at", endOfToday.toISOString()).neq("status", "convertido").neq("status", "descartado").neq("status", "anonimo"),
        supabase.from("leads_maria").select("id, nome, telefone, bairro_interesse, tipo_imovel, status, created_at").neq("status", "anonimo").order("created_at", { ascending: false }).limit(5),
        supabase.from("lead_matches").select("id, score, match_reasons, lead_id, imovel_id, created_at, leads_maria(nome, telefone), imoveis(titulo, bairro)").eq("status", "pending").order("score", { ascending: false }).limit(5),
        supabase.from("lead_revenue").select("status, valor_previsto, valor_pago"),
        supabase.from("imoveis").select("id, titulo, bairro, anunciante_nome, anunciante_telefone, destaque_ate").eq("destaque", true).eq("status", "ativo").order("destaque_ate", { ascending: true }),
      ]);

      const revList = (revenue.data || []) as Array<{ status: string; valor_previsto: number | null; valor_pago: number | null }>;
      const previstoAtivo = revList
        .filter((r) => r.status !== "cancelado" && r.status !== "pago")
        .reduce((a, r) => a + (Number(r.valor_previsto) || 0), 0);
      const pago = revList.reduce((a, r) => a + (Number(r.valor_pago) || 0), 0);

      return {
        leadsHoje: leadsHoje.count || 0,
        leadsSemana: leadsSemana.count || 0,
        leadsNovos: leadsNovos.count || 0,
        matchesPendentes: matchesPendentes.count || 0,
        matchesAltoScore: matchesAltoScore.count || 0,
        imoveisAtivos: imoveisAtivos.count || 0,
        submissoesPendentes: submissoesPendentes.count || 0,
        destaquesPendentes: destaquesPendentes.count || 0,
        followupsAtrasados: followupsAtrasados.count || 0,
        followupsHoje: followupsHoje.count || 0,
        ultimosLeads: ultimosLeads.data || [],
        topMatches: topMatches.data || [],
        destaquesAtivos: destaquesAtivos.data || [],
        previstoAtivo,
        pago,
      };
    },
  });

  const cards = [
    {
      title: "Follow-ups",
      value: (stats?.followupsAtrasados ?? 0) + (stats?.followupsHoje ?? 0),
      sub: `${stats?.followupsAtrasados ?? 0} atrasados · ${stats?.followupsHoje ?? 0} hoje`,
      icon: CalendarClock,
      color: (stats?.followupsAtrasados ?? 0) > 0
        ? "text-red-600 bg-red-500/10"
        : "text-amber-600 bg-amber-500/10",
      to: "/admin/followups",
    },
    {
      title: "Leads novos",
      value: stats?.leadsNovos ?? "—",
      sub: "Aguardando primeiro contato",
      icon: MessageSquare,
      color: "text-blue-600 bg-blue-500/10",
      to: "/admin/leads",
    },
    {
      title: "Matches pendentes",
      value: stats?.matchesPendentes ?? "—",
      sub: `${stats?.matchesAltoScore ?? 0} com score ≥ 70`,
      icon: Sparkles,
      color: "text-emerald-600 bg-emerald-500/10",
      to: "/admin/matches",
    },
    {
      title: "Leads (7 dias)",
      value: stats?.leadsSemana ?? "—",
      sub: `${stats?.leadsHoje ?? 0} hoje`,
      icon: Users,
      color: "text-purple-600 bg-purple-500/10",
      to: "/admin/leads",
    },
    {
      title: "Receita prevista",
      value: stats ? fmtBRL(stats.previstoAtivo) : "—",
      sub: `Pago: ${stats ? fmtBRL(stats.pago) : "—"}`,
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-500/10",
      to: "/admin/receita",
    },
    {
      title: "Submissões",
      value: stats?.submissoesPendentes ?? "—",
      sub: (stats?.destaquesPendentes ?? 0) > 0 
        ? `${stats?.destaquesPendentes} destaque(s) pago(s) 🔥` 
        : `${stats?.imoveisAtivos ?? 0} imóveis ativos`,
      icon: Home,
      color: (stats?.destaquesPendentes ?? 0) > 0 
        ? "text-amber-600 bg-amber-500/10 animate-pulse" 
        : "text-cyan-600 bg-cyan-500/10",
      to: "/admin/submissions",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-lg font-bold font-display">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Visão geral do CRM</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {cards.map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? <span className="inline-block w-10 h-7 bg-muted rounded animate-pulse" /> : c.value}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">{c.title}</div>
              <div className="text-xs text-muted-foreground mt-2">{c.sub}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Últimos leads */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Últimos leads
              </h2>
              <Link to="/admin/leads" className="text-xs text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : !stats?.ultimosLeads?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum lead ainda</p>
            ) : (
              <ul className="space-y-2">
                {stats.ultimosLeads.map((l: any) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{l.nome || "Sem nome"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[l.bairro_interesse, l.tipo_imovel].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{l.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Top matches */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Melhores matches pendentes
              </h2>
              <Link to="/admin/matches" className="text-xs text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : !stats?.topMatches?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum match pendente</p>
            ) : (
              <ul className="space-y-2">
                {stats.topMatches.map((m: any) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {m.leads_maria?.nome || "Lead"} → {m.imoveis?.titulo || "Imóvel"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.imoveis?.bairro || ""}
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-700 border border-emerald-200 hover:bg-emerald-500/10">
                      {m.score} pts
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Destaques Ativos */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              Imóveis em Destaque (Ativos)
            </h2>
            <Link to="/admin/submissions" className="text-xs text-primary hover:underline">
              Gerenciar
            </Link>
          </div>
          {isLoading ? (
            <div className="h-12 bg-muted rounded animate-pulse" />
          ) : !stats?.destaquesAtivos?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum imóvel em destaque no momento</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="pb-2 font-medium">Imóvel</th>
                    <th className="pb-2 font-medium">Parceiro</th>
                    <th className="pb-2 font-medium">Validade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.destaquesAtivos.map((d: any) => (
                    <tr key={d.id} className="group">
                      <td className="py-2 pr-4">
                        <div className="font-medium group-hover:text-primary transition">{d.titulo}</div>
                        <div className="text-xs text-muted-foreground">{d.bairro}</div>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="text-xs font-medium">{d.anunciante_nome || "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{d.anunciante_telefone || ""}</div>
                      </td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-[10px] bg-amber-500/5 text-amber-700 border-amber-200">
                          Até {new Date(d.destaque_ate).toLocaleDateString("pt-BR")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
