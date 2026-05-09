import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractiveChatBox } from "@/components/InteractiveChatBox";
import { TypingText } from "@/components/ui/TypingText";

export const HeroV2 = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Atmosphere & Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] mix-blend-multiply animate-pulse delay-1000" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="container-wide relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-12 lg:gap-20 items-center">
          
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full border border-primary/10 bg-primary/5 backdrop-blur-sm"
            >
              <div className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <TypingText text="Inteligência Imobiliária • Bombinhas" className="text-badge text-primary" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-display mb-8"
            >
              O jeito <span className="text-primary italic font-serif">premium</span> de<br />
              viver o paraíso.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-subtitle max-w-[540px] mb-12"
            >
              A MarIA simplifica sua busca por imóveis em Bombinhas. Sem filtros complexos, apenas conversa inteligente e curadoria personalizada.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="h-16 px-10 rounded-full bg-foreground text-white font-bold hover:bg-slate-800 transition-all duration-500 shadow-2xl shadow-slate-200 group"
                asChild
              >
                <a href="#casos-de-uso">
                  Começar descoberta
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-500" />
                </a>
              </Button>
              <div className="flex items-center gap-4 px-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-foreground leading-none mb-1">+500 buscas hoje</div>
                  
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] max-w-[400px] mx-auto lg:mr-0"
          >
            {/* Elegant chat window frame */}
            <div className="absolute inset-0 rounded-[40px] border border-white/40 bg-white/30 backdrop-blur-2xl shadow-premium overflow-hidden z-10">
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
