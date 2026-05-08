import { LayoutGrid, Users, Copy, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const problems = [
  { 
    icon: LayoutGrid, 
    title: "Fragmentação do Mercado", 
    desc: "Imóveis exclusivos diluídos em centenas de portais genéricos e desatualizados." 
  },
  { 
    icon: Users, 
    title: "Ruído Digital", 
    desc: "Grupos desorganizados e informações imprecisas que dificultam a tomada de decisão." 
  },
  { 
    icon: Copy, 
    title: "Inconsistência de Dados", 
    desc: "O mesmo imóvel anunciado com diferentes preços e condições em diversos canais." 
  },
  { 
    icon: EyeOff, 
    title: "Acesso Restrito", 
    desc: "As melhores oportunidades de investimento nem sequer chegam ao mercado aberto." 
  },
];

const ProblemSection = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-slate-50/50">
      <div className="container relative z-10">
        {/* Header Section */}
        <div className="text-center mb-24 max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-8"
          >
            <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
            O Cenário Atual
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-bold mb-10 tracking-tight leading-[1.05] text-slate-900"
          >
            Encontrar o imóvel ideal em <br />
            <span className="text-primary italic">Bombinhas</span> tornou-se um <span className="text-gradient">labirinto.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-xl md:text-2xl font-light leading-relaxed max-w-2xl mx-auto"
          >
            A escassez de dados confiáveis e a fragmentação das informações impedem que você encontre o que realmente busca.
          </motion.p>
        </div>

        {/* Problem Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-24 relative">
          {problems.map((p, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-[32px] border border-slate-200/60 bg-white p-10 hover:border-primary/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] transition-all duration-500 flex flex-col items-start text-left"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:bg-primary/5 transition-colors">
                <p.icon className="h-7 w-7 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">{p.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium text-[15px]">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Transition to Solution */}
        <div className="text-center flex flex-col items-center max-w-lg mx-auto">
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-400 text-lg md:text-xl font-medium italic mb-8"
          >
            A MarIA foi criada para redefinir esse padrão.
          </motion.p>
          <div className="w-px h-24 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent"></div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;