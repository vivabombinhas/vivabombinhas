import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, BedDouble, Bath, Car, Ruler, ExternalLink, Flame, Edit, Trash2 } from "lucide-react";

interface Submission {
  id: string;
  status_submission: "pendente" | "aprovado" | "rejeitado";
  titulo: string;
  descricao: string | null;
  finalidade: string;
  tipo: string;
  cidade: string | null;
  bairro: string | null;
  endereco: string | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas_garagem: number | null;
  area_m2: number | null;
  capacidade_pessoas: number | null;
  mobiliado: boolean | null;
  piscina: boolean | null;
  vista_mar: boolean | null;
  frente_mar: boolean | null;
  churrasqueira: boolean | null;
  ar_condicionado: boolean | null;
  aceita_pet: boolean | null;
  wifi: boolean | null;
  estacionamento: boolean | null;
  preco: number | null;
  preco_temporada_diaria: number | null;
  fotos: string[] | null;
  link_anuncio: string | null;
  anunciante_nome: string | null;
  anunciante_telefone: string | null;
  anunciante_email: string | null;
  imobiliaria: string | null;
  imovel_id: string | null;
  observacoes: string | null;
  created_at: string;
  gestao_propria?: boolean;
  destaque?: boolean;
}

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  aprovado: "bg-green-100 text-green-800 border-green-300",
  rejeitado: "bg-red-100 text-red-800 border-red-300",
};

