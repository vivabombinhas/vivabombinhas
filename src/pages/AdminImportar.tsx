import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Download,
} from "lucide-react";

const FINALIDADES = ["compra", "aluguel_anual", "temporada"] as const;
const TIPOS = [
  "apartamento",
  "casa",
  "cobertura",
  "terreno",
  "sobrado",
  "studio",
  "pousada",
  "sala_comercial",
  "outro",
] as const;
const BAIRROS_VALIDOS = [
  "Bombas",
  "Centro",
  "Mariscal",
  "Zimbros",
  "Canto Grande",
  "Morrinhos",
  "Quatro Ilhas",
];

type Finalidade = (typeof FINALIDADES)[number];
type Tipo = (typeof TIPOS)[number];

type RowStatus = "valid" | "duplicate" | "error";

interface ParsedRow {
  index: number;
  raw: Record<string, any>;
  data: any;
  status: RowStatus;
  errors: string[];
  warnings: string[];
}

const REQUIRED_HEADERS = ["titulo", "finalidade", "tipo"];

function normalizeStr(v: any): string {
  return String(v ?? "").trim();
}
function toNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).replace(/[R$\s.]/g, "").replace(",", ".");
  const n = Number(s);
  return isNaN(n) ? null : n;
}
function toInt(v: any): number | null {
  const n = toNum(v);
  return n === null ? null : Math.trunc(n);
}
function toBool(v: any): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return ["1", "true", "sim", "yes", "y", "x"].includes(s);
}
function toArray(v: any): string[] | null {
  if (!v) return null;
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return String(v)
    .split(/[\n;,|]/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http"));
}

function validateRow(raw: Record<string, any>, index: number): ParsedRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  const titulo = normalizeStr(raw.titulo);
  const finalidade = normalizeStr(raw.finalidade).toLowerCase() as Finalidade;
  const tipo = normalizeStr(raw.tipo).toLowerCase() as Tipo;
  const bairro = normalizeStr(raw.bairro);
  const link = normalizeStr(raw.link_anuncio);

  if (!titulo) errors.push("titulo é obrigatório");
  if (!FINALIDADES.includes(finalidade))
    errors.push(`finalidade inválida (use: ${FINALIDADES.join(", ")})`);
  if (!TIPOS.includes(tipo))
    errors.push(`tipo inválido (use: ${TIPOS.join(", ")})`);

  if (bairro && !BAIRROS_VALIDOS.find((b) => b.toLowerCase() === bairro.toLowerCase()))
    warnings.push(`bairro "${bairro}" não está na lista padrão`);

  const preco = toNum(raw.preco);
  const precoTemp = toNum(raw.preco_temporada_diaria);
  if (finalidade === "temporada" && !precoTemp && !preco)
    warnings.push("temporada sem preço informado");
  if ((finalidade === "compra" || finalidade === "aluguel_anual") && !preco)
    warnings.push("preço não informado");

  if (!raw.anunciante_telefone && !raw.anunciante_email)
    warnings.push("sem contato (telefone/email)");

  const data = {
    titulo,
    descricao: normalizeStr(raw.descricao) || null,
    finalidade,
    tipo,
    cidade: normalizeStr(raw.cidade) || "Bombinhas",
    bairro: bairro || null,
    endereco: normalizeStr(raw.endereco) || null,
    quartos: toInt(raw.quartos) ?? 0,
    suites: toInt(raw.suites) ?? 0,
    banheiros: toInt(raw.banheiros) ?? 0,
    vagas_garagem: toInt(raw.vagas_garagem) ?? 0,
    area_m2: toNum(raw.area_m2),
    capacidade_pessoas: toInt(raw.capacidade_pessoas),
    mobiliado: toBool(raw.mobiliado),
    piscina: toBool(raw.piscina),
    vista_mar: toBool(raw.vista_mar),
    frente_mar: toBool(raw.frente_mar),
    churrasqueira: toBool(raw.churrasqueira),
    ar_condicionado: toBool(raw.ar_condicionado),
    aceita_pet: toBool(raw.aceita_pet),
    wifi: toBool(raw.wifi),
    estacionamento: toBool(raw.estacionamento),
    preco,
    preco_temporada_diaria: precoTemp,
    condominio: toNum(raw.condominio),
    iptu_anual: toNum(raw.iptu_anual),
    link_anuncio: link || null,
    fotos: toArray(raw.fotos),
    anunciante_nome: normalizeStr(raw.anunciante_nome) || null,
    anunciante_telefone: normalizeStr(raw.anunciante_telefone) || null,
    anunciante_email: normalizeStr(raw.anunciante_email) || null,
    imobiliaria: normalizeStr(raw.imobiliaria) || null,
    observacoes: normalizeStr(raw.observacoes) || null,
    codigo: normalizeStr(raw.codigo) || null,
    origem: (normalizeStr(raw.origem).toLowerCase() || "manual") as any,
    status: "ativo" as const,
  };

  return {
    index,
    raw,
    data,
    status: errors.length > 0 ? "error" : "valid",
    errors,
    warnings,
  };
}

