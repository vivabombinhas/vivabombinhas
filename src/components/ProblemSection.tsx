import { LayoutGrid, Users, Copy, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { TypingText } from "@/components/ui/TypingText";

const problems = [
  { 
    icon: LayoutGrid, 
    title: "Pulverização", 
    desc: "Anúncios espalhados por dezenas de sites e grupos dificultam a comparação real." 
  },
  { 
    icon: Users, 
    title: "Desorganização", 
    desc: "Informações duplicadas e fotos que muitas vezes não refletem o estado atual." 
  },
  { 
    icon: Copy, 
    title: "Invisibilidade", 
    desc: "As melhores oportunidades locais nem sempre chegam aos grandes portais nacionais." 
  },
  { 
    icon: EyeOff, 
    title: "Perda de Tempo", 
    desc: "Falar com múltiplos anunciantes consome dias preciosos das suas férias ou trabalho." 
  },
];

const ProblemSection = () => {
  return (
    <section className="section-padding bg-background relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      <div className="container-wide">
        
        <div className="max-w-4xl mb-10 md:mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 mb-8"
          >
            <AlertCircle className="h-4 w-4 text-primary" />
            <TypingText text="O cenário atual" className="text-badge text-primary" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-h2"
          >
            Buscar um imóvel em Bombinhas <br className="hidden lg:block" />
            não precisa ser <span className="text-muted-foreground/40 italic font-serif">exaustivo.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {problems.map((p, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              viewport={{ once: true }}
              className="group p-8 md:p-10 rounded-[32px] border border-border/50 bg-white hover:border-primary/20 hover:shadow-premium transition-all duration-700"
            >
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-700">
                <p.icon className="h-5 w-5 transition-colors duration-700" />
              </div>
              <h3 className="text-h3 mb-4">{p.title}</h3>
              <p className="text-body">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;