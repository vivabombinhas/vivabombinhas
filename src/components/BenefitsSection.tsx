import { Zap, Link2, LayoutList, MessageCircle } from "lucide-react";

const benefits = [
  { icon: Zap, title: "Economia de tempo", desc: "Encontre em segundos o que levaria horas pesquisando manualmente em dezenas de fontes." },
  { icon: LayoutList, title: "Resultados organizados", desc: "Opções apresentadas de forma clara e comparável, sem informação duplicada ou desatualizada." },
  { icon: Link2, title: "Links diretos", desc: "Acesse o anúncio original e entre em contato direto com o anunciante ou imobiliária." },
  { icon: MessageCircle, title: "Busca conversacional", desc: "Fale com a MarIA como fala com um amigo. Sem filtros complicados, sem formulários." },
];

const BenefitsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-accent/[0.03] to-transparent">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Benefícios</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que usar a <span className="text-gradient">MarIA</span>?
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {benefits.map((b, i) => (
            <div key={i} className="flex gap-4 p-5 rounded-2xl hover:bg-card transition-colors">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
