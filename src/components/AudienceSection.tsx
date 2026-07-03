import { Home, Umbrella, Key, TrendingUp, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { TypingText } from "@/components/ui/TypingText";

const audiences = [
  {
    icon: Umbrella,
    title: "Temporada",
    desc: "Turistas encontram casas e apartamentos para férias em Bombinhas, com apoio da nossa equipe local.",
  },
  {
    icon: Key,
    title: "Compra",
    desc: "Compradores exploram opções acompanhadas por imobiliárias parceiras, com atendimento humano em cada etapa.",
  },
  {
    icon: TrendingUp,
    title: "Investimento",
    desc: "Investidores recebem análise consultiva sobre bairros, perfis de imóvel e potencial de locação em Bombinhas.",
  },
];

const AudienceSection = () => {
  return (
    <section id="para-quem" className="section-padding bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>
      <div className="container-wide">
        <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-8 md:mb-10">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 mb-6"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <TypingText text="Bombinhas em foco" className="text-badge text-primary" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-h2"
            >
              Soluções reais para <br className="hidden md:block" />
              <span className="text-muted-foreground/80 italic font-serif">diferentes perfis.</span>
            </motion.h2>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-subtitle max-w-sm"
          >
            Centralizamos a inteligência local para entregar utilidade imediata.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {audiences.map((a, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              viewport={{ once: true }}
              className="group p-10 rounded-[32px] bg-white border border-border/50 hover:shadow-premium transition-all duration-700"
            >
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-10 shadow-sm border border-border group-hover:scale-105 transition-transform duration-700">
                <a.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-h3 mb-3">{a.title}</h3>
              <p className="text-body">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;