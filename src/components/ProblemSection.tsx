import { LayoutGrid, Users, Copy, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const problems = [
  { 
    icon: LayoutGrid, 
    title: "Pulverização", 
    desc: "Anúncios espalhados por dezenas de sites e grupos dificultam a comparação." 
  },
  { 
    icon: Users, 
    title: "Desorganização", 
    desc: "Informações duplicadas e fotos que não mostram a realidade do imóvel." 
  },
  { 
    icon: Copy, 
    title: "Invisibilidade", 
    desc: "As melhores oportunidades locais muitas vezes não chegam aos grandes portais." 
  },
  { 
    icon: EyeOff, 
    title: "Perda de Tempo", 
    desc: "Falar com múltiplos anunciantes e aguardar retornos consome dias preciosos." 
  },
];

const ProblemSection = () => {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12 mb-24">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em] mb-8"
            >
              <AlertCircle className="h-4 w-4 text-blue-600" />
              O cenário atual
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-slate-950 leading-[1.05]"
            >
              Buscar um imóvel em Bombinhas <br className="hidden lg:block" />
              não precisa ser <span className="text-slate-400 italic font-medium">um desafio.</span>
            </motion.h2>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg md:text-xl font-medium max-w-md leading-relaxed lg:pt-16"
          >
            Centralizamos o mercado local para que você encontre o que busca com clareza e agilidade.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((p, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              viewport={{ once: true }}
              className="group p-10 rounded-[40px] border border-slate-100 bg-white hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-700"
            >
              <div className="w-14 h-14 rounded-[22px] bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 group-hover:bg-slate-950 group-hover:scale-110 transition-all duration-700">
                <p.icon className="h-6 w-6 text-slate-900 group-hover:text-white transition-colors duration-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-4 tracking-tight">{p.title}</h3>
              <p className="text-slate-500 text-[15px] leading-relaxed font-medium">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;