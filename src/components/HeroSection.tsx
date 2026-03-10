import { Search, ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-10 overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground via-foreground/95 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[100px]" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-8 animate-fade-up backdrop-blur-sm">
          <Zap className="h-3.5 w-3.5" />
          Lançamento — Beta aberto para Bombinhas
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 animate-fade-up text-primary-foreground" style={{ animationDelay: "0.1s", opacity: 0 }}>
          Busca imobiliária
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">reinventada por IA</span>
        </h1>

        <p className="text-lg md:text-xl text-primary-foreground/60 mb-10 max-w-2xl mx-auto animate-fade-up leading-relaxed" style={{ animationDelay: "0.2s", opacity: 0 }}>
          Descreva o que procura em linguagem natural. MarIA vasculha dezenas de fontes
          em Bombinhas e entrega resultados organizados em segundos.
        </p>

        {/* Search input */}
        <div id="experimentar" className="rounded-2xl bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 p-2 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 bg-primary-foreground rounded-xl px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Apartamento 2 quartos em Mariscal até R$3.500..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <Button size="lg" className="gap-2 rounded-xl shrink-0 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground">
              Perguntar à MarIA
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Social proof strip */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-6 mt-8 animate-fade-up" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <div className="flex items-center gap-1.5 text-primary-foreground/60 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Grátis para testar</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-primary-foreground/20" />
          <span className="text-primary-foreground/60 text-sm font-medium">Sem cadastro</span>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-primary-foreground/20" />
          <span className="text-primary-foreground/60 text-sm font-medium">Resposta em &lt;10s</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
