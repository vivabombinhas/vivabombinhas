import { Home, Umbrella, Key, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const audiences = [
  {
    icon: Home,
    title: "Aluguel Anual",
    desc: "Para quem busca moradia permanente ou profissional em Bombinhas.",
  },
  {
    icon: Umbrella,
    title: "Temporada",
    desc: "Encontre a casa ideal para férias, feriados ou curtas estadias.",
  },
  {
    icon: Key,
    title: "Compra",
    desc: "Aquisição de imóveis residenciais ou comerciais na região.",
  },
  {
    icon: TrendingUp,
    title: "Investimento",
    desc: "Identifique as melhores taxas de retorno e valorização imobiliária.",
  },
];

const AudienceSection = () => {
  return (
    <section id="para-quem" className="py-24 bg-white">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-baseline gap-4 mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950">
            Inteligência para <span className="text-primary italic">todos.</span>
          </h2>
          <div className="h-px flex-1 bg-slate-100 hidden md:block" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Para quem é a MarIA</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {audiences.map((a, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-[32px] bg-slate-50 hover:bg-slate-950 transition-all duration-500 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                <a.icon className="h-5 w-5 text-slate-950" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 group-hover:text-white mb-2 tracking-tight transition-colors">
                {a.title}
              </h3>
              <p className="text-slate-500 group-hover:text-white/40 text-sm leading-relaxed font-medium transition-colors">
                {a.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;