import { Globe, Facebook, Smartphone, MapPin, Clock, Frown } from "lucide-react";

const problems = [
  { icon: Globe, title: "Sites de imobiliárias", desc: "Cada imobiliária tem seu site. Você precisa acessar vários, um por um." },
  { icon: Facebook, title: "Grupos e redes sociais", desc: "Facebook, Instagram, grupos… informações espalhadas e desorganizadas." },
  { icon: Smartphone, title: "OLX e classificados", desc: "Anúncios repetidos, desatualizados e sem filtro eficiente para a região." },
  { icon: MapPin, title: "Placas na rua", desc: "Muitos imóveis só têm placa física. Impossível encontrar sem estar lá." },
];

const ProblemSection = () => {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-destructive bg-destructive/10 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Frown className="h-4 w-4" />
            O problema
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Procurar imóveis em Bombinhas é{" "}
            <span className="text-destructive">frustrante</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            As informações estão espalhadas em dezenas de lugares diferentes. Você perde horas e ainda pode deixar boas oportunidades passar.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map((p, i) => (
            <div key={i} className="group glass rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                <p.icon className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mt-10 text-muted-foreground">
          <Clock className="h-5 w-5" />
          <span className="text-sm font-medium">Em média, pessoas gastam <strong className="text-foreground">4-6 horas</strong> pesquisando antes de encontrar algo.</span>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
