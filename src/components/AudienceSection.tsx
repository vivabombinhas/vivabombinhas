import { Home, Umbrella, Key, TrendingUp, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const audiences = [
  {
    icon: Home,
    title: "Residencial Anual",
    desc: "Curadoria para quem busca estabelecer residência fixa com máxima qualidade de vida em Bombinhas.",
    color: "bg-blue-500",
  },
  {
    icon: Umbrella,
    title: "Vacation Homes",
    desc: "As melhores propriedades para temporada, selecionadas por localização e infraestrutura premium.",
    color: "bg-slate-900",
  },
  {
    icon: Key,
    title: "Aquisição de Ativos",
    desc: "Apoio estratégico para a compra de imóveis, focando em segurança jurídica e valorização.",
    color: "bg-primary",
  },
  {
    icon: TrendingUp,
    title: "Capital & Investimento",
    desc: "Identificação de oportunidades off-market com alta rentabilidade e projeção de crescimento.",
    color: "bg-accent",
  },
];

const AudienceSection = () => {
  return (
    <section id="para-quem" className="py-24 md:py-32 bg-white">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-4"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Segmentos de Atuação
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-slate-900"
          >
            Soluções sob medida para <br />
            <span className="text-gradient italic">cada objetivo.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg font-medium"
          >
            Seja para morar ou investir, a MarIA aplica inteligência de dados para garantir a melhor escolha.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {audiences.map((a, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-[32px] border border-slate-100 bg-white p-8 hover:border-primary/20 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 cursor-pointer"
            >
              <div className="flex items-start gap-6">
                <div className={`w-14 h-14 rounded-2xl ${a.color} flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10`}>
                  <a.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-xl text-slate-900 tracking-tight">{a.title}</h3>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-[15px] text-slate-500 leading-relaxed font-medium">{a.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;