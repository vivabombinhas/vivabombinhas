import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { InteractiveChatBox } from "./InteractiveChatBox";

// ─── Main HeroSection ─────────────────────────────────────────────────────────
export default function HeroSection() {
  const [activeFlow, setActiveFlow] = useState<number>(0);

  const handleFlowSelect = (index: number) => {
    setActiveFlow(index);
  };

  const flows = [
    { label: "Temporada", emoji: "🏖", index: 0 },
    { label: "Aluguel anual", emoji: "🏠", index: 1 },
    { label: "Compra", emoji: "🔑", index: 2 },
  ];

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">

      {/* ── Background ── */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient — ocean deep */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #04111f 0%, #062340 45%, #083660 70%, #0a4a7a 100%)" }} />
        {/* Mesh glow */}
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(ellipse 70% 55% at 65% 35%, rgba(56,182,255,0.7) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 85% 75%, rgba(26,157,224,0.4) 0%, transparent 50%)" }} />
        {/* Subtle horizontal lines — water ripple feel */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(56,182,255,0.5) 28px, rgba(56,182,255,0.5) 29px)", maskImage: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
      </div>

      {/* ── Content grid ── */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 items-center gap-10 max-w-7xl mx-auto w-full px-6 lg:px-12 pt-24 pb-10">

        {/* ── LEFT ── */}
        <div className="flex flex-col animate-fade-up">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start mb-7 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/8 backdrop-blur-sm text-white/80 text-[12px] tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38b6ff] shadow-[0_0_6px_rgba(56,182,255,0.8)]" />
            Inteligência Imobiliária em Bombinhas
          </div>

          {/* Headline */}
          <h1 className="font-bold leading-[1.05] tracking-tight text-white mb-5" style={{ fontSize: "clamp(38px, 4vw, 58px)" }}>
            A concierge<br />imobiliária<br />inteligente de{" "}
            <span className="italic" style={{ background: "linear-gradient(90deg, #1a9de0, #38b6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Bombinhas
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/75 text-[15px] leading-relaxed font-light max-w-[440px] mb-8">
            Aluguel de temporada, anual, compra ou investimento — a MarIA entende o que você precisa e mostra apenas imóveis que fazem sentido para o seu perfil.
          </p>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {flows.map((flow) => (
              <button
                key={flow.label}
                onClick={() => handleFlowSelect(flow.index)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] border transition-all duration-200 ${
                  activeFlow === flow.index
                    ? "bg-[#38b6ff] border-[#38b6ff] text-[#04111f] font-medium shadow-[0_4px_16px_rgba(56,182,255,0.35)]"
                    : "bg-white/8 border-white/20 text-white/80 hover:bg-white/15 hover:border-white/40 hover:text-white"
                }`}
              >
                <span>{flow.emoji}</span>
                <span>{flow.label}</span>
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <Button
              size="lg"
              className="flex items-center gap-2 rounded-full px-6 text-[14px] font-medium text-[#04111f] border-0"
              style={{ background: "#38b6ff", boxShadow: "0 8px 32px rgba(56,182,255,0.35)" }}
              onClick={() => window.open('https://wa.me/5547999999999', '_blank')}
            >
              <MessageCircle size={15} />
              Conversar com a MarIA
              <ArrowRight size={14} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6 text-[14px] font-medium text-white/80 border-white/25 bg-transparent hover:bg-white/10 hover:text-white hover:border-white/50"
              onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Como funciona
            </Button>
          </div>

        </div>

        {/* ── RIGHT: Chat ── */}
        <div className="relative flex items-center justify-center lg:justify-end animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="w-full max-w-[400px]">
            <InteractiveChatBox 
              forcedConvIndex={activeFlow} 
              onConvIndexChange={(index) => setActiveFlow(index)}
            />
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#3b9fe8]/20 rounded-full blur-[80px] -z-10" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] -z-10" />
        </div>

      </div>
    </section>
  );
}