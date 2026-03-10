import { UtensilsCrossed, Palmtree, Wrench, Rocket } from "lucide-react";

const items = [
  { icon: UtensilsCrossed, label: "Restaurantes" },
  { icon: Palmtree, label: "Turismo" },
  { icon: Wrench, label: "Serviços" },
  { icon: Rocket, label: "E mais..." },
];

const FutureSection = () => {
  return (
    <section className="py-12 md:py-32">
      <div className="container">
        <div className="rounded-3xl bg-gradient-to-br from-foreground to-foreground/90 p-10 md:p-16 text-center max-w-4xl mx-auto relative overflow-hidden">
          {/* Glows */}
          <div className="absolute top-0 left-1/3 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <p className="text-sm font-bold text-accent uppercase tracking-widest mb-4">Roadmap</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-primary-foreground">
              Mais que imóveis.
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Uma plataforma digital local.</span>
            </h2>
            <p className="text-primary-foreground/50 text-lg mb-10 max-w-xl mx-auto">
              MarIA começa pelos imóveis, mas em breve será sua assistente para tudo em Bombinhas.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground/80">
                  <it.icon className="h-4 w-4 text-accent" />
                  {it.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FutureSection;
