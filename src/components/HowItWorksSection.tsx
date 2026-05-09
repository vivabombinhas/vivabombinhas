import { MessageSquare, LayoutGrid, ExternalLink, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { TypingText } from "@/components/ui/TypingText";

const steps = [
  {
    icon: MessageSquare,
    num: "01",
    title: "Converse com a MarIA",
    desc: "Diga o que você busca usando linguagem natural, como se falasse com um amigo local.",
  },
  {
    icon: LayoutGrid,
    num: "02",
    title: "Curadoria Inteligente",
    desc: "Nossa IA organiza centenas de anúncios e entrega apenas o que realmente faz sentido para você.",
  },
  {
    icon: ExternalLink,
    num: "03",
    title: "Conexão Direta",
    desc: "Conectamos você diretamente à página original ou ao anunciante para fechar o negócio.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="section-padding bg-muted/20 relative overflow-hidden">
      <div className="container-wide relative z-10">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-badge text-primary">Simplicidade</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-h2 mb-6"
          >
            Três passos para encontrar seu <br className="hidden md:block" />
            <span className="text-muted-foreground/40 italic font-serif">lugar no paraíso.</span>
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="relative p-10 md:p-12 rounded-[40px] bg-background border border-border/40 group hover:shadow-premium transition-all duration-700 overflow-hidden"
            >
              <div className="absolute -top-4 -right-4 text-8xl font-bold text-muted/50 opacity-20 group-hover:opacity-10 transition-opacity duration-700">
                {s.num}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-10 group-hover:bg-primary group-hover:text-white transition-all duration-700">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="text-h3 mb-5">{s.title}</h3>
              <p className="text-body">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;