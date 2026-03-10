import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-12 md:py-32">
      <div className="container max-w-3xl text-center">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Comece agora</p>
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Pronto para encontrar
          <br />
          <span className="text-gradient">seu imóvel?</span>
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
          Descreva o que procura e deixe a MarIA trabalhar por você. Gratuito, sem cadastro.
        </p>

        <div className="rounded-2xl border border-border bg-card p-2 max-w-xl mx-auto shadow-xl shadow-primary/5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 bg-background rounded-xl px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Casa com 3 quartos em Bombas para comprar..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <Button size="lg" className="gap-2 rounded-xl shrink-0 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
              Perguntar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
