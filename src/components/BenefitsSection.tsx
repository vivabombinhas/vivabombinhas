import { Zap, Link2, LayoutList, MessageCircle } from "lucide-react";

const benefits = [
  { icon: Zap, title: "Economia de tempo", desc: "Encontre em segundos o que levaria horas pesquisando manualmente.", stat: "10x", statLabel: "mais rápido" },
  { icon: LayoutList, title: "Resultados organizados", desc: "Opções claras e comparáveis. Sem duplicatas ou informação desatualizada.", stat: "100%", statLabel: "organizado" },
  { icon: Link2, title: "Links diretos", desc: "Acesse o anúncio original e fale direto com o anunciante.", stat: "0", statLabel: "intermediários" },
  { icon: MessageCircle, title: "Busca conversacional", desc: "Fale com a MarIA como fala com um amigo. Sem filtros complicados.", stat: "∞", statLabel: "formas de buscar" },
];

const BenefitsSection = () => {
  return (
    <section className="py-12 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-transparent" />
      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Benefícios</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Por que usar a <span className="text-gradient">MarIA</span>?
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {benefits.map((b, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-auto text-right">
                  <div className="text-2xl font-bold text-gradient">{b.stat}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{b.statLabel}</div>
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-1">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
