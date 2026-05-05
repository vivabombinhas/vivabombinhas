import { Search, ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    navigate("/maria", { state: { initialMessage: query.trim() } });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-10 overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-primary/30 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[100px] mix-blend-screen" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-blue-400 mb-8 animate-fade-up backdrop-blur-md">
          <Zap className="h-3.5 w-3.5 fill-blue-400" />
          Beta Aberto — Agora em Bombinhas
        </div>

        <h1 className="text-4xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-8 animate-fade-up text-white" style={{ animationDelay: "0.1s", opacity: 0 }}>
          Encontre seu imóvel
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent italic">com Inteligência Artificial</span>
        </h1>

        <p className="text-lg md:text-2xl text-white/50 mb-12 max-w-3xl mx-auto animate-fade-up leading-relaxed font-medium" style={{ animationDelay: "0.2s", opacity: 0 }}>
          Esqueça as horas perdidas em sites lentos. MarIA vasculha dezenas de fontes
          em Bombinhas e entrega as melhores oportunidades em segundos.
        </p>

        {/* Search input */}
        <form 
          id="experimentar" 
          onSubmit={handleSearch}
          className="rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 p-2 max-w-2xl mx-auto animate-fade-up shadow-2xl" 
          style={{ animationDelay: "0.3s", opacity: 0 }}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-4 border border-white/10 focus-within:border-primary/50 transition-colors">
              <Search className="h-5 w-5 text-blue-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Apartamento 2 quartos em Mariscal até R$3.500..."
                className="w-full bg-transparent text-sm md:text-base text-white outline-none placeholder:text-white/30"
              />
            </div>
            <Button 
              type="submit"
              size="lg" 
              className="h-auto py-4 px-8 gap-2 rounded-xl shrink-0 bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] text-white font-bold"
            >
              Perguntar à MarIA
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Social proof strip */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-x-6 mt-8 animate-fade-up" style={{ animationDelay: "0.4s", opacity: 0 }}>
          <div className="flex items-center gap-1.5 text-white/40 text-sm font-semibold tracking-wide">
            <Sparkles className="h-4 w-4 text-blue-400 fill-blue-400/20" />
            <span>GRÁTIS PARA TESTAR</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-white/20" />
          <span className="text-white/40 text-sm font-semibold tracking-wide uppercase">Sem Cadastro</span>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-white/20" />
          <span className="text-white/40 text-sm font-semibold tracking-wide uppercase">Resultados em Segundos</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
