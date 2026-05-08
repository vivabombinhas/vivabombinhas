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
    <section id="para-quem" className="py-24 bg-white">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-baseline gap-4 mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950">
            Foco total em <span className="text-blue-600 italic">Bombinhas.</span>
          </h2>
          <div className="h-px flex-1 bg-slate-100 hidden md:block" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Utilidade real</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {audiences.map((a, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-[32px] bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <a.icon className="h-5 w-5 text-slate-950" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-2 tracking-tight transition-colors">
                {a.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium transition-colors">
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