const finalidadeLabels: Record<string, string> = {
  compra: "Compra",
  aluguel_anual: "Aluguel Anual",
  temporada: "Temporada",
};

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [gestaoPropriaMap, setGestaoPropriaMap] = useState<Record<string, boolean>>({});
  const [destaqueMap, setDestaqueMap] = useState<Record<string, boolean>>({});
  const [editSubmission, setEditSubmission] = useState<Submission | null>(null);
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("imoveis_submissions" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar submissões", variant: "destructive" });
    } else {
      const subData = (data as any) || [];
      setSubmissions(subData);
      
      // Auto-detect highlights from observations
      const newDestaqueMap: Record<string, boolean> = {};
      subData.forEach((sub: Submission) => {
        if (sub.observacoes?.includes("[DESTAQUE-PAGO-SIMULADO]")) {
          newDestaqueMap[sub.id] = true;
        }
      });
      setDestaqueMap(newDestaqueMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleApprove = async (sub: Submission) => {
    if (sub.imovel_id) {
      toast({ title: "Este imóvel já foi aprovado anteriormente", variant: "destructive" });
      return;
    }

    setActionLoading(sub.id);
    const gestao_propria = !!gestaoPropriaMap[sub.id];
    const destaque = !!destaqueMap[sub.id];

    // Se tiver a marca de destaque, define a validade (30 dias)
    const destaque_ate = destaque ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

    // Insert into imoveis
    const { data: inserted, error: insertError } = await supabase.from("imoveis").insert({
      titulo: sub.titulo,
      descricao: sub.descricao,
      finalidade: sub.finalidade as any,
      tipo: sub.tipo as any,
      bairro: sub.bairro,
      cidade: sub.cidade || "Bombinhas",
      endereco: sub.endereco,
      quartos: sub.quartos || 0,
      suites: sub.suites || 0,
      banheiros: sub.banheiros || 0,
      vagas_garagem: sub.vagas_garagem || 0,
      area_m2: sub.area_m2,
      capacidade_pessoas: sub.capacidade_pessoas || 0,
      mobiliado: sub.mobiliado,
      piscina: sub.piscina,
      vista_mar: sub.vista_mar,
      frente_mar: sub.frente_mar,
      churrasqueira: sub.churrasqueira,
      ar_condicionado: sub.ar_condicionado,
      aceita_pet: sub.aceita_pet,
      wifi: sub.wifi,
      estacionamento: sub.estacionamento,
      preco: sub.preco,
      preco_temporada_diaria: sub.preco_temporada_diaria,
      link_anuncio: sub.link_anuncio,
      fotos: (sub as any).fotos,
      anunciante_nome: sub.anunciante_nome,
      anunciante_telefone: sub.anunciante_telefone,
      anunciante_email: sub.anunciante_email,
      imobiliaria: (sub as any).imobiliaria,
      origem: "manual" as any,
      status: "ativo" as any,
      gestao_propria,
      destaque,
      destaque_pago: destaque,
      destaque_ate,
      destaque_valor: destaque ? 49 : null,
    } as any).select("id").single();

    if (insertError) {
      toast({ title: "Erro ao aprovar", description: insertError.message, variant: "destructive" });
      setActionLoading(null);
      return;
    }

    // Se for destaque pago, registra na receita
    if (destaque) {
      // Tenta encontrar um lead relacionado pelo telefone ou cria um novo registro
      const { data: lead } = await supabase
        .from("leads_maria")
        .select("id")
        .eq("telefone", sub.anunciante_telefone || "")
        .maybeSingle();

      if (lead) {
        await supabase.from("lead_revenue").insert({
          lead_id: lead.id,
          imovel_id: inserted.id,
          tipo_negocio: "destaque" as any,
          parceiro_nome: sub.anunciante_nome,
          parceiro_telefone: sub.anunciante_telefone,
          valor_negocio: 49,
          valor_previsto: 49,
          valor_pago: 49,
          status: "pago" as any,
          data_pagamento: new Date().toISOString(),
          observacoes: `Destaque premium para o imóvel: ${sub.titulo}`,
        });
      }
    }

    // Update submission status
    await supabase
      .from("imoveis_submissions" as any)
      .update({
        status_submission: "aprovado",
        imovel_id: inserted.id,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq("id", sub.id);

    toast({ title: "Imóvel aprovado e publicado! ✅" });
    setActionLoading(null);
    fetchSubmissions();
  };

  const handleReject = async (sub: Submission) => {
    setActionLoading(sub.id);

    await supabase
      .from("imoveis_submissions" as any)
      .update({
        status_submission: "rejeitado",
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq("id", sub.id);

    toast({ title: "Submissão rejeitada" });
    setActionLoading(null);
    fetchSubmissions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente esta submissão?")) return;
    setActionLoading(id);
    const { error } = await supabase.from("imoveis_submissions").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Submissão excluída permanentemente" });
      fetchSubmissions();
    }
    setActionLoading(null);
  };

  const handleUpdate = async (id: string, updates: Partial<Submission>) => {
    const { error } = await supabase.from("imoveis_submissions").update(updates as any).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados atualizados" });
      fetchSubmissions();
      setEditSubmission(null);
    }
  };

  const pendentes = submissions.filter((s) => s.status_submission === "pendente");
  const reviewed = submissions.filter((s) => s.status_submission !== "pendente");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="container flex items-center gap-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Submissões de Imóveis</h1>
            <p className="text-sm text-muted-foreground">
              {pendentes.length} pendente{pendentes.length !== 1 ? "s" : ""} · {reviewed.length} revisada{reviewed.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Nenhuma submissão recebida ainda.</p>
        ) : (
          <>
            {pendentes.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-foreground">Pendentes</h2>
                <div className="grid gap-4">
                  {pendentes.map((sub) => (
                    <SubmissionCard
                      key={sub.id}
                      sub={sub}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      actionLoading={actionLoading}
                      gestaoPropria={!!gestaoPropriaMap[sub.id]}
                      onToggleGestao={(v) => setGestaoPropriaMap((m) => ({ ...m, [sub.id]: v }))}
                      destaque={!!destaqueMap[sub.id]}
                      onToggleDestaque={(v) => setDestaqueMap((m) => ({ ...m, [sub.id]: v }))}
                    />
                  ))}
                </div>
              </section>
            )}

            {reviewed.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Revisadas</h2>
                <div className="grid gap-4">
                  {reviewed.map((sub) => (
                    <SubmissionCard
                      key={sub.id}
                      sub={sub}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      actionLoading={actionLoading}
                      gestaoPropria={false}
                      onToggleGestao={() => {}}
                      destaque={false}
                      onToggleDestaque={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function SubmissionCard({
  sub,
  onApprove,
  onReject,
  actionLoading,
  gestaoPropria,
  onToggleGestao,
  destaque,
  onToggleDestaque,
}: {
  sub: Submission;
  onApprove: (s: Submission) => void;
  onReject: (s: Submission) => void;
  actionLoading: string | null;
  gestaoPropria: boolean;
  onToggleGestao: (v: boolean) => void;
  destaque: boolean;
  onToggleDestaque: (v: boolean) => void;
}) {
  const isPending = sub.status_submission === "pendente";
  const isLoading = actionLoading === sub.id;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-foreground">{sub.titulo}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Badge variant="outline">{finalidadeLabels[sub.finalidade] || sub.finalidade}</Badge>
            <span className="capitalize">{sub.tipo}</span>
            {sub.bairro && <span>· {sub.bairro}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sub.observacoes?.includes("[DESTAQUE-PAGO-SIMULADO]") && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 animate-pulse">
              <Flame className="h-3 w-3 mr-1 text-amber-600" /> DESTAQUE PAGO
            </Badge>
          )}
          <Badge className={`${statusColors[sub.status_submission]} border text-xs`}>
            {sub.status_submission}
          </Badge>
        </div>
      </div>

      {sub.descricao && (
        <p className="text-sm text-muted-foreground line-clamp-2">{sub.descricao}</p>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {(sub.quartos ?? 0) > 0 && (
          <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {sub.quartos}q</span>
        )}
        {(sub.banheiros ?? 0) > 0 && (
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {sub.banheiros}b</span>
        )}
        {(sub.vagas_garagem ?? 0) > 0 && (
          <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" /> {sub.vagas_garagem}v</span>
        )}
        {sub.area_m2 && (
          <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" /> {sub.area_m2}m²</span>
        )}
        {sub.preco && (
          <span className="font-semibold text-foreground">
            R$ {Number(sub.preco).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {sub.anunciante_nome && <span>👤 {sub.anunciante_nome}</span>}
        {sub.anunciante_telefone && <span>📱 {sub.anunciante_telefone}</span>}
        {sub.anunciante_email && <span>✉️ {sub.anunciante_email}</span>}
        {sub.link_anuncio && (
          <a href={sub.link_anuncio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
            <ExternalLink className="h-3 w-3" /> Link original
          </a>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Enviado em {new Date(sub.created_at).toLocaleDateString("pt-BR")} às{" "}
        {new Date(sub.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </div>

      {isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none p-2 rounded-md bg-primary/5 border border-primary/20">
            <input
              type="checkbox"
              checked={gestaoPropria}
              onChange={(e) => onToggleGestao(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="font-medium text-foreground">
              🏢 Gestão própria
            </span>
          </label>

          <label className={`flex items-center gap-2 text-sm cursor-pointer select-none p-2 rounded-md border ${
            destaque 
              ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400" 
              : "bg-muted/50 border-border text-muted-foreground"
          }`}>
            <input
              type="checkbox"
              checked={destaque}
              onChange={(e) => onToggleDestaque(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            <span className="font-medium flex items-center gap-1">
              <Flame className={`h-3.5 w-3.5 ${destaque ? "fill-amber-500" : ""}`} />
              Destaque Premium
            </span>
          </label>
          
          <div className="flex gap-2 sm:col-span-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => onApprove(sub)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => onReject(sub)}
              disabled={isLoading}
            >
              <XCircle className="h-3.5 w-3.5" />
              Rejeitar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}