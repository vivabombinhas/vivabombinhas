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
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden bg-[#0a1628] selection:bg-primary/30" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2847 50%, #0a3d6b 100%)' }}>
      <div className="container relative z-10 px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <div className="max-w-2xl animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white mb-6 border border-white/20 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Inteligência Imobiliária em Bombinhas
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              A concierge imobiliária inteligente de <span className="text-[#3b9fe8] italic">Bombinhas</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed max-w-xl">
              Aluguel de temporada, anual, compra ou investimento — a MarIA entende o que você precisa e mostra apenas imóveis que fazem sentido para o seu perfil.
            </p>

            <div className="flex flex-wrap lg:flex-nowrap gap-2 md:gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { label: "🏖 Temporada", index: 0 },
                { label: "🏠 Aluguel anual", index: 1 },
                { label: "🔑 Compra", index: 2 },
                { label: "📈 Investimento", index: 2 },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleFlowSelect(chip.index)}
                  className="px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-white/90 hover:bg-white/10 hover:border-white/20 transition-all bg-white/5 backdrop-blur-sm shadow-sm flex items-center gap-2 whitespace-nowrap"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleStartChat}
                size="lg" 
                className="h-14 px-8 gap-2 rounded-2xl bg-[#3b9fe8] hover:bg-[#3b9fe8]/90 text-white font-bold text-lg shadow-xl shadow-[#3b9fe8]/20 transition-all hover:scale-105"
              >
                Conversar com a MarIA
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="h-14 px-8 rounded-2xl border-white/10 text-white font-bold text-lg hover:bg-white/5 transition-all bg-transparent"
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Como funciona
              </Button>
            </div>

            {/* Trust Badges - Refined Social Proof */}
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-white/60">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">+20</span>
                <span className="text-xs font-medium uppercase tracking-wider">Imobiliárias parceiras</span>
              </div>
              <span className="hidden sm:block text-white/20">|</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">+580</span>
                <span className="text-xs font-medium uppercase tracking-wider">Imóveis cadastrados</span>
              </div>
              <span className="hidden sm:block text-white/20">|</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">100%</span>
                <span className="text-xs font-medium uppercase tracking-wider">Bombinhas</span>
              </div>
            </div>
          </div>

          {/* Real Interactive Chat Box with WhatsApp Notification */}
          <div className="relative animate-fade-up" style={{ animationDelay: "0.2s" }}>
            {/* WhatsApp Notification Badge */}
            <div className="absolute -top-6 -left-6 md:-left-12 z-20 max-w-[260px] animate-fade-in">
              <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-4 border border-slate-100 backdrop-blur-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-bold text-[13px] text-slate-900 leading-tight">MarIA encontrou algo para você</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Nova casa em Mariscal com perfil que você pediu. 3 quartos · R$ 890/noite.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#3b9fe8]/10 text-[#3b9fe8] text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b9fe8] animate-pulse" />
                  Notificação em tempo real
                </div>
              </div>
            </div>

            <InteractiveChatBox forcedConvIndex={activeFlow} />
            
            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#3b9fe8]/20 rounded-full blur-[80px] -z-10" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;