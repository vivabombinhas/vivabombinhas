import { MessageSquare, Cpu, ListChecks } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    num: "01",
    title: "Descreva o que procura",
    desc: "Use linguagem natural: \"apartamento 2 quartos em Mariscal, até R$3.500 por mês\". Simples assim.",
  },
  {
    icon: Cpu,
    num: "02",
    title: "MarIA busca para você",
    desc: "Nossa IA vasculha diversas fontes da região de Bombinhas e cruza as informações em tempo real.",
  },
  {
    icon: ListChecks,
    num: "03",
    title: "Receba resultados organizados",
    desc: "Opções com links diretos para os anúncios originais e contatos dos anunciantes. Tudo pronto.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-gradient-to-b from-primary/[0.03] to-transparent">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Como funciona</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Três passos. <span className="text-gradient">Zero complicação.</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            MarIA faz em segundos o que levaria horas pesquisando manualmente.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="relative text-center group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-primary/20" />
              )}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <s.icon className="h-9 w-9 text-primary-foreground" />
              </div>
              <span className="text-xs font-bold text-primary/50 uppercase tracking-widest">{s.num}</span>
              <h3 className="font-bold text-lg mt-1 mb-2 text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
