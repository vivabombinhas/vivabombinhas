import { MessageSquare, Cpu, ListChecks } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    num: "01",
    title: "Descreva o que procura",
    desc: "Use linguagem natural: \"apartamento 2 quartos em Mariscal, até R$3.500 por mês\".",
  },
  {
    icon: Cpu,
    num: "02",
    title: "MarIA busca para você",
    desc: "Nossa IA vasculha diversas fontes da região e cruza informações em tempo real.",
  },
  {
    icon: ListChecks,
    num: "03",
    title: "Resultados organizados",
    desc: "Opções com links diretos para anúncios originais e contatos. Tudo pronto para você.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-12 md:py-32 relative overflow-hidden">
      {/* Subtle bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-transparent" />
      
      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Como funciona</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Três passos.
            <br />
            <span className="text-gradient">Zero complicação.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="relative rounded-2xl border border-border bg-card p-8 text-center group hover:border-primary/30 hover:shadow-xl transition-all duration-300">
              {/* Step number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                PASSO {s.num}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 mt-2 group-hover:bg-primary/15 transition-colors">
                <s.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
