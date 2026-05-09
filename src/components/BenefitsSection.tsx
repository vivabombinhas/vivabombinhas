import { Zap, Link2, LayoutList, MessageCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { TypingText } from "@/components/ui/TypingText";

const benefits = [
  { icon: Zap, title: "Velocidade", desc: "Encontre em segundos o que levaria horas pesquisando manualmente.", stat: "10x", label: "mais rápido" },
  { icon: LayoutList, title: "Curadoria", desc: "Anúncios centralizados e filtrados pela nossa inteligência local.", stat: "100%", label: "foco local" },
  { icon: Link2, title: "Direto", desc: "Acesse o link original e fale sem intermediários desnecessários.", stat: "0", label: "taxas extras" },
  { icon: MessageCircle, title: "Fluidez", desc: "Busque imóveis como se estivesse conversando com um amigo.", stat: "24/7", label: "ativo" },
];

const BenefitsSection = () => {
  return (
    <section className="section-padding bg-muted/20 relative overflow-hidden">
      <div className="container-wide relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
          
          <div className="lg:sticky lg:top-32 max-w-xl">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span className="text-badge text-primary">Vantagem MarIA</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-h2 mb-10"
            >
              A busca imobiliária,<br /><span className="text-muted-foreground/40 italic font-serif">totalmente simplificada.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-subtitle"
            >
              Menos tempo procurando. Mais tempo visitando e aproveitando o melhor de Bombinhas.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-6 flex-1 w-full">
            {benefits.map((b, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.7 }}
                viewport={{ once: true }}
                className="p-8 md:p-10 rounded-[32px] border border-border/40 bg-white flex flex-col md:flex-row items-center gap-10 hover:shadow-premium transition-all duration-700 group w-full"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-700">
                  <b.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-h3 mb-2">{b.title}</h3>
                  <p className="text-body max-w-md">{b.desc}</p>
                </div>
                <div className="text-center shrink-0 min-w-[120px] pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-border/50 md:pl-10">
                  <div className="text-h2 text-foreground mb-1 tabular-nums tracking-tighter">{b.stat}</div>
                  <div className="text-badge">{b.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;