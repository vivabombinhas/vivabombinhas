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
    <section className="py-32 bg-slate-50/50 relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-3xl mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-slate-950 mb-8 leading-[1.05]"
          >
            A busca imobiliária,<br /><span className="text-slate-400 italic font-medium">totalmente simplificada.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed"
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
              className="p-10 md:p-12 rounded-[40px] border border-slate-100 bg-white flex flex-col md:flex-row items-center gap-10 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-700 group"
            >
              <div className="w-20 h-20 rounded-[24px] bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-slate-950 group-hover:scale-105 transition-all duration-700">
                <b.icon className="h-8 w-8 text-slate-950 group-hover:text-white transition-colors duration-700" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-slate-950 mb-3 tracking-tight">{b.title}</h3>
                <p className="text-slate-500 text-[15px] leading-relaxed font-medium">{b.desc}</p>
              </div>
              <div className="text-center shrink-0 min-w-[120px] pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-10">
                <div className="text-4xl font-extrabold text-slate-950 tracking-tighter mb-1 tabular-nums">{b.stat}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{b.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;