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
    <section className="py-24 md:py-40 relative overflow-hidden bg-secondary/30">
      <div className="container relative z-10">
        {/* Header Section */}
        <div className="text-center mb-24 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-[0.2em] mb-10 animate-fade-up shadow-sm">
            <AlertCircle className="h-4 w-4" />
            O desafio atual
          </div>
          
          <h2 className="text-4xl md:text-7xl font-bold mb-10 tracking-tight leading-[1.05] text-foreground">
            Encontrar imóvel em <span className="text-primary italic">Bombinhas</span> virou um <span className="text-gradient">caos.</span>
          </h2>
          
          <p className="text-muted-foreground text-xl md:text-2xl font-light leading-relaxed max-w-2xl mx-auto">
            Sites diferentes, anúncios repetidos e oportunidades que passam despercebidas por falta de organização.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-32 relative">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] -z-10 pointer-events-none"></div>
          
          {problems.map((p, i) => (
            <div 
              key={i} 
              className="group relative rounded-[40px] border border-border/50 bg-background/80 backdrop-blur-md p-10 hover:border-primary/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 flex flex-col items-center text-center animate-fade-up"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="w-24 h-24 rounded-3xl bg-secondary flex items-center justify-center mb-10 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500 shadow-sm border border-border/10">
                <p.icon className="h-10 w-10 text-foreground/70 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">{p.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-light text-lg">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Transition to Solution */}
        <div className="text-center flex flex-col items-center max-w-lg mx-auto">
          <p className="text-muted-foreground text-xl md:text-2xl font-light italic mb-8">
            Foi exatamente por isso que criamos a MarIA.
          </p>
          <div className="w-px h-32 bg-gradient-to-b from-primary via-primary/40 to-transparent"></div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;