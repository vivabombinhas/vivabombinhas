import { Zap, Link2, LayoutList, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  { icon: Zap, title: "Velocidade", desc: "Encontre em segundos o que levaria horas pesquisando manualmente.", stat: "10x", label: "mais rápido" },
  { icon: LayoutList, title: "Precisão", desc: "Filtros inteligentes que entendem o seu contexto real.", stat: "100%", label: "alinhado" },
  { icon: Link2, title: "Transparência", desc: "Acesse o anúncio original e fale direto com o anunciante.", stat: "0", label: "intermediários" },
  { icon: MessageCircle, title: "Linguagem", desc: "Fale como se estivesse conversando com um amigo local.", stat: "∞", label: "possibilidades" },
];

const BenefitsSection = () => {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Visual Depth */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            A tecnologia <span className="text-primary italic">a seu favor.</span>
          </h2>
          <p className="text-white/40 text-lg font-medium leading-relaxed">
            Mais que uma busca, uma experiência completa de curadoria imobiliária.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-10 rounded-[40px] border border-white/5 bg-white/[0.02] backdrop-blur-sm flex flex-col md:flex-row items-center gap-8 hover:bg-white/[0.05] transition-all duration-500 group"
            >
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{b.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed font-medium">{b.desc}</p>
              </div>
              <div className="text-center shrink-0 min-w-[100px]">
                <div className="text-3xl font-bold text-white tracking-tighter">{b.stat}</div>
                <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{b.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;