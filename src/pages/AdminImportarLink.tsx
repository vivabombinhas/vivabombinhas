import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Link2, FileText, Loader2, ArrowRight, BedDouble, Bath, Car, Ruler, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Mode = "link" | "text";
type Step = "input" | "extracting" | "review" | "done";

interface ExtractedData {
  titulo?: string;
  descricao?: string;
  finalidade?: "temporada" | "aluguel_anual" | "compra";
  tipo?: string;
  bairro?: string;
  endereco?: string;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas_garagem?: number;
  area_m2?: number;
  capacidade_pessoas?: number;
  preco?: number;
  preco_temporada_diaria?: number;
  mobiliado?: boolean;
  piscina?: boolean;
  vista_mar?: boolean;
  frente_mar?: boolean;
  churrasqueira?: boolean;
  ar_condicionado?: boolean;
  aceita_pet?: boolean;
  wifi?: boolean;
  estacionamento?: boolean;
  link_anuncio?: string;
  fotos?: string[];
}

const tipoLabels: Record<string, string> = {
  apartamento: "Apartamento", casa: "Casa", cobertura: "Cobertura",
  terreno: "Terreno", sobrado: "Sobrado", studio: "Studio",
  pousada: "Pousada", sala_comercial: "Sala Comercial", outro: "Outro",
};
const finalidadeLabels: Record<string, string> = {
  temporada: "Temporada", aluguel_anual: "Aluguel Anual", compra: "Venda",
};

const FINALIDADES = ["temporada", "aluguel_anual", "compra"];
const TIPOS = Object.keys(tipoLabels);

