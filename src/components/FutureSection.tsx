import { UtensilsCrossed, Palmtree, Wrench, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { icon: UtensilsCrossed, label: "Gastronomia" },
  { icon: Palmtree, label: "Turismo" },
  { icon: Wrench, label: "Serviços" },
  { icon: Sparkles, label: "Eventos" },
];

const FutureSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="relative rounded-[48px] bg-muted border border-border p-12 md:p-24 overflow-hidden flex flex-col items-center text-center">
          
          <div className="relative z-10 max-w-3xl">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-6">Em breve</p>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]">
              A inteligência de Bombinhas<br /><span className="text-muted-foreground/60">além dos imóveis.</span>
            </h2>
            <p className="text-muted-foreground text-lg font-medium mb-12 leading-relaxed">
              MarIA está evoluindo para se tornar sua assistente completa na cidade, ajudando você a descobrir o melhor de Bombinhas em todos os setores.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {items.map((it, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 bg-background border border-border rounded-2xl px-6 py-4 text-sm font-bold text-foreground shadow-sm"
                >
                  <it.icon className="h-4 w-4 text-primary" />
                  {it.label}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FutureSection;