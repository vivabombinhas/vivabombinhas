import { MessageSquare, LayoutGrid, UserCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: MessageSquare,
    num: "01",
    title: "Consulta Inteligente",
    desc: "Descreva seu estilo de vida e preferências. Nossa IA entende contexto, não apenas palavras-chave.",
  },
  {
    icon: LayoutGrid,
    num: "02",
    title: "Curadoria de Ativos",
    desc: "Filtramos centenas de propriedades para entregar apenas o que possui real potencial e liquidez.",
  },
  {
    icon: UserCheck,
    num: "03",
    title: "Execução Especializada",
    desc: "Conexão imediata com um corretor concierge pronto para operacionalizar sua aquisição.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-24 md:py-32 relative overflow-hidden">
      <div className="container relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-4"
          >
            <Sparkles className="h-3.5 w-3.5" />
            O Processo MarIA
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-slate-900"
          >
            Três etapas para o seu <br />
            <span className="text-gradient italic">próximo investimento.</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-slate-100 -z-10" />
          
          {steps.map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative group flex flex-col items-center text-center px-6"
            >
              <div className="w-20 h-20 rounded-[24px] bg-white border border-slate-100 shadow-xl shadow-slate-100/50 flex items-center justify-center mb-8 group-hover:border-primary/20 transition-all duration-500 group-hover:-translate-y-1">
                <s.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute top-0 right-1/2 translate-x-[60px] text-[60px] font-black text-slate-50 -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                {s.num}
              </div>
              <h3 className="font-bold text-xl mb-4 text-slate-900 tracking-tight">{s.title}</h3>
              <p className="text-[15px] text-slate-500 leading-relaxed font-medium">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;