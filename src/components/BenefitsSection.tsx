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
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-2xl mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950 mb-6">
            A busca imobiliária,<br /><span className="text-blue-600 italic">simplificada.</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed">
            Menos tempo procurando. Mais tempo visitando e aproveitando Bombinhas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-10 rounded-[32px] border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center gap-8 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-500 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                <b.icon className="h-6 w-6 text-slate-900" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-slate-950 mb-2 tracking-tight">{b.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{b.desc}</p>
              </div>
              <div className="text-center shrink-0 min-w-[100px]">
                <div className="text-3xl font-bold text-slate-950 tracking-tight">{b.stat}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{b.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;