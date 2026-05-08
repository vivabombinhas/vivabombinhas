import { MessageSquare, LayoutGrid, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: MessageSquare,
    num: "01",
    title: "Converse com a MarIA",
    desc: "Diga o que você busca usando linguagem natural, como se falasse com um amigo local.",
  },
  {
    icon: LayoutGrid,
    num: "02",
    title: "Curadoria Instantânea",
    desc: "Nossa IA organiza centenas de anúncios e entrega apenas o que realmente faz sentido para você.",
  },
  {
    icon: ExternalLink,
    num: "03",
    title: "Acesse o Anúncio Real",
    desc: "Conectamos você diretamente à página original do imóvel para falar com o anunciante.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-24 bg-white relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mb-20">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em] mb-4">Como funciona</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950">
            Três passos. <span className="text-slate-400">Sem complicação.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative p-10 rounded-[32px] bg-slate-50/50 border border-slate-100 group hover:bg-white hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500"
            >
              <div className="absolute top-6 right-10 text-4xl font-black text-slate-100/50 group-hover:text-blue-500/5 transition-colors">
                {s.num}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <s.icon className="h-6 w-6 text-slate-900" />
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