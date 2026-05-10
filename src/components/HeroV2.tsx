import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractiveChatBox } from "@/components/InteractiveChatBox";
import { TypingText } from "@/components/ui/TypingText";
import { Link } from "react-router-dom";

export const HeroV2 = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Atmosphere & Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #04111f 0%, #062340 45%, #083660 70%, #0a4a7a 100%)" }} />
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(ellipse 70% 55% at 65% 35%, rgba(12,127,212,0.6) 0%, transparent 60%)" }} />
      </div>

      <div className="container-wide relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full border border-white/20 bg-white/8 text-white/80 backdrop-blur-sm"
            >
              <div className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <TypingText text="Inteligência Imobiliária • Bombinhas" className="text-badge text-white/80" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-display mb-8 text-white"
            >
              A concierge imobiliária inteligente de <span className="text-primary italic font-serif">Bombinhas</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-subtitle max-w-[540px] mb-12 text-white/75"
            >
              Aluguel de temporada, anual, compra ou investimento — a MarIA entende seu perfil e mostra apenas os imóveis certos para você.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="h-16 px-10 rounded-full bg-primary text-white font-bold hover:opacity-90 transition-all duration-500 shadow-2xl group"
                asChild
              >
                <Link to="/maria">
                  Conversar com a MarIA
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-500" />
                </Link>
              </Button>
            </motion.div>

            <div className="flex flex-wrap gap-2 mt-6 justify-center lg:justify-start">
              {['🏖 Temporada', '🏠 Aluguel anual', '🔑 Compra', '📈 Investimento'].map((chip) => (
                <span key={chip} className="px-4 py-2 rounded-full border border-white/20 bg-white/8 text-white/80 text-sm backdrop-blur-sm hover:bg-white/15 transition-all cursor-pointer">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] max-w-[400px] lg:max-w-[480px] mx-auto lg:mr-0 h-[400px] lg:h-auto"
          >
            {/* Elegant chat window frame */}
            <div className="absolute inset-0 rounded-[40px] border border-white/20 bg-white shadow-2xl overflow-hidden z-10">
              <InteractiveChatBox forcedConvIndex={0} />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/20 rounded-3xl blur-2xl z-0" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl z-0" />
            
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 top-1/4 p-4 rounded-2xl glass shadow-xl z-20 hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-foreground">Curadoria IA</div>
                  <div className="text-[10px] text-muted-foreground">Match perfeito</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};