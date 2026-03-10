import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container relative z-10 text-center max-w-3xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-fade-up">
          <Sparkles className="h-4 w-4" />
          Nova tecnologia local para Bombinhas
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
          Encontre o imóvel ideal em Bombinhas{" "}
          <span className="text-gradient">com inteligência artificial</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          Pare de procurar em dezenas de sites, grupos e redes sociais.
          Diga à MarIA o que você precisa e receba opções organizadas em segundos.
        </p>

        {/* Search input */}
        <div id="experimentar" className="glass rounded-2xl p-2 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 bg-background rounded-xl px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Apartamento para aluguel anual em Mariscal até R$3.500"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <Button size="lg" className="gap-2 rounded-xl shrink-0 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
              Perguntar à MarIA
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4 animate-fade-up" style={{ animationDelay: "0.4s", opacity: 0 }}>
          ✨ Grátis para testar • Sem cadastro • Resposta em segundos
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
