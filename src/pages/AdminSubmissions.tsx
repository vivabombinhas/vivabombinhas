import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, BedDouble, Bath, Car, Ruler, ExternalLink } from "lucide-react";


interface Submission {
  id: string;
  status_submission: "pendente" | "aprovado" | "rejeitado";
  titulo: string;
  descricao: string | null;
  finalidade: string;
  tipo: string;
  bairro: string | null;
  quartos: number | null;
  banheiros: number | null;
  vagas_garagem: number | null;
  area_m2: number | null;
  preco: number | null;
  link_anuncio: string | null;
  anunciante_nome: string | null;
  anunciante_telefone: string | null;
  anunciante_email: string | null;
  imovel_id: string | null;
  created_at: string;
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
      setSubmissions((data as any) || []);
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

    // Insert into imoveis
    const { data: inserted, error: insertError } = await supabase.from("imoveis").insert({
      titulo: sub.titulo,
      descricao: sub.descricao,
      finalidade: sub.finalidade as any,
      tipo: sub.tipo as any,
      bairro: sub.bairro,
      quartos: sub.quartos || 0,
      banheiros: sub.banheiros || 0,
      vagas_garagem: sub.vagas_garagem || 0,
      area_m2: sub.area_m2,
      preco: sub.preco,
      link_anuncio: sub.link_anuncio,
      anunciante_nome: sub.anunciante_nome,
      anunciante_telefone: sub.anunciante_telefone,
      anunciante_email: sub.anunciante_email,
      origem: "manual" as any,
      status: "ativo" as any,
      gestao_propria,
    } as any).select("id").single();

    if (insertError) {
      toast({ title: "Erro ao aprovar", description: insertError.message, variant: "destructive" });
      setActionLoading(null);
      return;
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
}: {
  sub: Submission;
  onApprove: (s: Submission) => void;
  onReject: (s: Submission) => void;
  actionLoading: string | null;
  gestaoPropria: boolean;
  onToggleGestao: (v: boolean) => void;
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
        <Badge className={`${statusColors[sub.status_submission]} border text-xs`}>
          {sub.status_submission}
        </Badge>
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
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none p-2 rounded-md bg-primary/5 border border-primary/20">
            <input
              type="checkbox"
              checked={gestaoPropria}
              onChange={(e) => onToggleGestao(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="font-medium text-foreground">
              🏢 Gestão própria (Viva Bombinhas)
            </span>
            <span className="text-xs text-muted-foreground">
              — usar nosso contato no card
            </span>
          </label>
          <div className="flex gap-2">
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
