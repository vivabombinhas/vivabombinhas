import { Search, ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-accent p-8 md:p-14 text-center text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <Bot className="h-12 w-12 mx-auto mb-6 animate-float" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para encontrar seu imóvel?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Experimente agora mesmo. Descreva o que procura e deixe a MarIA trabalhar por você.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 bg-white/90 rounded-xl px-4 py-3">
                  <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Casa com 3 quartos em Bombas para comprar..."
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                  />
                </div>
                <Button size="lg" className="gap-2 rounded-xl shrink-0 bg-foreground text-background hover:bg-foreground/90">
                  Perguntar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
