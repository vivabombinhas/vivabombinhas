import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    text: "Finalmente uma ferramenta que realmente entende o que eu procuro sem me encher de anúncios irrelevantes.",
    author: "Ricardo M.",
    role: "Buscando aluguel anual"
  },
  {
    text: "A MarIA me poupou horas de pesquisa. Em 5 minutos já estava falando com o proprietário do imóvel.",
    author: "Ana Julia S.",
    role: "Turista em Bombinhas"
  },
  {
    text: "A curadoria é impecável. É como ter um guia local especialista em imóveis na palma da mão.",
    author: "Gustavo P.",
    role: "Investidor imobiliário"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="section-padding bg-background relative overflow-hidden">
      <div className="container-wide relative z-10">
        <div className="flex flex-col items-center text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-8"
          >
            <Quote className="w-5 h-5 text-primary fill-primary" />
          </motion.div>
          <h2 className="text-h2 mb-6">
            Experiências que <span className="text-muted-foreground/80 italic font-serif">fazem a diferença.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-10 rounded-[40px] border border-border/50 bg-muted/20 hover:bg-white hover:shadow-premium transition-all duration-700 group"
            >
              <p className="text-body mb-10 font-medium italic leading-relaxed">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {t.author.charAt(0)}
                </div>
                <div className="text-left">
                   <h4 className="text-body font-bold text-foreground leading-none mb-1.5">{t.author}</h4>
                  <p className="text-badge leading-none">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { TestimonialsSection };