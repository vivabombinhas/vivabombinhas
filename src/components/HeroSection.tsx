import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { InteractiveChatBox } from "./InteractiveChatBox";
import { useState } from "react";

const HeroSection = () => {
  const navigate = useNavigate();
  const [activeFlow, setActiveFlow] = useState<number | null>(null);

  const handleStartChat = () => {
    navigate("/maria");
  };

  const handleFlowSelect = (index: number) => {
    setActiveFlow(null); // Force a reset in the child
    setTimeout(() => setActiveFlow(index), 10);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden bg-slate-50">
      {/* Background Image with sophisticated overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=2500&auto=format&fit=crop" 
          alt="Bombinhas Aerial View" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent md:block hidden" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/60 to-white md:hidden block" />
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <div className="max-w-2xl animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-primary mb-6 border border-blue-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Inteligência Imobiliária em Bombinhas
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              A concierge imobiliária inteligente de <span className="text-primary italic">Bombinhas</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
              Aluguel de temporada, anual, compra ou investimento — a MarIA entende o que você precisa e mostra apenas imóveis que fazem sentido para o seu perfil.
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4 mb-10">
              {[
                { label: "🏖 Temporada", index: 0 },
                { label: "🏠 Aluguel anual", index: 1 },
                { label: "🔑 Compra", index: 2 },
                { label: "📈 Investimento", index: 2 },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleFlowSelect(chip.index)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-all bg-white/50 backdrop-blur-sm shadow-sm flex items-center gap-2"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleStartChat}
                size="lg" 
                className="h-14 px-8 gap-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-blue-200 transition-all hover:scale-105"
              >
                Conversar com a MarIA
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-bold text-lg hover:bg-slate-50 transition-all"
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Como funciona
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex items-center gap-8 text-slate-400">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">40+</span>
                <span className="text-sm font-medium uppercase tracking-wider">Imobiliárias</span>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">1.5k+</span>
                <span className="text-sm font-medium uppercase tracking-wider">Imóveis Ativos</span>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">100%</span>
                <span className="text-sm font-medium uppercase tracking-wider">Bombinhas</span>
              </div>
            </div>
          </div>

          {/* Real Interactive Chat Box */}
          <div className="relative animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <InteractiveChatBox forcedConvIndex={activeFlow} />
            
            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-tropical-100/50 rounded-full blur-[80px] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;