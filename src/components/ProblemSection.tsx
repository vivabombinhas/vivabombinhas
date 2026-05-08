import { LayoutGrid, Users, Copy, EyeOff, AlertCircle } from "lucide-react";

const problems = [
  { 
    icon: LayoutGrid, 
    title: "Imobiliárias espalhadas", 
    desc: "Você precisa procurar em dezenas de sites diferentes para ter uma visão real do que está disponível." 
  },
  { 
    icon: Users, 
    title: "Grupos e redes sociais", 
    desc: "Informações desorganizadas, fotos de baixa qualidade e anúncios que desaparecem tão rápido quanto surgem." 
  },
  { 
    icon: Copy, 
    title: "Anúncios repetidos", 
    desc: "O mesmo imóvel em vários lugares com preços e informações conflitantes em portais desatualizados." 
  },
  { 
    icon: EyeOff, 
    title: "Oportunidades invisíveis", 
    desc: "As melhores unidades e lançamentos exclusivos muitas vezes nem chegam aos grandes portais de busca." 
  },
];

const ProblemSection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-secondary/30">
      <div className="container">
        {/* Header Section */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
            <AlertCircle className="h-3.5 w-3.5" />
            O desafio atual
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight leading-[1.1]">
            Encontrar imóvel em <span className="text-primary italic font-serif">Bombinhas</span> virou um caos.
          </h2>
          
          <p className="text-muted-foreground text-xl md:text-2xl font-light leading-relaxed">
            Sites diferentes, anúncios repetidos e oportunidades que passam despercebidas por falta de organização.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {problems.map((p, i) => (
            <div 
              key={i} 
              className="group relative rounded-3xl border border-border bg-background p-8 hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500">
                <p.icon className="h-8 w-8 text-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">{p.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-light">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Transition to Solution */}
        <div className="text-center pt-10 border-t border-border/50">
          <p className="text-muted-foreground text-lg italic mb-2">Foi exatamente por isso que criamos a MarIA.</p>
          <div className="inline-block h-12 w-[1px] bg-gradient-to-b from-primary to-transparent mx-auto"></div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
