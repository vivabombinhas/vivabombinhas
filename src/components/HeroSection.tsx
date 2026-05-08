import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { InteractiveChatBox } from "./InteractiveChatBox";
import { motion } from "framer-motion";

export default function HeroSection() {
  const [activeFlow, setActiveFlow] = useState<number>(0);

  const flows = [
    { label: "Temporada", emoji: "🏖", index: 0 },
    { label: "Anual", emoji: "🏠", index: 1 },
    { label: "Compra", emoji: "🔑", index: 2 },
  ];

  return (
    <section className="relative min-h-[80vh] lg:min-h-[85vh] flex flex-col justify-center overflow-hidden pt-32 pb-16 lg:pt-20 lg:pb-0">
      
      {/* ── Background: Modern Deep Ocean ── */}
      <div className="absolute inset-0 z-0 bg-[#020817]">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#ffffff 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }} />
        
        {/* Modern glowing orbs */}
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-blue-400/10 rounded-full blur-[100px]" />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020817]/50 to-[#020817]" />
      </div>

      <div className="relative z-10 container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] items-center gap-12 lg:gap-20">
          
          {/* ── LEFT: Content ── */}
          <div className="flex flex-col">
            
            {/* Premium Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 self-start mb-8 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl shadow-blue-500/10"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </div>
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-[0.2em] flex items-center gap-1.5">
                MarIA Online Agora <span className="text-white/30">•</span> Bombinhas
              </span>
            </motion.div>

            {/* Headline: Clean, bold, architectural */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white font-bold tracking-[-0.03em] leading-[0.95] mb-6" 
              style={{ fontSize: "clamp(42px, 6vw, 76px)" }}
            >
              A inteligência que<br />
              <span className="text-white/40">conecta você</span><br />
              ao imóvel ideal.
            </motion.h1>

            {/* Description: Light, readable */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-lg md:text-xl leading-relaxed font-medium max-w-[480px] mb-10"
            >
              Do aluguel de temporada ao investimento dos sonhos. A MarIA entende seu perfil e filtra o melhor de Bombinhas para você.
            </motion.p>

            {/* Interaction Row */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
              <Button
                size="lg"
                className="h-14 px-8 rounded-2xl bg-white text-slate-950 font-bold hover:bg-white/90 transition-all duration-300 shadow-2xl shadow-white/10 group"
                onClick={() => window.open('https://wa.me/5547999999999', '_blank')}
              >
                Conversar agora
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm">
                {flows.map((flow) => (
                  <button
                    key={flow.label}
                    onClick={() => setActiveFlow(flow.index)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      activeFlow === flow.index
                        ? "bg-white/10 text-white border border-white/10 shadow-lg"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {flow.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT: Chat (Refined & Compact) ── */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 20 }}
            className="relative"
          >
            <div className="relative z-10 w-full max-w-[420px] mx-auto lg:ml-auto group">
              {/* Inner glow around chat */}
              <div className="absolute -inset-4 bg-primary/10 rounded-[48px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <InteractiveChatBox 
                forcedConvIndex={activeFlow} 
                onConvIndexChange={(index) => setActiveFlow(index)}
              />
            </div>
            
            {/* Architectural light leaks */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px] -z-10" />
          </motion.div>

        </div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-white/20"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Explore</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
      </motion.div>
    </section>
  );
}