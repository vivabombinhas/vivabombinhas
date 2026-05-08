import { Zap, Link2, LayoutList, MessageCircle, Star } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  { 
    icon: Zap, 
    title: "Eficiência Operacional", 
    desc: "Redução drástica no tempo de pesquisa e triagem de propriedades.", 
    stat: "10x", 
    statLabel: "Agilidade" 
  },
  { 
    icon: LayoutList, 
    title: "Inteligência de Dados", 
    desc: "Análise profunda de mercado para identificar ativos com real potencial de valorização.", 
    stat: "100%", 
    statLabel: "Curadoria" 
  },
  { 
    icon: Link2, 
    title: "Transparência Total", 
    desc: "Acesso direto à origem da informação, eliminando ruídos e intermediários desnecessários.", 
    stat: "0", 
    statLabel: "Conflitos" 
  },
  { 
    icon: MessageCircle, 
    title: "Interface Intuitiva", 
    desc: "A tecnologia mais avançada de IA servida através de uma conversa simples e fluida.", 
    stat: "24/7", 
    statLabel: "Disponibilidade" 
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-slate-50/50">
      <div className="container relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-4"
          >
            <Star className="h-3.5 w-3.5" />
            Diferenciais Competitivos
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-slate-900"
          >
            Por que confiar na <span className="text-gradient italic">MarIA?</span>
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {benefits.map((b, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-[32px] border border-slate-200/60 bg-white p-10 hover:border-primary/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] transition-all duration-500"
            >
              <div className="flex items-center gap-6 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-auto text-right">
                  <div className="text-3xl font-bold text-slate-900 italic tracking-tighter leading-none">{b.stat}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-1">{b.statLabel}</div>
                </div>
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-4 tracking-tight leading-tight">{b.title}</h3>
              <p className="text-[15px] text-slate-500 leading-relaxed font-medium">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;