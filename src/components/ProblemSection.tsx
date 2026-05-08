import { LayoutGrid, Users, Copy, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const problems = [
  { 
    icon: LayoutGrid, 
    title: "Pulverização", 
    desc: "Dezenas de sites e grupos para encontrar uma única informação real." 
  },
  { 
    icon: Users, 
    title: "Desorganização", 
    desc: "Anúncios duplicados, preços conflitantes e fotos amadoras." 
  },
  { 
    icon: Copy, 
    title: "Invisibilidade", 
    desc: "As melhores oportunidades raramente chegam aos grandes portais." 
  },
  { 
    icon: EyeOff, 
    title: "Lentidão", 
    desc: "Falar com cada anunciante e esperar retorno consome dias de busca." 
  },
];

const ProblemSection = () => {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        
        <div className="flex flex-col lg:flex-row items-end justify-between gap-10 mb-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">
              <AlertCircle className="h-3 w-3" />
              O cenário imobiliário
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-950 leading-[1.1]">
              Encontrar o imóvel ideal em Bombinhas virou <span className="text-primary italic">um caos.</span>
            </h2>
          </div>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-md leading-relaxed">
            A busca manual é fragmentada, lenta e cheia de informações desatualizadas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((p, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-[32px] border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-200 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <p.icon className="h-5 w-5 text-slate-900" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-3 tracking-tight">{p.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;