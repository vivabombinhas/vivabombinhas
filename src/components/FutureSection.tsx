import { UtensilsCrossed, Palmtree, Wrench, Sparkles, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { TypingText } from "@/components/ui/TypingText";

const items = [
  { icon: UtensilsCrossed, label: "Gastronomia" },
  { icon: Palmtree, label: "Turismo" },
  { icon: Wrench, label: "Serviços" },
  { icon: Sparkles, label: "Eventos" },
];

const FutureSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        <div className="relative rounded-[56px] bg-muted/30 border border-border/40 p-12 md:p-24 overflow-hidden flex flex-col items-center text-center">
          
          <div className="relative z-10 max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <Rocket className="h-4 w-4 text-primary" />
              <TypingText text="Próximos passos" className="text-badge text-primary" />
            </motion.div>
            <h2 className="text-h2 mb-8">
              A inteligência de Bombinhas<br /><span className="text-muted-foreground/40 italic font-serif">além dos imóveis.</span>
            </h2>
            <p className="text-subtitle mb-12">
              A MarIA está evoluindo para se tornar sua assistente completa na cidade, conectando você ao que há de melhor em cada setor de Bombinhas.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {items.map((it, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 bg-white border border-border/50 rounded-2xl px-8 py-5 text-sm font-bold text-foreground shadow-sm hover:shadow-premium transition-all duration-500"
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