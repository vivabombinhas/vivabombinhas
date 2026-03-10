import { UtensilsCrossed, Palmtree, Wrench, Rocket } from "lucide-react";

const items = [
  { icon: UtensilsCrossed, label: "Restaurantes" },
  { icon: Palmtree, label: "Turismo" },
  { icon: Wrench, label: "Serviços" },
  { icon: Rocket, label: "E mais..." },
];

const FutureSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="glass rounded-3xl p-8 md:p-14 text-center max-w-3xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="relative z-10">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Em breve</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Mais que imóveis.{" "}
              <span className="text-gradient">Uma plataforma digital local.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              MarIA está começando pelos imóveis, mas em breve será sua assistente para tudo em Bombinhas.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 bg-background/80 rounded-full px-5 py-2.5 text-sm font-medium text-foreground shadow-sm">
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
