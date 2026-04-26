import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Link2, FileText, Check, Loader2, ArrowRight, BedDouble, Bath, Car, Ruler, Phone } from "lucide-react";
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

const Anunciar = () => {
  const [mode, setMode] = useState<Mode>("link");
  const [step, setStep] = useState<Step>("input");
  const [linkInput, setLinkInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [data, setData] = useState<ExtractedData>({});
  const [submitting, setSubmitting] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const { toast } = useToast();

  const handleExtract = async () => {
    if (mode === "link" && !linkInput.trim()) {
      toast({ title: "Cole o link do anúncio", variant: "destructive" });
      return;
    }
    if (mode === "text" && textInput.trim().length < 30) {
      toast({ title: "Descreva o imóvel com mais detalhes (mín. 30 caracteres)", variant: "destructive" });
      return;
    }

    setStep("extracting");

    try {
      const { data: result, error } = await supabase.functions.invoke("extract-property-from-link", {
        body: mode === "link" ? { url: linkInput.trim() } : { text: textInput.trim() },
      });

      if (error) throw error;
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Não consegui extrair os dados");
      }

      setData(result.data);
      setStep("review");
      toast({ title: "Dados extraídos com IA! ✨", description: "Revise e ajuste o que precisar." });
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Erro ao processar";
      toast({ title: "Não rolou dessa vez", description: msg, variant: "destructive" });
      setStep("input");
    }
  };

  const updateField = <K extends keyof ExtractedData>(key: K, value: ExtractedData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      toast({ title: "Nome e WhatsApp são obrigatórios", variant: "destructive" });
      return;
    }
    if (!data.titulo || !data.finalidade || !data.tipo) {
      toast({ title: "Título, finalidade e tipo são obrigatórios", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("imoveis_submissions").insert({
      titulo: data.titulo,
      descricao: data.descricao || null,
      finalidade: data.finalidade,
      tipo: data.tipo as never,
      bairro: data.bairro || null,
      endereco: data.endereco || null,
      quartos: data.quartos ?? 0,
      suites: data.suites ?? 0,
      banheiros: data.banheiros ?? 0,
      vagas_garagem: data.vagas_garagem ?? 0,
      area_m2: data.area_m2 || null,
      capacidade_pessoas: data.capacidade_pessoas || null,
      preco: data.preco || null,
      preco_temporada_diaria: data.preco_temporada_diaria || null,
      mobiliado: data.mobiliado ?? false,
      piscina: data.piscina ?? false,
      vista_mar: data.vista_mar ?? false,
      frente_mar: data.frente_mar ?? false,
      churrasqueira: data.churrasqueira ?? false,
      ar_condicionado: data.ar_condicionado ?? false,
      aceita_pet: data.aceita_pet ?? false,
      wifi: data.wifi ?? false,
      estacionamento: data.estacionamento ?? false,
      link_anuncio: data.link_anuncio || null,
      fotos: data.fotos && data.fotos.length > 0 ? data.fotos : null,
      anunciante_nome: contactName.trim(),
      anunciante_telefone: contactPhone.trim(),
      anunciante_email: contactEmail.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      console.error("Submission error:", error);
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
      return;
    }

    setStep("done");
  };

  const reset = () => {
    setStep("input");
    setLinkInput("");
    setTextInput("");
    setData({});
    setContactName("");
    setContactPhone("");
    setContactEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="text-sm font-bold">
            <span className="text-gradient">Mar</span>
            <span className="text-foreground">IA</span>
          </div>
        </div>
      </header>

      <main className="container py-10 md:py-16 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Cadastro com IA
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Anuncie sua casa de praia em <span className="text-gradient">Bombinhas</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Cole o link de um anúncio existente e a IA preenche tudo pra você. Grátis. ✨
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["input", "extracting", "review", "done"] as Step[]).map((s, i) => {
            const stepIdx = ["input", "extracting", "review", "done"].indexOf(step);
            const active = i <= stepIdx;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full transition-colors ${active ? "bg-primary" : "bg-muted"}`} />
                {i < 3 && <div className={`h-px w-6 transition-colors ${i < stepIdx ? "bg-primary" : "bg-muted"}`} />}
              </div>
            );
          })}
        </div>

        {step === "input" && (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setMode("link")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition ${
                  mode === "link" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                <Link2 className="h-4 w-4" /> Tenho um link
              </button>
              <button
                onClick={() => setMode("text")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition ${
                  mode === "text" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                <FileText className="h-4 w-4" /> Vou descrever
              </button>
            </div>

            {mode === "link" ? (
              <div className="space-y-2">
                <Label htmlFor="link">Link do anúncio</Label>
                <Input
                  id="link"
                  placeholder="https://airbnb.com/... ou OLX, ZAP, Instagram..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Funciona com Airbnb, OLX, ZAP, VivaReal, Instagram e a maioria dos sites.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="text">Descreva o imóvel</Label>
                <Textarea
                  id="text"
                  rows={6}
                  placeholder="Casa de 3 quartos em Mariscal, frente-mar, piscina, churrasqueira, capacidade pra 8 pessoas. Diária R$ 800 na temporada..."
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

            <p className="text-xs text-center text-muted-foreground">
              É grátis. Sua submissão é revisada antes de aparecer no site.
            </p>
          </div>
        )}

        {step === "extracting" && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <div>
              <h2 className="text-lg font-bold mb-1">A IA está lendo o anúncio...</h2>
              <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos. ✨</p>
            </div>
          </div>
        )}

        {step === "review" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Pronto! A IA preencheu tudo que conseguiu.</p>
                <p className="text-muted-foreground">Revise, ajuste o que estiver errado e adicione seu contato.</p>
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
                    <Label>Diária na temporada (R$)</Label>
                    <Input type="number" min={0} value={data.preco_temporada_diaria ?? ""} onChange={(e) => updateField("preco_temporada_diaria", e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                ) : (
                  <div className="space-y-1.5 col-span-2">
                    <Label>Preço (R$)</Label>
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

            {/* Contato */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-bold text-foreground">Seu contato</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome / Empresa *</Label>
                  <Input id="nome" required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="João Silva" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">WhatsApp *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(47) 99999-0000" className="pl-9" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input id="email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={reset} className="flex-1">
                Recomeçar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {submitting ? "Enviando..." : "Enviar para revisão"}
              </Button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Check className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Imóvel enviado! 🎉</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Nossa equipe revisa em até 24h e seu anúncio entra no ar. Te avisamos no WhatsApp quando publicar.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button variant="outline" onClick={reset}>Cadastrar outro imóvel</Button>
              <Button asChild className="gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
                <Link to="/">Voltar ao site<ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        )}

        {/* How it works (only on input step) */}
        {step === "input" && (
          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            {[
              { n: 1, t: "Cole o link", d: "Do Airbnb, OLX, ZAP ou onde já estiver anunciado" },
              { n: 2, t: "IA preenche", d: "A MarIA lê tudo e estrutura os dados pra você" },
              { n: 3, t: "Revisa e envia", d: "Conferimos e publicamos em até 24h" },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-card p-5">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mb-3">
                  {s.n}
                </div>
                <h3 className="font-semibold text-sm mb-1">{s.t}</h3>
                <p className="text-xs text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Anunciar;
