import { Zap, Link2, LayoutList, MessageCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { TypingText } from "@/components/ui/TypingText";

const benefits = [
  { icon: Zap, title: "Agilidade", desc: "A IA filtra e organiza opções em segundos, reduzindo o tempo de pesquisa.", stat: "10x", label: "mais rápido" },
  { icon: LayoutList, title: "Curadoria local", desc: "Imóveis acompanhados por parceiros locais em Bombinhas, organizados pela nossa equipe.", stat: "100%", label: "foco local" },
  { icon: Link2, title: "Transparência", desc: "Preço, fotos, bairro e responsável pelo imóvel visíveis antes do primeiro contato.", stat: "Sem", label: "surpresas" },
  { icon: MessageCircle, title: "Atendimento humano", desc: "Para leads quentes, visitas, calls e negociação, um especialista local entra no atendimento.", stat: "IA + humano", label: "no mesmo fluxo" },
];

const BenefitsSection = () => {
  return (
    <section className="section-padding bg-muted/20 relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="container-wide relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-12 lg:gap-16 items-start">
          
          <div className="sticky top-0 lg:top-32 w-full z-20 bg-background/90 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none py-10 lg:py-0 -mx-6 px-6 lg:mx-0 lg:px-0 mb-4 lg:mb-0">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <Star className="h-4 w-4 text-primary fill-primary" />
              <TypingText text="Vantagem MarIA" className="text-badge text-primary" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-h2 mb-10"
            >
              A busca imobiliária,<br /><span className="text-muted-foreground/80 italic font-serif">totalmente simplificada.</span>
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