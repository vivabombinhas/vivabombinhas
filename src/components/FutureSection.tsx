import { UtensilsCrossed, Palmtree, Wrench, Rocket, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { icon: UtensilsCrossed, label: "Gastronomia" },
  { icon: Palmtree, label: "Experiências" },
  { icon: Wrench, label: "Service Concierge" },
  { icon: Rocket, label: "Market Intel" },
];

const FutureSection = () => {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="container px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[48px] bg-slate-900 p-12 md:p-24 text-center max-w-5xl mx-auto relative overflow-hidden shadow-2xl"
        >
          {/* Subtle Glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
          
          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-8"
            >
              <Sparkles className="h-4 w-4" />
              Visão de Futuro
            </motion.div>
            
            <h2 className="text-4xl md:text-7xl font-bold mb-8 text-white tracking-tight leading-[1.05]">
              Muito além do <br />
              <span className="text-primary italic">setor imobiliário.</span>
            </h2>
            
            <p className="text-slate-400 text-lg md:text-2xl mb-16 max-w-2xl mx-auto font-light leading-relaxed">
              A MarIA está evoluindo para se tornar o sistema operacional de Bombinhas, integrando todo o ecossistema local em uma única interface inteligente.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              {items.map((it, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-3.5 text-sm font-bold text-white/90 hover:bg-white/10 transition-colors"
                >
                  <it.icon className="h-4 w-4 text-primary" />
                  {it.label}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FutureSection;