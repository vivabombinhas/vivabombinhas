import { Globe, Facebook, Smartphone, MapPin, Clock } from "lucide-react";

const problems = [
  { icon: Globe, title: "Sites de imobiliárias", desc: "Cada imobiliária tem seu site. Você precisa acessar vários, um por um." },
  { icon: Facebook, title: "Grupos e redes sociais", desc: "Facebook, Instagram, grupos… informações espalhadas e desorganizadas." },
  { icon: Smartphone, title: "OLX e classificados", desc: "Anúncios repetidos, desatualizados e sem filtro eficiente para a região." },
  { icon: MapPin, title: "Placas na rua", desc: "Muitos imóveis só têm placa física. Impossível encontrar sem estar lá." },
];

const ProblemSection = () => {
  return (
    <section className="py-12 md:py-32 relative">
      <div className="container">
        {/* Big stat */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-destructive uppercase tracking-wider mb-6">
            <Clock className="h-4 w-4" />
            O problema
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Procurar imóveis em Bombinhas
            <br />
            <span className="text-destructive">deveria ser mais simples.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Informações fragmentadas em dezenas de fontes. Horas perdidas.
            Oportunidades que passam sem você ver.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {problems.map((p, i) => (
            <div key={i} className="group rounded-2xl border border-border bg-card p-6 hover:border-destructive/30 hover:shadow-lg transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <p.icon className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground mb-1.5 text-sm">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Big number callout */}
        <div className="mt-14 text-center">
          <div className="inline-flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-bold text-gradient">4-6h</span>
            <span className="text-muted-foreground text-lg">gastas em média antes de encontrar algo</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
