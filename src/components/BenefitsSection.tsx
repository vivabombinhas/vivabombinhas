import { Zap, Link2, LayoutList, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  { icon: Zap, title: "Velocidade", desc: "Encontre em segundos o que levaria horas pesquisando manualmente.", stat: "10x", label: "mais rápido" },
  { icon: LayoutList, title: "Organização", desc: "Todos os anúncios centralizados e padronizados para você.", stat: "100%", label: "foco local" },
  { icon: Link2, title: "Transparência", desc: "Acesse o link original e fale direto com o anunciante.", stat: "0", label: "intermediários" },
  { icon: MessageCircle, title: "Simplicidade", desc: "Busque imóveis como se estivesse enviando um WhatsApp.", stat: "24/7", label: "disponível" },
];

const BenefitsSection = () => {
  return (
    <section className="py-32 bg-muted/50 relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-3xl mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-h2 mb-8"
          >
            A busca imobiliária,<br /><span className="text-muted-foreground/60 italic font-medium">totalmente simplificada.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-subtitle"
          >
            Menos tempo procurando. Mais tempo visitando e aproveitando Bombinhas.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {benefits.map((b, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              viewport={{ once: true }}
              className="p-10 md:p-12 rounded-[40px] border border-border bg-background flex flex-col md:flex-row items-center gap-10 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-700 group"
            >
              <div className="w-20 h-20 rounded-[24px] bg-muted flex items-center justify-center shrink-0 border border-border group-hover:bg-foreground group-hover:scale-105 transition-all duration-700">
                <b.icon className="h-8 w-8 text-foreground group-hover:text-white transition-colors duration-700" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-h3 mb-3">{b.title}</h3>
                <p className="text-body">{b.desc}</p>
              </div>
              <div className="text-center shrink-0 min-w-[120px] pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-border md:pl-10">
                <div className="text-h3 mb-1 tabular-nums">{b.stat}</div>
                <div className="text-badge">{b.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;