const TEMPLATE_HEADERS = [
  "titulo",
  "descricao",
  "finalidade",
  "tipo",
  "cidade",
  "bairro",
  "endereco",
  "quartos",
  "suites",
  "banheiros",
  "vagas_garagem",
  "area_m2",
  "capacidade_pessoas",
  "preco",
  "preco_temporada_diaria",
  "condominio",
  "iptu_anual",
  "mobiliado",
  "piscina",
  "vista_mar",
  "frente_mar",
  "churrasqueira",
  "ar_condicionado",
  "aceita_pet",
  "wifi",
  "estacionamento",
  "link_anuncio",
  "fotos",
  "anunciante_nome",
  "anunciante_telefone",
  "anunciante_email",
  "imobiliaria",
  "codigo",
  "origem",
  "observacoes",
];

export default function AdminImportar() {
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    skipped: number;
    failed: number;
  } | null>(null);

  const handleDownloadTemplate = () => {
    const sample = [
      TEMPLATE_HEADERS,
      [
        "Apartamento frente mar em Bombas",
        "Lindo 2 dormitórios com vista",
        "temporada",
        "apartamento",
        "Bombinhas",
        "Bombas",
        "Av. Beira Mar, 100",
        "2",
        "1",
        "2",
        "1",
        "75",
        "6",
        "",
        "450",
        "",
        "",
        "true",
        "true",
        "true",
        "false",
        "true",
        "true",
        "false",
        "true",
        "true",
        "https://exemplo.com/anuncio",
        "https://exemplo.com/foto1.jpg;https://exemplo.com/foto2.jpg",
        "Maria Corretora",
        "47999999999",
        "maria@email.com",
        "Imobiliária X",
        "AP-001",
        "manual",
        "",
      ],
    ];
    const csv = sample.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-imoveis.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const processRows = async (rawRows: Record<string, any>[]) => {
    if (rawRows.length === 0) {
      toast({ title: "Arquivo vazio", variant: "destructive" });
      return;
    }
    const headers = Object.keys(rawRows[0] ?? {});
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      toast({
        title: "Cabeçalhos obrigatórios ausentes",
        description: `Faltam: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    let parsed = rawRows.map((r, i) => validateRow(r, i + 2));

    // Dedup interno (mesma planilha) por link ou titulo+bairro
    const seen = new Set<string>();
    parsed = parsed.map((p) => {
      if (p.status === "error") return p;
      const key =
        (p.data.link_anuncio || `${p.data.titulo}|${p.data.bairro || ""}`).toLowerCase();
      if (seen.has(key)) {
        return { ...p, status: "duplicate" as const, errors: ["duplicado dentro da planilha"] };
      }
      seen.add(key);
      return p;
    });

    // Dedup contra banco
    const links = parsed.filter((p) => p.status === "valid" && p.data.link_anuncio).map((p) => p.data.link_anuncio);
    const titulos = parsed.filter((p) => p.status === "valid").map((p) => p.data.titulo);

    const existingLinks = new Set<string>();
    const existingTitulos = new Set<string>();

    if (links.length > 0) {
      const { data } = await supabase.from("imoveis").select("link_anuncio").in("link_anuncio", links);
      data?.forEach((d: any) => d.link_anuncio && existingLinks.add(d.link_anuncio));
    }
    if (titulos.length > 0) {
      const { data } = await supabase.from("imoveis").select("titulo,bairro").in("titulo", titulos);
      data?.forEach((d: any) => existingTitulos.add(`${d.titulo}|${d.bairro || ""}`.toLowerCase()));
    }

    parsed = parsed.map((p) => {
      if (p.status !== "valid") return p;
      if (p.data.link_anuncio && existingLinks.has(p.data.link_anuncio)) {
        return { ...p, status: "duplicate", errors: ["link já existe no banco"] };
      }
      const tkey = `${p.data.titulo}|${p.data.bairro || ""}`.toLowerCase();
      if (existingTitulos.has(tkey)) {
        return { ...p, status: "duplicate", errors: ["título+bairro já existe no banco"] };
      }
      return p;
    });

    setRows(parsed);
    setImportResult(null);
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setRows([]);
    setImportResult(null);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => processRows(res.data as Record<string, any>[]),
        error: (err) => toast({ title: "Erro lendo CSV", description: err.message, variant: "destructive" }),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        processRows(json as Record<string, any>[]);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({ title: "Formato não suportado", description: "Use CSV ou XLSX", variant: "destructive" });
    }
  };

  const handleImport = async () => {
    const valid = rows.filter((r) => r.status === "valid");
    if (valid.length === 0) {
      toast({ title: "Nenhuma linha válida para importar" });
      return;
    }
    setImporting(true);

    let inserted = 0;
    let failed = 0;
    const batchSize = 50;
    for (let i = 0; i < valid.length; i += batchSize) {
      const batch = valid.slice(i, i + batchSize).map((r) => r.data);
      const { error, data } = await supabase.from("imoveis").insert(batch).select("id");
      if (error) {
        failed += batch.length;
        console.error("Batch insert error:", error);
      } else {
        inserted += data?.length ?? 0;
      }
    }

    const skipped = rows.filter((r) => r.status === "duplicate").length;
    setImportResult({ inserted, skipped, failed: failed + rows.filter((r) => r.status === "error").length });
    setImporting(false);
    toast({
      title: `Importação concluída: ${inserted} inserido(s)`,
      description: `${skipped} duplicado(s) ignorado(s) · ${failed} falha(s)`,
    });
  };

  const counts = {
    valid: rows.filter((r) => r.status === "valid").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
    error: rows.filter((r) => r.status === "error").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="container flex items-center gap-4 py-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Importar Imóveis em Lote</h1>
            <p className="text-sm text-muted-foreground">CSV ou planilha (.xlsx) com validação e deduplicação automáticas</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Baixar template
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <Card className="p-8 border-dashed border-2 text-center">
          <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold mb-1">
            {fileName ? fileName : "Selecione um arquivo CSV ou XLSX"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Cabeçalhos obrigatórios: <code>titulo, finalidade, tipo</code>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Escolher arquivo
          </Button>
        </Card>

        {rows.length > 0 && (
          <>
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {counts.valid} válido(s)
                </Badge>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {counts.duplicate} duplicado(s)
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                  <XCircle className="h-3 w-3 mr-1" />
                  {counts.error} com erro
                </Badge>
                <div className="ml-auto">
                  <Button onClick={handleImport} disabled={importing || counts.valid === 0}>
                    {importing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Importar {counts.valid} imóvel(eis)
                  </Button>
                </div>
              </div>
              {importResult && (
                <div className="mt-3 text-sm text-muted-foreground">
                  ✅ {importResult.inserted} inserido(s) · ⚠️ {importResult.skipped} duplicado(s) ignorado(s) · ❌ {importResult.failed} falha(s)
                </div>
              )}
            </Card>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 w-12">Linha</th>
                      <th className="text-left p-2 w-28">Status</th>
                      <th className="text-left p-2">Título</th>
                      <th className="text-left p-2">Bairro</th>
                      <th className="text-left p-2">Finalidade</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Preço</th>
                      <th className="text-left p-2">Mensagens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.index} className="border-t border-border hover:bg-muted/20">
                        <td className="p-2 text-muted-foreground">{r.index}</td>
                        <td className="p-2">
                          {r.status === "valid" && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                              válido
                            </Badge>
                          )}
                          {r.status === "duplicate" && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">
                              duplicado
                            </Badge>
                          )}
                          {r.status === "error" && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                              erro
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 max-w-xs truncate">{r.data.titulo}</td>
                        <td className="p-2">{r.data.bairro || "—"}</td>
                        <td className="p-2">{r.data.finalidade}</td>
                        <td className="p-2">{r.data.tipo}</td>
                        <td className="p-2">
                          {r.data.preco
                            ? `R$ ${r.data.preco.toLocaleString("pt-BR")}`
                            : r.data.preco_temporada_diaria
                            ? `R$ ${r.data.preco_temporada_diaria}/dia`
                            : "—"}
                        </td>
                        <td className="p-2 text-xs">
                          {r.errors.length > 0 && (
                            <div className="text-red-700">{r.errors.join("; ")}</div>
                          )}
                          {r.warnings.length > 0 && (
                            <div className="text-amber-700">{r.warnings.join("; ")}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
