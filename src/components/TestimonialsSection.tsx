import { motion } from "framer-motion";

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
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col items-center text-center mb-20">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.4em] mb-6">Social Proof</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-foreground mb-6">
            O que dizem sobre a <span className="text-muted-foreground/60">MarIA</span>
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
              className="p-10 rounded-[40px] border border-border bg-muted/30 hover:bg-background hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-700 group"
            >
              <p className="text-muted-foreground text-[15px] leading-relaxed font-medium mb-10 italic">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                  {t.author.charAt(0)}
                </div>
                <div className="text-left">
                  <h4 className="text-[13px] font-bold text-foreground leading-none mb-1.5">{t.author}</h4>
                  <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider leading-none">{t.role}</p>
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