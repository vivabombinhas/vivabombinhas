import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { InteractiveChatBox } from "./InteractiveChatBox";
import { motion } from "framer-motion";

export default function HeroSection() {
  const [activeFlow, setActiveFlow] = useState<number>(0);

  const flows = [
    { label: "Temporada", index: 0 },
    { label: "Anual", index: 1 },
    { label: "Compra", index: 2 },
  ];

  return (
    <section className="relative min-h-[85vh] lg:min-h-[75vh] flex flex-col justify-center overflow-hidden pt-32 pb-12 lg:pt-24 lg:pb-16 bg-white">
      
      {/* ── Background: Subtle Gradient & Pattern ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(37,99,235,0.03),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative z-10 container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] items-center gap-12 lg:gap-32">
          
          {/* ── LEFT: Content ── */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Minimalist Status Badge - Visible on Mobile */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 mb-8 lg:mb-10 px-4 py-2 rounded-full border border-slate-100 bg-white/50 backdrop-blur-sm shadow-sm max-w-full overflow-hidden"
            >
              <div className="flex h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)] animate-pulse shrink-0" />
              <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap overflow-hidden text-ellipsis">
                Assistente Imobiliária • Bombinhas
              </span>
            </motion.div>

            {/* Headline: Precise & Powerful */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-slate-950 font-extrabold tracking-[-0.03em] leading-[1.05] mb-6 lg:mb-8" 
              style={{ fontSize: "clamp(38px, 6vw, 72px)" }}
            >
              Encontre o imóvel<br />
              certo em <span className="text-blue-600">Bombinhas</span><br />
              sem complicação.
            </motion.h1>

            {/* Description: Balanced & Sophisticated */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-slate-500 text-base md:text-xl leading-relaxed font-medium max-w-[520px] mb-10 lg:mb-12"
            >
              A MarIA centraliza anúncios de toda a cidade e filtra o que realmente importa. Converse, explore e conecte-se direto com o anunciante.
            </motion.p>

            {/* Interaction Row */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="h-14 lg:h-16 px-8 lg:px-10 rounded-2xl bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all duration-500 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] group"
                onClick={() => window.open('https://wa.me/5547999999999', '_blank')}
              >
                Começar agora
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-500" />
              </Button>

              <div className="flex bg-slate-50 p-1 rounded-[18px] lg:rounded-[20px] border border-slate-100/80 shadow-inner overflow-x-auto scrollbar-hide">
                {flows.map((flow) => (
                  <button
                    key={flow.label}
                    onClick={() => setActiveFlow(flow.index)}
                    className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-[12px] lg:rounded-[14px] text-[10px] lg:text-[11px] font-bold uppercase tracking-wider transition-all duration-500 whitespace-nowrap ${
                      activeFlow === flow.index
                        ? "bg-white text-slate-950 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-100"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {flow.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT: Chat (Refined & Clean) ── */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="relative z-10 w-full max-w-[340px] md:max-w-[400px] mx-auto lg:ml-auto">
              <InteractiveChatBox 
                forcedConvIndex={activeFlow} 
                onConvIndexChange={(index) => setActiveFlow(index)}
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}