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
    <section id="como-funciona" className="py-32 bg-muted/30 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.02),transparent_70%)]" />

      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-3xl mb-24">
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-badge text-primary mb-6"
          >
            Processo Inteligente
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-h2"
          >
            Três passos para encontrar seu <br className="hidden md:block" />
            <span className="text-muted-foreground/60 italic font-medium">lugar no paraíso.</span>
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {steps.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="relative p-10 md:p-12 rounded-[40px] bg-background border border-border group hover:shadow-[0_40px_80px_-30px_rgba(0,0,0,0.08)] transition-all duration-700"
            >
              <div className="absolute top-8 right-12 text-6xl font-black text-slate-50 group-hover:text-primary/5 transition-colors duration-700">
                {s.num}
              </div>
              <div className="w-16 h-16 rounded-[22px] bg-muted flex items-center justify-center mb-10 shadow-sm group-hover:bg-primary group-hover:scale-110 transition-all duration-700">
                <s.icon className="h-7 w-7 text-foreground group-hover:text-white transition-colors duration-700" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-5 tracking-tight">{s.title}</h3>
              <p className="text-muted-foreground text-[15px] leading-relaxed font-medium">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;