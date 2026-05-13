import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, MapPin, Target, MessageSquareOff, Users, Calendar } from "lucide-react";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];

export default function AdminInsights() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["admin_insights"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isoDate = thirtyDaysAgo.toISOString();

      const [
        bairrosData,
        interesseData,
        noResultsData,
        leadsCapturados,
        conversasPorDia,
      ] = await Promise.all([
        // 1. TOP 5 BAIRROS
        supabase
          .from("leads_maria")
          .select("bairro_interesse")
          .not("bairro_interesse", "is", null),
        
        // 2. DISTRIBUIÇÃO POR FINALIDADE
        supabase
          .from("leads_maria")
          .select("interesse")
          .not("interesse", "is", null),

        // 3. BUSCAS SEM RESULTADO
        supabase
          .from("lead_conversations")
          .select("id, content, created_at, lead_id, leads_maria(nome, telefone)")
          .gte("created_at", isoDate)
          .ilike("content", "%Não encontrei opções exatas%")
          .order("created_at", { ascending: false }),

        // 4. LEADS CAPTURADOS
        supabase
          .from("leads_maria")
          .select("id", { count: "exact", head: true })
          .gte("created_at", isoDate)
          .not("nome", "is", null)
          .not("telefone", "is", null)
          .neq("nome", "")
          .neq("telefone", ""),

        // 5. CONVERSAS POR DIA (últimos 30 dias)
        supabase
          .from("lead_conversations")
          .select("created_at")
          .gte("created_at", isoDate),
      ]);

      // Process Bairros
      const bairroCounts: Record<string, number> = {};
      bairrosData.data?.forEach((l) => {
        const b = l.bairro_interesse?.trim();
        if (b) bairroCounts[b] = (bairroCounts[b] || 0) + 1;
      });
      const topBairros = Object.entries(bairroCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Process Interesse
      const interesseCounts: Record<string, number> = {};
      interesseData.data?.forEach((l) => {
        const i = l.interesse?.trim();
        if (i) interesseCounts[i] = (interesseCounts[i] || 0) + 1;
      });
      const interesseDist = Object.entries(interesseCounts).map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value,
      }));

      // Process Conversas por dia
      const dailyCounts: Record<string, number> = {};
      conversasPorDia.data?.forEach((c) => {
        const day = new Date(c.created_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      });
      
      // Sort and fill missing days if needed (simple sort for now)
      const chartData = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .slice(-15); // Show last 15 active days for better fit

      return {
        topBairros,
        interesseDist,
        noResults: noResultsData.data || [],
        leadsTotal: leadsCapturados.count || 0,
        chartData,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insights da MarIA</h1>
          <p className="text-muted-foreground">O cérebro por trás das conversas e demandas.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Leads Qualificados (30d)</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.leadsTotal}</div>
            <p className="text-xs text-muted-foreground">Nome e Telefone preenchidos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Bairros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Bairros Mais Buscados
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights?.topBairros} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Finalidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Distribuição por Finalidade
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insights?.interesseDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {insights?.interesseDist.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Conversas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Volume de Mensagens (Últimos dias ativos)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={insights?.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Buscas sem Resultado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquareOff className="w-5 h-5 text-destructive" />
            Buscas Sem Resultado (Últimos 30 dias)
          </CardTitle>
          <p className="text-sm text-muted-foreground">Oportunidades de inventário ou ajustes de filtros.</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Resposta da MarIA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights?.noResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                      Nenhuma busca sem resultado registrada recentemente.
                    </TableCell>
                  </TableRow>
                ) : (
                  insights?.noResults.map((conv: any) => (
                    <TableRow key={conv.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(conv.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{conv.leads_maria?.nome || "Lead Anonimo"}</div>
                        <div className="text-xs text-muted-foreground">{conv.leads_maria?.telefone || ""}</div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm italic text-muted-foreground line-clamp-2">
                          "{conv.content}"
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
