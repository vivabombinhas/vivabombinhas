import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Flame, Check, Loader2, Shield, Zap, TrendingUp, Star, Bot, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const VALOR_DESTAQUE = 49;
const DIAS_DESTAQUE = 30;

export default function CheckoutSimulado() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [submission, setSubmission] = useState<{
    titulo: string;
    bairro: string | null;
    finalidade: string;
    fotos: string[] | null;
  } | null>(null);

  useEffect(() => {
    if (!submissionId) return;
    (async () => {
      const { data, error } = await supabase
        .from("imoveis_submissions")
        .select("titulo, bairro, finalidade, fotos")
        .eq("id", submissionId)
        .maybeSingle();
      if (error || !data) {
        toast({ title: "Imóvel não encontrado", variant: "destructive" });
        navigate("/anuncie");
        return;
      }
      setSubmission(data);
      setLoading(false);
    })();
  }, [submissionId, navigate, toast]);

  const handleSimulatePayment = async () => {
    setProcessing(true);
    // Simula latência de gateway
    await new Promise((r) => setTimeout(r, 1800));

    // Marca a submission como "destaque solicitado" via observações
    // (o admin ativará no imóvel real ao aprovar)
    const ate = new Date();
    ate.setDate(ate.getDate() + DIAS_DESTAQUE);

    const marker = `[DESTAQUE-PAGO-SIMULADO] Pagamento de R$ ${VALOR_DESTAQUE} confirmado em ${new Date().toLocaleString("pt-BR")}. Ativar destaque até ${ate.toLocaleDateString("pt-BR")}.`;

    const { data: current } = await supabase
      .from("imoveis_submissions")
      .select("observacoes")
      .eq("id", submissionId!)
      .maybeSingle();

    await supabase
      .from("imoveis_submissions")
      .update({
        observacoes: current?.observacoes
          ? `${current.observacoes}\n\n${marker}`
          : marker,
      })
      .eq("id", submissionId!);

    setProcessing(false);
    setDone(true);
    toast({
      title: "Pagamento simulado confirmado! 🔥",
      description: `Seu anúncio será destacado por ${DIAS_DESTAQUE} dias após aprovação.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
          <div className="container flex h-16 items-center">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao site
            </Link>
          </div>
        </header>

        <main className="container py-16 max-w-xl">
          <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-10 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
              <Check className="h-10 w-10 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold mb-3">
                <Flame className="h-3.5 w-3.5" />
                DESTAQUE ATIVADO
              </div>
              <h2 className="text-2xl font-bold mb-2">Pagamento confirmado! 🎉</h2>
              <p className="text-muted-foreground">
                Assim que nossa equipe aprovar seu anúncio (em até 24h), ele aparecerá com{" "}
                <strong>borda dourada</strong> e <strong>posição prioritária</strong> nas buscas da MarIA por{" "}
                <strong>{DIAS_DESTAQUE} dias</strong>.
              </p>
            </div>
            <div className="text-xs text-muted-foreground bg-card border border-border rounded-lg p-3">
              ⚠️ <strong>Modo simulação:</strong> nenhum pagamento real foi processado. Esta é uma demonstração do fluxo
              que será integrado com Stripe ou Mercado Pago.
            </div>
            <Button
              asChild
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              <Link to="/">Voltar ao site</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex h-16 items-center">
          <Link to="/anuncie" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="container py-10 max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-3">
            <Flame className="h-3.5 w-3.5" />
            DESTAQUE PREMIUM
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Coloque seu imóvel{" "}
            <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">no topo</span>
          </h1>
          <p className="text-muted-foreground">
            Seu anúncio aparece primeiro nas buscas da MarIA por 30 dias.
          </p>
        </div>

        {/* Resumo do imóvel */}
        {submission && (
          <div className="rounded-2xl border border-border bg-card p-4 mb-6 flex items-center gap-4">
            {submission.fotos && submission.fotos[0] ? (
              <img src={submission.fotos[0]} alt="" className="w-20 h-20 rounded-lg object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                Sem foto
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Anúncio</p>
              <p className="font-bold truncate">{submission.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {submission.bairro && `${submission.bairro} • `}
                {submission.finalidade}
              </p>
            </div>
          </div>
        )}

        {/* Card de destaque */}
        <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20 p-6 space-y-5 mb-6">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Destaque {DIAS_DESTAQUE} dias</p>
              <p className="text-4xl font-bold">
                R$ {VALOR_DESTAQUE}
                <span className="text-base font-normal text-muted-foreground">,00</span>
              </p>
            </div>
            <span className="text-xs text-muted-foreground">pagamento único</span>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-amber-200 dark:border-amber-800">
            {[
              {
                icon: Bot,
                t: "MarIA recomenda seu imóvel primeiro",
                d: "Nossa IA sempre prioriza imóveis em destaque ao conversar com clientes interessados",
              },
              { icon: TrendingUp, t: "Posição prioritária nas buscas", d: "Aparece antes dos anúncios comuns" },
              { icon: Star, t: "Borda dourada e badge 🔥", d: "Mais cliques e atenção visual" },
              { icon: Zap, t: "Ativo por 30 dias", d: "Sem renovação automática" },
              { icon: Shield, t: "Cancele quando quiser", d: "Suporte por WhatsApp" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Como a MarIA recomenda */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <p className="text-xs font-bold uppercase tracking-wide text-accent">Vantagem exclusiva</p>
              </div>
              <p className="text-sm font-bold mb-1">A MarIA recomenda seu imóvel ativamente</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sempre que um cliente conversar com a MarIA buscando algo compatível, <strong className="text-foreground">o seu imóvel será o primeiro indicado</strong> — mesmo entre dezenas de opções. Imóveis em destaque têm prioridade absoluta nas conversas e nas listagens.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSimulatePayment}
          disabled={processing}
          size="lg"
          className="w-full gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-90 text-white font-bold shadow-lg"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando pagamento...
            </>
          ) : (
            <>
              <Flame className="h-4 w-4" />
              Simular pagamento de R$ {VALOR_DESTAQUE}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          🧪 <strong>Modo simulação ativo.</strong> Nenhum pagamento real será processado.
          <br />
          Em breve integraremos com Stripe ou Mercado Pago.
        </p>

        <Button asChild variant="ghost" size="sm" className="w-full mt-3 text-xs text-muted-foreground">
          <Link to="/">Não, obrigado, continuar sem destaque</Link>
        </Button>
      </main>
    </div>
  );
}
