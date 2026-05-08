import { Home, Umbrella, Key, Search } from "lucide-react";
import { motion } from "framer-motion";

const audiences = [
  {
    icon: Home,
    title: "Aluguel Anual",
    desc: "Encontre sua nova moradia permanente ou profissional em Bombinhas.",
  },
  {
    icon: Umbrella,
    title: "Temporada",
    desc: "A casa ou apartamento ideal para suas próximas férias na praia.",
  },
  {
    icon: Key,
    title: "Compra",
    desc: "Explore opções residenciais ou comerciais para adquirir na região.",
  },
  {
    icon: Search,
    title: "Descoberta",
    desc: "Para quem quer explorar o mercado local e entender as opções disponíveis.",
  },
];

const AudienceSection = () => {
  return (
    <section id="para-quem" className="py-32 bg-white">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-baseline gap-6 mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-slate-950"
          >
            Foco em <span className="text-blue-600 italic font-medium">Bombinhas.</span>
          </motion.h2>
          <div className="h-px flex-1 bg-slate-100 hidden md:block" />
          <motion.p 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[11px]"
          >
            Utilidade Real
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((a, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              viewport={{ once: true }}
              className="group p-10 rounded-[40px] bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-700"
            >
              <div className="w-14 h-14 rounded-[18px] bg-white flex items-center justify-center mb-10 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-700">
                <a.icon className="h-6 w-6 text-slate-950" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3 tracking-tight">
                {a.title}
              </h3>
              <p className="text-slate-500 text-[15px] leading-relaxed font-medium">
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