export default function AdminImportarLink() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("link");
  const [step, setStep] = useState<Step>("input");
  const [linkInput, setLinkInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [data, setData] = useState<ExtractedData>({});
  const [anuncianteNome, setAnuncianteNome] = useState("");
  const [anuncianteTelefone, setAnuncianteTelefone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleExtract = async () => {
    if (mode === "link") {
      try { new URL(linkInput.trim()); } catch {
        toast({ title: "Link inválido", variant: "destructive" });
        return;
      }
    }
    if (mode === "text" && textInput.trim().length < 30) {
      toast({ title: "Descreva com mais detalhes (mín. 30 caracteres)", variant: "destructive" });
      return;
    }

    setStep("extracting");
    try {
      const { data: result, error } = await supabase.functions.invoke("extract-property-from-link", {
        body: mode === "link" ? { url: linkInput.trim() } : { text: textInput.trim() },
      });
      if (error) throw error;
      if (!result?.success || !result?.data) throw new Error(result?.error || "Falha ao extrair");

      // Dedup por link
      if (result.data.link_anuncio) {
        const { data: existing } = await supabase
          .from("imoveis")
          .select("id")
          .eq("link_anuncio", result.data.link_anuncio)
          .maybeSingle();
        if (existing) {
          toast({
            title: "Imóvel duplicado",
            description: "Este link já existe no inventário.",
            variant: "destructive",
          });
          setStep("input");
          return;
        }
      }

      setData(result.data);
      setStep("review");
      toast({ title: "Extraído com IA ✨", description: "Revise antes de salvar." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      toast({ title: "Falhou", description: msg, variant: "destructive" });
      setStep("input");
    }
  };

  const updateField = <K extends keyof ExtractedData>(key: K, value: ExtractedData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!data.titulo?.trim()) errors.push("título");
    if (!data.finalidade || !FINALIDADES.includes(data.finalidade)) errors.push("finalidade");
    if (!data.tipo || !TIPOS.includes(data.tipo)) errors.push("tipo");
    if (data.finalidade === "temporada" && !data.preco_temporada_diaria && !data.preco) {
      errors.push("preço (diária)");
    }
    if ((data.finalidade === "compra" || data.finalidade === "aluguel_anual") && !data.preco) {
      errors.push("preço");
    }
    if (errors.length) {
      toast({ title: "Campos obrigatórios", description: errors.join(", "), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("imoveis").insert({
      titulo: data.titulo!.trim(),
      descricao: data.descricao || null,
      finalidade: data.finalidade as never,
      tipo: data.tipo as never,
      cidade: "Bombinhas",
      bairro: data.bairro || null,
      endereco: data.endereco || null,
      quartos: data.quartos ?? 0,
      suites: data.suites ?? 0,
      banheiros: data.banheiros ?? 0,
      vagas_garagem: data.vagas_garagem ?? 0,
      area_m2: data.area_m2 || null,
      capacidade_pessoas: data.capacidade_pessoas || null,
      mobiliado: data.mobiliado ?? false,
      piscina: data.piscina ?? false,
      vista_mar: data.vista_mar ?? false,
      frente_mar: data.frente_mar ?? false,
      churrasqueira: data.churrasqueira ?? false,
      ar_condicionado: data.ar_condicionado ?? false,
      aceita_pet: data.aceita_pet ?? false,
      wifi: data.wifi ?? false,
      estacionamento: data.estacionamento ?? false,
      preco: data.preco || null,
      preco_temporada_diaria: data.preco_temporada_diaria || null,
      link_anuncio: data.link_anuncio || null,
      fotos: data.fotos && data.fotos.length > 0 ? data.fotos : null,
      anunciante_nome: anuncianteNome.trim() || null,
      anunciante_telefone: anuncianteTelefone.trim() || null,
      origem: "scraping" as never,
      status: "ativo" as never,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setStep("done");
    toast({ title: "Imóvel adicionado ao inventário ✅" });
  };

  const reset = () => {
    setStep("input");
    setLinkInput("");
    setTextInput("");
    setData({});
    setAnuncianteNome("");
    setAnuncianteTelefone("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/leads")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Importar por Link (IA)</h1>
            <p className="text-sm text-muted-foreground">Cole um link ou descreva — a IA extrai e salva no inventário</p>
          </div>
          <Link to="/admin/importar" className="text-sm text-muted-foreground hover:text-foreground">
            Importar CSV →
          </Link>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        {step === "input" && (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setMode("link")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition ${
                  mode === "link" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                <Link2 className="h-4 w-4" /> Link do anúncio
              </button>
              <button
                onClick={() => setMode("text")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition ${
                  mode === "text" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                <FileText className="h-4 w-4" /> Colar descrição
              </button>
            </div>

            {mode === "link" ? (
              <div className="space-y-2">
                <Label htmlFor="link">URL do anúncio</Label>
                <Input
                  id="link"
                  placeholder="https://airbnb.com/... ou OLX, ZAP, VivaReal, Instagram..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Funciona com Airbnb, OLX, ZAP, VivaReal e a maioria dos sites.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="text">Descrição do imóvel</Label>
                <Textarea
                  id="text"
                  rows={6}
                  placeholder="Casa de 3 quartos em Mariscal, frente-mar, piscina, capacidade 8 pessoas. Diária R$ 800..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={handleExtract}
              size="lg"
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
            >
              <Sparkles className="h-4 w-4" />
              Extrair com IA
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "extracting" && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <h2 className="text-lg font-bold">A IA está lendo o anúncio...</h2>
            <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
          </div>
        )}

        {step === "review" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Revise antes de salvar no inventário</p>
                <p className="text-muted-foreground">Vai entrar como <strong>ativo</strong> direto na vitrine.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input id="titulo" value={data.titulo || ""} onChange={(e) => updateField("titulo", e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Finalidade *</Label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(finalidadeLabels) as Array<keyof typeof finalidadeLabels>).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => updateField("finalidade", f as ExtractedData["finalidade"])}
                        className={`px-3 py-1.5 text-xs rounded-md border ${
                          data.finalidade === f ? "bg-primary text-primary-foreground border-primary" : "border-border"
                        }`}
                      >
                        {finalidadeLabels[f]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select
                    value={data.tipo || ""}
                    onChange={(e) => updateField("tipo", e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Selecione...</option>
                    {Object.entries(tipoLabels).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" value={data.bairro || ""} onChange={(e) => updateField("bairro", e.target.value)} placeholder="Bombas, Mariscal, Centro..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" rows={3} value={data.descricao || ""} onChange={(e) => updateField("descricao", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs"><BedDouble className="h-3 w-3" />Quartos</Label>
                  <Input type="number" min={0} value={data.quartos ?? ""} onChange={(e) => updateField("quartos", e.target.value ? parseInt(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs"><Bath className="h-3 w-3" />Banheiros</Label>
                  <Input type="number" min={0} value={data.banheiros ?? ""} onChange={(e) => updateField("banheiros", e.target.value ? parseInt(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs"><Car className="h-3 w-3" />Vagas</Label>
                  <Input type="number" min={0} value={data.vagas_garagem ?? ""} onChange={(e) => updateField("vagas_garagem", e.target.value ? parseInt(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs"><Ruler className="h-3 w-3" />Área (m²)</Label>
                  <Input type="number" min={0} value={data.area_m2 ?? ""} onChange={(e) => updateField("area_m2", e.target.value ? parseFloat(e.target.value) : undefined)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {data.finalidade === "temporada" ? (
                  <div className="space-y-1.5 col-span-2">
                    <Label>Diária na temporada (R$) *</Label>
                    <Input type="number" min={0} value={data.preco_temporada_diaria ?? ""} onChange={(e) => updateField("preco_temporada_diaria", e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                ) : (
                  <div className="space-y-1.5 col-span-2">
                    <Label>Preço (R$) *</Label>
                    <Input type="number" min={0} value={data.preco ?? ""} onChange={(e) => updateField("preco", e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Características</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    ["mobiliado", "Mobiliado"], ["piscina", "Piscina"], ["vista_mar", "Vista mar"],
                    ["frente_mar", "Frente mar"], ["churrasqueira", "Churrasqueira"], ["ar_condicionado", "Ar cond."],
                    ["aceita_pet", "Pet-friendly"], ["wifi", "Wi-Fi"], ["estacionamento", "Estacionamento"],
                  ] as Array<[keyof ExtractedData, string]>).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(data[key])}
                        onChange={(e) => updateField(key, e.target.checked as never)}
                        className="rounded border-border"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {data.fotos && data.fotos.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">{data.fotos.length} fotos detectadas</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {data.fotos.slice(0, 8).map((f, i) => (
                      <img key={i} src={f} alt={`Foto ${i + 1}`} className="aspect-square object-cover rounded-md" loading="lazy" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold text-sm">Contato do anunciante (opcional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={anuncianteNome} onChange={(e) => setAnuncianteNome(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tel">WhatsApp</Label>
                  <Input id="tel" value={anuncianteTelefone} onChange={(e) => setAnuncianteTelefone(e.target.value)} placeholder="47999999999" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={reset} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Salvar no inventário
              </Button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-5">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Imóvel adicionado ao inventário ✅</h2>
              <p className="text-sm text-muted-foreground">Já está visível na vitrine pública.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset} variant="outline">Importar outro</Button>
              <Button onClick={() => navigate("/admin/leads")}>Voltar ao admin</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
