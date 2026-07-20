import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, Link2, FileText, Loader2, ArrowRight,
  BedDouble, Bath, Car, Ruler, CheckCircle2, X, ArrowUp, ArrowDown, Plus, Star, Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type Mode = "link" | "text";
type Step = "input" | "extracting" | "review" | "done";

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
  condominio?: number;
  iptu_anual?: number;
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
  anunciante_nome?: string;
  anunciante_telefone?: string;
  anunciante_email?: string;
  imobiliaria?: string;
  codigo?: string;
  photos_confidence?: "high" | "low";
  photos_warning?: string | null;
  photos_groups?: {
    likely: string[];
    doubtful: string[];
    rejected: Array<{ url: string; reason: string; source?: string }>;
  };
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
  const [submitting, setSubmitting] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [showRejected, setShowRejected] = useState(false);
  const [doubtfulSelected, setDoubtfulSelected] = useState<Record<string, boolean>>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);

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
      setDoubtfulSelected({});
      setShowRejected(false);
      setStep("review");
      const groups = result.data.photos_groups;
      const likely = groups?.likely?.length ?? result.data.fotos?.length ?? 0;
      const doubtful = groups?.doubtful?.length ?? 0;
      const rejected = groups?.rejected?.length ?? 0;
      const conf =
        result.data.photos_confidence === "high"
          ? "galeria principal identificada"
          : "baixa confiança — selecione manualmente as fotos corretas";
      toast({
        title: "Extraído com IA ✨",
        description: `Prováveis: ${likely} · Duvidosas: ${doubtful} · Rejeitadas: ${rejected} — ${conf}.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      toast({ title: "Falhou", description: msg, variant: "destructive" });
      setStep("input");
    }
  };

  const updateField = <K extends keyof ExtractedData>(key: K, value: ExtractedData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  // ===== Photo management =====
  const removePhoto = (idx: number) => {
    setData((prev) => ({ ...prev, fotos: (prev.fotos || []).filter((_, i) => i !== idx) }));
  };
  const movePhoto = (idx: number, dir: -1 | 1) => {
    setData((prev) => {
      const fotos = [...(prev.fotos || [])];
      const target = idx + dir;
      if (target < 0 || target >= fotos.length) return prev;
      [fotos[idx], fotos[target]] = [fotos[target], fotos[idx]];
      return { ...prev, fotos };
    });
  };
  const setAsCover = (idx: number) => {
    setData((prev) => {
      const fotos = [...(prev.fotos || [])];
      if (idx === 0) return prev;
      const [pic] = fotos.splice(idx, 1);
      fotos.unshift(pic);
      return { ...prev, fotos };
    });
  };
  const addPhotoUrl = () => {
    const raw = newPhotoUrl.trim();
    if (!raw) return;
    // Allow comma/newline separated batch paste
    const urls = raw.split(/[\s,]+/).map((u) => u.trim()).filter((u) => {
      try { new URL(u); return true; } catch { return false; }
    });
    if (urls.length === 0) {
      toast({ title: "URL(s) inválida(s)", variant: "destructive" });
      return;
    }
    setData((prev) => {
      const existing = new Set(prev.fotos || []);
      const merged = [...(prev.fotos || [])];
      for (const u of urls) if (!existing.has(u)) merged.push(u);
      return { ...prev, fotos: merged };
    });
    setNewPhotoUrl("");
    toast({ title: `${urls.length} foto(s) adicionada(s)` });
  };

  const addPhotosToGallery = (urls: string[]) => {
    if (urls.length === 0) return;
    setData((prev) => {
      const existing = new Set(prev.fotos || []);
      const merged = [...(prev.fotos || [])];
      for (const u of urls) if (!existing.has(u)) merged.push(u);
      return { ...prev, fotos: merged };
    });
  };
  const clearAllPhotos = () => setData((prev) => ({ ...prev, fotos: [] }));

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFiles(true);
    const uploadedUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `import-tmp/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("imoveis").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("imoveis").getPublicUrl(path);
        uploadedUrls.push(pub.publicUrl);
      }
      if (uploadedUrls.length > 0) {
        addPhotosToGallery(uploadedUrls);
        toast({ title: `${uploadedUrls.length} foto(s) enviada(s) do computador` });
      } else {
        toast({ title: "Nenhuma imagem válida selecionada", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploadingFiles(false);
      e.target.value = "";
    }
  };
  const toggleDoubtful = (url: string) =>
    setDoubtfulSelected((prev) => ({ ...prev, [url]: !prev[url] }));
  const addSelectedDoubtful = () => {
    const urls = Object.entries(doubtfulSelected).filter(([, v]) => v).map(([u]) => u);
    addPhotosToGallery(urls);
    setDoubtfulSelected({});
    toast({ title: `${urls.length} foto(s) movida(s) para a galeria` });
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
      codigo: data.codigo?.trim() || null,
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
      condominio: data.condominio || null,
      iptu_anual: data.iptu_anual || null,
      link_anuncio: data.link_anuncio || null,
      fotos: data.fotos && data.fotos.length > 0 ? data.fotos : null,
      anunciante_nome: data.anunciante_nome?.trim() || null,
      anunciante_telefone: data.anunciante_telefone?.trim() || null,
      anunciante_email: data.anunciante_email?.trim() || null,
      imobiliaria: data.imobiliaria?.trim() || null,
      origem: inferOrigem(data.link_anuncio) as never,
      // Rascunho: fora da vitrine E oculto da MarIA até revisão manual (mesma regra do lote).
      status: "pausado" as never,
      oculta_para_maria: true,

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
    setNewPhotoUrl("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="container flex items-center gap-4 py-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Importar por Link (IA)</h1>
            <p className="text-sm text-muted-foreground">Cole um link ou descreva — a IA extrai e você revisa antes de salvar</p>
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
                  placeholder="https://airbnb.com/... ou OLX, ZAP, VivaReal, Booking, Instagram..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Funciona com a maioria dos sites. Páginas que carregam só por JS podem não vir 100% — nesse caso use "Colar descrição".
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="text">Descrição do imóvel</Label>
                <Textarea
                  id="text"
                  rows={8}
                  placeholder="Cole aqui o texto completo do anúncio (do Airbnb, OLX, WhatsApp, etc). Quanto mais detalhes, melhor a extração."
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
            <p className="text-sm text-muted-foreground">Isso pode levar até 30 segundos para sites mais pesados.</p>
          </div>
        )}

        {step === "review" && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Revise antes de salvar no inventário</p>
                <p className="text-muted-foreground">Vai entrar como <strong>rascunho pausado</strong> e <strong>oculto da MarIA</strong> até você revisar e ativar em "Meus Imóveis".</p>
              </div>
            </div>

            {data.photos_warning && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
                <X className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 rotate-45" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-700 dark:text-amber-300">Atenção às fotos</p>
                  <p className="text-amber-700/80 dark:text-amber-200/80">{data.photos_warning}</p>
                </div>
              </div>
            )}

            {/* ===== TRIAGEM DE FOTOS (3 grupos) ===== */}
            {(data.photos_groups?.likely?.length || data.photos_groups?.doubtful?.length || data.photos_groups?.rejected?.length) ? (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-semibold text-sm">Triagem das fotos extraídas</h3>
                    <p className="text-xs text-muted-foreground">
                      Confiança da galeria: <strong>{data.photos_confidence === "high" ? "alta" : "baixa"}</strong>
                      {" · "}Prováveis {data.photos_groups?.likely?.length ?? 0}
                      {" · "}Duvidosas {data.photos_groups?.doubtful?.length ?? 0}
                      {" · "}Rejeitadas {data.photos_groups?.rejected?.length ?? 0}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(data.photos_groups?.likely?.length || 0) > 0 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => addPhotosToGallery(data.photos_groups!.likely)}>
                        + Adicionar prováveis
                      </Button>
                    )}
                    {(data.fotos?.length || 0) > 0 && (
                      <Button type="button" variant="outline" size="sm" onClick={clearAllPhotos}>
                        Limpar galeria
                      </Button>
                    )}
                  </div>
                </div>

                {/* Prováveis */}
                {(data.photos_groups?.likely?.length || 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      ✓ Fotos prováveis do imóvel ({data.photos_groups!.likely.length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {data.photos_groups!.likely.map((u) => {
                        const inGallery = data.fotos?.includes(u);
                        return (
                          <button
                            type="button"
                            key={u}
                            onClick={() => inGallery ? setData((p) => ({ ...p, fotos: (p.fotos || []).filter((x) => x !== u) })) : addPhotosToGallery([u])}
                            className={`relative aspect-square rounded-md overflow-hidden border-2 transition ${
                              inGallery ? "border-emerald-500" : "border-border opacity-60 hover:opacity-100"
                            }`}
                            title={inGallery ? "Remover da galeria" : "Adicionar à galeria"}
                          >
                            <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                            {inGallery && (
                              <div className="absolute top-0.5 right-0.5 bg-emerald-500 text-white rounded-full p-0.5">
                                <CheckCircle2 className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Duvidosas */}
                {(data.photos_groups?.doubtful?.length || 0) > 0 && (
                  <div className="space-y-2 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        ? Fotos duvidosas ({data.photos_groups!.doubtful.length}) — desmarcadas por padrão
                      </p>
                      {Object.values(doubtfulSelected).some(Boolean) && (
                        <Button type="button" size="sm" variant="outline" onClick={addSelectedDoubtful}>
                          Mover selecionadas para galeria
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {data.photos_groups!.doubtful.map((u) => {
                        const sel = !!doubtfulSelected[u];
                        return (
                          <button
                            type="button"
                            key={u}
                            onClick={() => toggleDoubtful(u)}
                            className={`relative aspect-square rounded-md overflow-hidden border-2 transition ${
                              sel ? "border-amber-500" : "border-border opacity-50 hover:opacity-100"
                            }`}
                          >
                            <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                            {sel && (
                              <div className="absolute top-0.5 right-0.5 bg-amber-500 text-white rounded-full p-0.5">
                                <CheckCircle2 className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rejeitadas (colapsável) */}
                {(data.photos_groups?.rejected?.length || 0) > 0 && (
                  <div className="pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowRejected((v) => !v)}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      {showRejected ? "▼" : "▶"} Fotos rejeitadas ({data.photos_groups!.rejected.length}) — apenas auditoria
                    </button>
                    {showRejected && (
                      <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {data.photos_groups!.rejected.map((r) => (
                          <div key={r.url} className="space-y-1">
                            <div className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted opacity-50">
                              <img src={r.url} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate" title={`${r.reason} · ${r.source || ""}`}>
                              {r.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Fotos {data.fotos && data.fotos.length > 0 && `(${data.fotos.length})`}
                </Label>
                {data.fotos && data.fotos.length > 0 && (
                  <span className="text-xs text-muted-foreground">A primeira é a capa ⭐</span>
                )}
              </div>

              {data.fotos && data.fotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {data.fotos.map((f, i) => (
                    <div key={`${f}-${i}`} className="relative group rounded-lg overflow-hidden border border-border bg-muted">
                      <img
                        src={f}
                        alt={`Foto ${i + 1}`}
                        className="aspect-square w-full object-cover transition-opacity duration-300"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => { 
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=400&fit=crop&q=60";
                          target.style.opacity = "0.5";
                        }}
                      />
                      {i === 0 && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Star className="h-2.5 w-2.5 fill-current" /> Capa
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end justify-center gap-1 p-2 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          title="Mover esquerda"
                          onClick={() => movePhoto(i, -1)}
                          disabled={i === 0}
                          className="h-7 w-7 rounded bg-card/90 hover:bg-card text-foreground disabled:opacity-30 flex items-center justify-center"
                        >
                          <ArrowUp className="h-3.5 w-3.5 -rotate-90" />
                        </button>
                        <button
                          type="button"
                          title="Mover direita"
                          onClick={() => movePhoto(i, 1)}
                          disabled={i === (data.fotos?.length || 0) - 1}
                          className="h-7 w-7 rounded bg-card/90 hover:bg-card text-foreground disabled:opacity-30 flex items-center justify-center"
                        >
                          <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                        </button>
                        {i !== 0 && (
                          <button
                            type="button"
                            title="Definir como capa"
                            onClick={() => setAsCover(i)}
                            className="h-7 w-7 rounded bg-card/90 hover:bg-card text-foreground flex items-center justify-center"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Excluir"
                          onClick={() => removePhoto(i)}
                          className="h-7 w-7 rounded bg-destructive/90 hover:bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhuma foto detectada. Adicione abaixo coando URLs.</p>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Cole URL(s) de fotos (separe por vírgula ou espaço)"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addPhotoUrl(); }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addPhotoUrl} className="gap-1 flex-shrink-0">
                    <Plus className="h-4 w-4" /> Adicionar
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="upload-fotos-computador"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUploadFiles}
                    disabled={uploadingFiles}
                  />
                  <Label
                    htmlFor="upload-fotos-computador"
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-accent cursor-pointer text-sm ${uploadingFiles ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {uploadingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingFiles ? "Enviando..." : "Subir fotos do computador"}
                  </Label>
                  <span className="text-xs text-muted-foreground">JPG, PNG ou WebP — múltiplas permitidas</span>
                </div>
              </div>
            </div>

            {/* ===== DADOS PRINCIPAIS ===== */}
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" value={data.bairro || ""} onChange={(e) => updateField("bairro", e.target.value)} placeholder="Bombas, Mariscal, Centro..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" value={data.endereco || ""} onChange={(e) => updateField("endereco", e.target.value)} placeholder="Rua / nº" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" rows={4} value={data.descricao || ""} onChange={(e) => updateField("descricao", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-xs"><BedDouble className="h-3 w-3" />Quartos</Label>
                  <Input type="number" min={0} value={data.quartos ?? ""} onChange={(e) => updateField("quartos", e.target.value ? parseInt(e.target.value) : undefined)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Suítes</Label>
                  <Input type="number" min={0} value={data.suites ?? ""} onChange={(e) => updateField("suites", e.target.value ? parseInt(e.target.value) : undefined)} />
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
                  <Label className="flex items-center gap-1 text-xs"><Ruler className="h-3 w-3" />Área m²</Label>
                  <Input type="number" min={0} value={data.area_m2 ?? ""} onChange={(e) => updateField("area_m2", e.target.value ? parseFloat(e.target.value) : undefined)} />
                </div>
              </div>

              {data.finalidade === "temporada" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Capacidade (pessoas)</Label>
                  <Input type="number" min={0} value={data.capacidade_pessoas ?? ""} onChange={(e) => updateField("capacidade_pessoas", e.target.value ? parseInt(e.target.value) : undefined)} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.finalidade === "temporada" ? (
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label>Diária na temporada (R$) *</Label>
                    <Input type="number" min={0} value={data.preco_temporada_diaria ?? ""} onChange={(e) => updateField("preco_temporada_diaria", e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label>Preço (R$) *</Label>
                      <Input type="number" min={0} value={data.preco ?? ""} onChange={(e) => updateField("preco", e.target.value ? parseFloat(e.target.value) : undefined)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Condomínio (R$/mês)</Label>
                      <Input type="number" min={0} value={data.condominio ?? ""} onChange={(e) => updateField("condominio", e.target.value ? parseFloat(e.target.value) : undefined)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>IPTU anual (R$)</Label>
                      <Input type="number" min={0} value={data.iptu_anual ?? ""} onChange={(e) => updateField("iptu_anual", e.target.value ? parseFloat(e.target.value) : undefined)} />
                    </div>
                  </>
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
            </div>

            {/* ===== CONTATO ===== */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold text-sm">Contato do anunciante</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={data.anunciante_nome || ""} onChange={(e) => updateField("anunciante_nome", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tel">WhatsApp</Label>
                  <Input id="tel" value={data.anunciante_telefone || ""} onChange={(e) => updateField("anunciante_telefone", e.target.value)} placeholder="47999999999" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={data.anunciante_email || ""} onChange={(e) => updateField("anunciante_email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="imob">Imobiliária</Label>
                  <Input id="imob" value={data.imobiliaria || ""} onChange={(e) => updateField("imobiliaria", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="codigo">Código/Ref.</Label>
                  <Input id="codigo" value={data.codigo || ""} onChange={(e) => updateField("codigo", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="link_anuncio">Link do anúncio</Label>
                  <Input id="link_anuncio" value={data.link_anuncio || ""} onChange={(e) => updateField("link_anuncio", e.target.value)} />
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
              <Button onClick={() => navigate("/admin")}>Voltar ao admin</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
