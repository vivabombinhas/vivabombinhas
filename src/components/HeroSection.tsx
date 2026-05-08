import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { InteractiveChatBox } from "./InteractiveChatBox";
import { motion } from "framer-motion";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate("/maria");
  };

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* Premium Background with sophisticated overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=2500&auto=format&fit=crop" 
          alt="Bombinhas Aerial View" 
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,white_80%)] md:bg-[radial-gradient(circle_at_20%_center,transparent_0%,white_70%)] opacity-90" />
      </div>

      <div className="container relative z-10 px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Text Content */}
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 rounded-full bg-blue-50/80 backdrop-blur-sm px-5 py-2 text-sm font-bold text-primary mb-10 border border-blue-100/50 shadow-sm"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              CURADORIA INTELIGENTE DE ALTO PADRÃO
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl lg:text-[92px] font-bold tracking-tight text-slate-900 mb-10 leading-[0.95] drop-shadow-sm"
            >
              A nova era da <br />
              <span className="text-primary italic">curadoria imobiliária</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-600 mb-14 leading-relaxed max-w-xl font-light"
            >
              Esqueça a busca exaustiva. A MarIA encontra imóveis de milhões em Bombinhas que realmente combinam com seu estilo de vida.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-5"
            >
              <Button 
                onClick={handleStartChat}
                size="lg" 
                className="h-16 px-10 gap-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xl shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Conversar com a MarIA
                <ArrowRight className="h-6 w-6" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="h-16 px-10 rounded-2xl border-slate-200/60 bg-white/50 backdrop-blur-sm text-slate-600 font-bold text-xl hover:bg-white transition-all hover:scale-[1.02]"
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Como funciona
              </Button>
            </motion.div>

            {/* Premium Trust Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-20 flex items-center gap-12 text-slate-400"
            >
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-slate-900 tracking-tighter italic">40+</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Imobiliárias parceiras</span>
              </div>
              <div className="w-px h-12 bg-slate-200/60" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-slate-900 tracking-tighter italic">1.5k+</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Imóveis em curadoria</span>
              </div>
              <div className="w-px h-12 bg-slate-200/60" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-slate-900 tracking-tighter italic">100%</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Exclusivo Bombinhas</span>
              </div>
            </motion.div>
          </div>

          {/* Interactive Chat Box Container */}
          <div className="relative lg:block hidden">
            <InteractiveChatBox />
            
            {/* Elegant glass decorative elements */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -z-10" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-[100px] -z-10" />
          </div>
        </div>
      </div>
      
      {/* Mobile Chat Preview Overlay */}
      <div className="lg:hidden w-full px-4 mt-12">
        <InteractiveChatBox />
      </div>
    </section>
  );
};

export default HeroSection;