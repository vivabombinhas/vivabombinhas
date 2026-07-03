import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, EyeOff, Eye, ImageOff, MapPinOff, DollarSign, Users } from "lucide-react";

type Imovel = {
  id: string;
  titulo: string | null;
  finalidade: string | null;
  tipo: string | null;
  bairro: string | null;
  preco: number | null;
  preco_temporada_diaria: number | null;
  capacidade_pessoas: number | null;
  quartos: number | null;
  fotos: string[] | null;
  status: string | null;
  oculta_para_maria: boolean | null;
  destaque: boolean | null;
};

const currency = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function AdminInventario() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_inventario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id,titulo,finalidade,tipo,bairro,preco,preco_temporada_diaria,capacidade_pessoas,quartos,fotos,status,oculta_para_maria,destaque")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Imovel[];
    },
  });

  const [finalidade, setFinalidade] = useState("all");
  const [bairro, setBairro] = useState("all");
  const [tipo, setTipo] = useState("all");
  const [status, setStatus] = useState("all");
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [capMin, setCapMin] = useState("");
  const [fotoFilter, setFotoFilter] = useState("all");
  const [visMaria, setVisMaria] = useState("all");

  const imoveis = data ?? [];

  const ativos = imoveis.filter((i) => i.status === "ativo");

  const stats = useMemo(() => {
    const byFinalidade: Record<string, number> = {};
    const byBairro: Record<string, number> = {};
    const byTipo: Record<string, number> = {};
    let semPreco = 0, semBairro = 0, semFotos = 0, semCap = 0, ocultos = 0, visiveis = 0;
    let minPreco = Infinity, maxPreco = -Infinity, minDiaria = Infinity, maxDiaria = -Infinity;

    for (const i of ativos) {
      const f = i.finalidade || "—";
      byFinalidade[f] = (byFinalidade[f] || 0) + 1;
      const b = i.bairro || "(sem bairro)";
      byBairro[b] = (byBairro[b] || 0) + 1;
      const t = i.tipo || "—";
      byTipo[t] = (byTipo[t] || 0) + 1;

      const hasPreco = i.preco != null || i.preco_temporada_diaria != null;
      if (!hasPreco) semPreco++;
      if (!i.bairro) semBairro++;
      if (!i.fotos || i.fotos.length === 0) semFotos++;
      if (i.capacidade_pessoas == null) semCap++;
      if (i.oculta_para_maria) ocultos++;
      else visiveis++;

      if (i.preco != null) { minPreco = Math.min(minPreco, i.preco); maxPreco = Math.max(maxPreco, i.preco); }
      if (i.preco_temporada_diaria != null) {
        minDiaria = Math.min(minDiaria, i.preco_temporada_diaria);
        maxDiaria = Math.max(maxDiaria, i.preco_temporada_diaria);
      }
    }

    return {
      total: ativos.length,
      byFinalidade, byBairro, byTipo,
      semPreco, semBairro, semFotos, semCap, ocultos, visiveis,
      minPreco: minPreco === Infinity ? null : minPreco,
      maxPreco: maxPreco === -Infinity ? null : maxPreco,
      minDiaria: minDiaria === Infinity ? null : minDiaria,
      maxDiaria: maxDiaria === -Infinity ? null : maxDiaria,
    };
  }, [ativos]);

  const bairros = useMemo(() => Array.from(new Set(imoveis.map((i) => i.bairro).filter(Boolean))) as string[], [imoveis]);
  const tipos = useMemo(() => Array.from(new Set(imoveis.map((i) => i.tipo).filter(Boolean))) as string[], [imoveis]);
  const finalidades = useMemo(() => Array.from(new Set(imoveis.map((i) => i.finalidade).filter(Boolean))) as string[], [imoveis]);
  const statuses = useMemo(() => Array.from(new Set(imoveis.map((i) => i.status).filter(Boolean))) as string[], [imoveis]);

  const filtered = useMemo(() => {
    const pMin = precoMin ? Number(precoMin) : null;
    const pMax = precoMax ? Number(precoMax) : null;
    const cMin = capMin ? Number(capMin) : null;
    return imoveis.filter((i) => {
      if (finalidade !== "all" && i.finalidade !== finalidade) return false;
      if (bairro !== "all" && i.bairro !== bairro) return false;
      if (tipo !== "all" && i.tipo !== tipo) return false;
      if (status !== "all" && i.status !== status) return false;
      const preco = i.preco ?? i.preco_temporada_diaria;
      if (pMin != null && (preco == null || preco < pMin)) return false;
      if (pMax != null && (preco == null || preco > pMax)) return false;
      if (cMin != null && (i.capacidade_pessoas == null || i.capacidade_pessoas < cMin)) return false;
      const hasFoto = (i.fotos?.length ?? 0) > 0;
      if (fotoFilter === "com" && !hasFoto) return false;
      if (fotoFilter === "sem" && hasFoto) return false;
      if (visMaria === "visivel" && i.oculta_para_maria) return false;
      if (visMaria === "oculto" && !i.oculta_para_maria) return false;
      return true;
    });
  }, [imoveis, finalidade, bairro, tipo, status, precoMin, precoMax, capMin, fotoFilter, visMaria]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const KpiCard = ({ icon: Icon, label, value, tone }: any) => (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tone ?? "bg-muted"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Diagnóstico do Inventário</h1>
        <p className="text-sm text-muted-foreground">O que a MarIA consegue buscar hoje na base de imóveis ativos.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Ativos" value={stats.total} tone="bg-primary/10 text-primary" />
        <KpiCard icon={Eye} label="Visíveis p/ MarIA" value={stats.visiveis} tone="bg-green-500/10 text-green-600" />
        <KpiCard icon={EyeOff} label="Ocultos p/ MarIA" value={stats.ocultos} tone="bg-orange-500/10 text-orange-600" />
        <KpiCard icon={ImageOff} label="Sem fotos" value={stats.semFotos} tone="bg-red-500/10 text-red-600" />
        <KpiCard icon={DollarSign} label="Sem preço" value={stats.semPreco} tone="bg-red-500/10 text-red-600" />
        <KpiCard icon={MapPinOff} label="Sem bairro" value={stats.semBairro} tone="bg-red-500/10 text-red-600" />
        <KpiCard icon={Users} label="Sem capacidade" value={stats.semCap} tone="bg-red-500/10 text-red-600" />
        <KpiCard icon={DollarSign} label="Faixa venda" value={
          stats.minPreco != null ? `${currency(stats.minPreco)} — ${currency(stats.maxPreco)}` : "—"
        } />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Por finalidade</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(stats.byFinalidade).sort((a,b)=>b[1]-a[1]).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span>{k}</span><Badge variant="secondary">{v}</Badge></div>
            ))}
            {Object.keys(stats.byFinalidade).length === 0 && <div className="text-muted-foreground">Nenhum imóvel ativo.</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Por bairro</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm max-h-64 overflow-auto">
            {Object.entries(stats.byBairro).sort((a,b)=>b[1]-a[1]).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="truncate">{k}</span><Badge variant="secondary">{v}</Badge></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Por tipo</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(stats.byTipo).sort((a,b)=>b[1]-a[1]).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span>{k}</span><Badge variant="secondary">{v}</Badge></div>
            ))}
            <div className="pt-2 mt-2 border-t text-xs text-muted-foreground">
              Faixa diária: {stats.minDiaria != null ? `${currency(stats.minDiaria)} — ${currency(stats.maxDiaria)}` : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Select value={finalidade} onValueChange={setFinalidade}>
            <SelectTrigger><SelectValue placeholder="Finalidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas finalidades</SelectItem>
              {finalidades.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={bairro} onValueChange={setBairro}>
            <SelectTrigger><SelectValue placeholder="Bairro" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos bairros</SelectItem>
              {bairros.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Preço min" value={precoMin} onChange={(e) => setPrecoMin(e.target.value)} type="number" />
          <Input placeholder="Preço max" value={precoMax} onChange={(e) => setPrecoMax(e.target.value)} type="number" />
          <Input placeholder="Capacidade mín" value={capMin} onChange={(e) => setCapMin(e.target.value)} type="number" />
          <Select value={fotoFilter} onValueChange={setFotoFilter}>
            <SelectTrigger><SelectValue placeholder="Fotos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas fotos</SelectItem>
              <SelectItem value="com">Com foto</SelectItem>
              <SelectItem value="sem">Sem foto</SelectItem>
            </SelectContent>
          </Select>
          <Select value={visMaria} onValueChange={setVisMaria}>
            <SelectTrigger><SelectValue placeholder="MarIA" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos (MarIA)</SelectItem>
              <SelectItem value="visivel">Visível p/ MarIA</SelectItem>
              <SelectItem value="oculto">Oculto p/ MarIA</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Imóveis ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Finalidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Diária</TableHead>
                <TableHead className="text-center">Pessoas</TableHead>
                <TableHead className="text-center">Quartos</TableHead>
                <TableHead className="text-center">Fotos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MarIA</TableHead>
                <TableHead>Destaque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="max-w-[240px] truncate">{i.titulo || "—"}</TableCell>
                  <TableCell>{i.finalidade || "—"}</TableCell>
                  <TableCell>{i.tipo || "—"}</TableCell>
                  <TableCell>{i.bairro || <span className="text-red-500">—</span>}</TableCell>
                  <TableCell className="text-right">{currency(i.preco)}</TableCell>
                  <TableCell className="text-right">{currency(i.preco_temporada_diaria)}</TableCell>
                  <TableCell className="text-center">{i.capacidade_pessoas ?? "—"}</TableCell>
                  <TableCell className="text-center">{i.quartos ?? "—"}</TableCell>
                  <TableCell className="text-center">{i.fotos?.length ?? 0}</TableCell>
                  <TableCell><Badge variant={i.status === "ativo" ? "default" : "secondary"}>{i.status}</Badge></TableCell>
                  <TableCell>
                    {i.oculta_para_maria
                      ? <Badge variant="destructive">Oculto</Badge>
                      : <Badge variant="secondary">Visível</Badge>}
                  </TableCell>
                  <TableCell>{i.destaque ? <Badge>Destaque</Badge> : "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">Nenhum imóvel para os filtros atuais.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
