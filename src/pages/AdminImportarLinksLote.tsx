import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type ItemStatus = "pending" | "running" | "success" | "duplicate" | "error";
interface Item {
  url: string;
  status: ItemStatus;
  message?: string;
  titulo?: string;
  id?: string;
}

function inferOrigem(link?: string | null): string {
  if (!link) return "manual";
  const l = link.toLowerCase();
  if (l.includes("airbnb")) return "airbnb";
  if (l.includes("booking")) return "booking";
  if (l.includes("olx")) return "olx";
  if (l.includes("zapimoveis") || l.includes("zap.com")) return "zap_imoveis";
  if (l.includes("vivareal") || l.includes("viva-real")) return "viva_real";
  if (l.includes("imovelweb")) return "imovel_web";
  return "outro";
}

const FINALIDADES = ["temporada", "aluguel_anual", "compra"];
const TIPOS = ["apartamento", "casa", "cobertura", "terreno", "sobrado", "studio", "pousada", "sala_comercial", "outro"];

export default function AdminImportarLinksLote() {
  const { toast } = useToast();
  const [raw, setRaw] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const parseLinks = (text: string): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const line of text.split(/\r?\n/)) {
      const u = line.trim();
      if (!u) continue;
      try {
        const parsed = new URL(u);
        const norm = parsed.toString();
        if (!seen.has(norm)) {
          seen.add(norm);
          out.push(norm);
        }
      } catch {
        // skip invalid line silently — will be reported if user included non-URL text
      }
    }
    return out;
  };

  const processOne = async (url: string): Promise<Partial<Item>> => {
    try {
      // Check duplicate first (cheaper than extraction)
      const { data: existing } = await supabase
        .from("imoveis")
        .select("id, titulo")
        .eq("link_anuncio", url)
        .maybeSingle();
      if (existing) {
        return { status: "duplicate", message: "Link já existe no inventário", titulo: existing.titulo ?? undefined, id: existing.id };
      }

      const { data: result, error } = await supabase.functions.invoke("extract-property-from-link", {
        body: { url },
      });
      if (error) throw new Error(error.message || "Falha na extração");
      if (!result?.success || !result?.data) throw new Error(result?.error || "Falha na extração");

      const d = result.data;
      const finalidade = FINALIDADES.includes(d.finalidade) ? d.finalidade : "compra";
      const tipo = TIPOS.includes(d.tipo) ? d.tipo : "outro";
      const titulo = (d.titulo?.trim() as string) || `Imóvel importado ${new Date().toLocaleDateString("pt-BR")}`;

      // Em lote não há revisão visual: se a galeria principal veio vazia (baixa confiança),
      // caímos para likely + doubtful do photos_groups para não salvar imóvel sem fotos.
      // O admin ainda revisa manualmente antes de ativar.
      const fotosPrincipais = Array.isArray(d.fotos) && d.fotos.length > 0 ? d.fotos : [];
      const fotosFallback = [
        ...(d.photos_groups?.likely ?? []),
        ...(d.photos_groups?.doubtful ?? []),
      ];
      const fotosFinal = fotosPrincipais.length > 0 ? fotosPrincipais : fotosFallback;

      const { data: inserted, error: insErr } = await supabase.from("imoveis").insert({
        codigo: d.codigo?.trim() || null,
        titulo,
        descricao: d.descricao || null,
        finalidade: finalidade as never,
        tipo: tipo as never,
        cidade: "Bombinhas",
        bairro: d.bairro || null,
        endereco: d.endereco || null,
        quartos: d.quartos ?? 0,
        suites: d.suites ?? 0,
        banheiros: d.banheiros ?? 0,
        vagas_garagem: d.vagas_garagem ?? 0,
        area_m2: d.area_m2 || null,
        capacidade_pessoas: d.capacidade_pessoas || null,
        mobiliado: d.mobiliado ?? false,
        piscina: d.piscina ?? false,
        vista_mar: d.vista_mar ?? false,
        frente_mar: d.frente_mar ?? false,
        churrasqueira: d.churrasqueira ?? false,
        ar_condicionado: d.ar_condicionado ?? false,
        aceita_pet: d.aceita_pet ?? false,
        wifi: d.wifi ?? false,
        estacionamento: d.estacionamento ?? false,
        preco: d.preco || null,
        preco_temporada_diaria: d.preco_temporada_diaria || null,
        condominio: d.condominio || null,
        iptu_anual: d.iptu_anual || null,
        link_anuncio: d.link_anuncio || url,
        fotos: Array.isArray(d.fotos) && d.fotos.length > 0 ? d.fotos : null,
        anunciante_nome: d.anunciante_nome?.trim() || null,
        anunciante_telefone: d.anunciante_telefone?.trim() || null,
        anunciante_email: d.anunciante_email?.trim() || null,
        imobiliaria: d.imobiliaria?.trim() || null,
        origem: inferOrigem(d.link_anuncio || url) as never,
        // Rascunho: fora da vitrine E oculto da MarIA até revisão manual
        status: "pausado" as never,
        oculta_para_maria: true,
      }).select("id").single();
      if (insErr) throw new Error(insErr.message);
      return { status: "success", titulo, id: inserted?.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      return { status: "error", message: msg };
    }
  };

  const handleStart = async () => {
    const urls = parseLinks(raw);
    if (urls.length === 0) {
      toast({ title: "Cole ao menos um link válido (um por linha)", variant: "destructive" });
      return;
    }
    if (urls.length > 30) {
      toast({ title: `Máximo de 30 por vez (você colou ${urls.length})`, variant: "destructive" });
      return;
    }
    const initial: Item[] = urls.map((url) => ({ url, status: "pending" }));
    setItems(initial);
    setRunning(true);
    setDone(false);

    for (let i = 0; i < initial.length; i++) {
      setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, status: "running" } : it)));
      const result = await processOne(initial[i].url);
      setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...result } : it)));
    }

    setRunning(false);
    setDone(true);
  };

  const reset = () => {
    setRaw("");
    setItems([]);
    setDone(false);
  };

  const successCount = items.filter((i) => i.status === "success").length;
  const dupCount = items.filter((i) => i.status === "duplicate").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const runningIdx = items.findIndex((i) => i.status === "running");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="container flex items-center gap-4 py-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Importar Links em Lote (IA)</h1>
            <p className="text-sm text-muted-foreground">
              Cole vários links, um por linha. Cada imóvel entra como <strong>rascunho pausado</strong> e oculto da MarIA
              — você revisa e ativa manualmente em "Meus Imóveis".
            </p>
          </div>
          <Link to="/admin/importar-link" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Importar um só
          </Link>
        </div>
      </header>

      <main className="container py-8 max-w-3xl space-y-6">
        {items.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="links">Links (um por linha, até 30)</Label>
              <Textarea
                id="links"
                rows={12}
                placeholder={"https://www.airbnb.com.br/rooms/123\nhttps://www.olx.com.br/imoveis/...\nhttps://www.vivareal.com.br/..."}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                {parseLinks(raw).length} link(s) válido(s) detectado(s). Linhas em branco e URLs inválidas são ignoradas.
              </p>
            </div>
            <Button
              onClick={handleStart}
              size="lg"
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
              disabled={parseLinks(raw).length === 0}
            >
              <Sparkles className="h-4 w-4" />
              Extrair e importar em lote
            </Button>
          </div>
        )}

        {items.length > 0 && (
          <>
            {done && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                <h2 className="font-semibold text-base mb-2">Resumo da importação</h2>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{successCount}</div>
                    <div className="text-xs text-muted-foreground">Importados (rascunho)</div>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{dupCount}</div>
                    <div className="text-xs text-muted-foreground">Já existiam</div>
                  </div>
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <div className="text-2xl font-bold text-destructive">{errorCount}</div>
                    <div className="text-xs text-muted-foreground">Falharam</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button asChild variant="default">
                    <Link to="/admin/imoveis">Revisar em "Meus Imóveis"</Link>
                  </Button>
                  <Button variant="outline" onClick={reset}>Importar mais</Button>
                </div>
              </div>
            )}

            {!done && (
              <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="text-sm">
                  Processando {runningIdx >= 0 ? runningIdx + 1 : items.length} de {items.length}...
                  <span className="text-muted-foreground ml-2">Não feche esta página.</span>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
              {items.map((it, idx) => (
                <div key={idx} className="p-3 flex items-start gap-3 text-sm">
                  <div className="mt-0.5">
                    {it.status === "pending" && <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />}
                    {it.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {it.status === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {it.status === "duplicate" && <CheckCircle2 className="h-4 w-4 text-amber-500" />}
                    {it.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs text-muted-foreground">{it.url}</div>
                    {it.titulo && <div className="font-medium">{it.titulo}</div>}
                    {it.message && (
                      <div className={it.status === "error" ? "text-destructive text-xs" : "text-xs text-muted-foreground"}>
                        {it.message}
                      </div>
                    )}
                    {it.status === "success" && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">
                        Importado como rascunho pausado · oculto da MarIA
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {running && (
              <p className="text-xs text-muted-foreground text-center">
                Cada link leva ~10-30s. Sites pesados podem demorar mais.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
