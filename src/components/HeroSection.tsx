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
    <section className="relative min-h-[70vh] flex flex-col justify-center overflow-hidden pt-32 pb-16 lg:pt-20 lg:pb-12 bg-white">
      
      {/* ── Background: Subtle & Refined ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-slate-50/50 to-transparent" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(#000 0.5px, transparent 0.5px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="relative z-10 container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,0.8fr] items-center gap-12 lg:gap-24">
          
          {/* ── LEFT: Content ── */}
          <div className="flex flex-col">
            
            {/* Minimal Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 self-start mb-10 px-3 py-1.5 rounded-full border border-slate-100 bg-slate-50/50"
            >
              <div className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Assistente de busca imobiliária • Bombinhas
              </span>
            </motion.div>

            {/* Headline: Editorial & Sophisticated */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-950 font-bold tracking-tight leading-[1.1] mb-8" 
              style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
            >
              Descubra imóveis em<br />
              <span className="text-blue-600">Bombinhas</span> sem perder<br />
              horas pesquisando.
            </motion.h1>

            {/* Description: Clean & Clear */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 text-lg leading-relaxed font-medium max-w-[480px] mb-10"
            >
              A MarIA organiza anúncios de toda a cidade para você. Converse, filtre e encontre opções reais em um só lugar, direto com o anunciante.
            </motion.p>

            {/* Interaction Row */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
              <Button
                size="lg"
                className="h-14 px-10 rounded-2xl bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-slate-200 group"
                onClick={() => window.open('https://wa.me/5547999999999', '_blank')}
              >
                Conversar agora
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                {flows.map((flow) => (
                  <button
                    key={flow.label}
                    onClick={() => setActiveFlow(flow.index)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      activeFlow === flow.index
                        ? "bg-white text-slate-950 shadow-sm border border-slate-100"
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
            className="relative"
          >
            <div className="relative z-10 w-full max-w-[400px] mx-auto lg:ml-auto">
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