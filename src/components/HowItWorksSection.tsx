import { MessageSquare, LayoutGrid, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: MessageSquare,
    num: "01",
    title: "Converse com a MarIA",
    desc: "Diga o que você busca usando linguagem natural, como se falasse com um amigo.",
  },
  {
    icon: LayoutGrid,
    num: "02",
    title: "Receba a Curadoria",
    desc: "Nossa IA filtra centenas de opções e entrega apenas o que realmente faz sentido.",
  },
  {
    icon: UserCheck,
    num: "03",
    title: "Fale com Especialistas",
    desc: "O corretor responsável recebe seu interesse e te chama direto no WhatsApp.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4">Metodologia</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950">
            Três passos. <span className="text-slate-400">Zero complicação.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative p-10 rounded-[40px] bg-white border border-slate-100 shadow-sm group hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500"
            >
              <div className="absolute top-6 right-10 text-4xl font-black text-slate-50 group-hover:text-primary/5 transition-colors">
                {s.num}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3 tracking-tight">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;