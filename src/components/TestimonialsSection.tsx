import { Star, Quote, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Ricardo Mendes",
    role: "Investidor Imobiliário",
    text: "A curadoria da MarIA é impecável. Identificou ativos em Bombinhas com taxas de retorno que eu levaria semanas para calcular manualmente.",
    avatar: "RM"
  },
  {
    name: "Dr. Ana Cláudia",
    role: "Proprietária Residencial",
    text: "Buscava exclusividade e privacidade. A MarIA entendeu o contexto e me apresentou opções off-market que superaram todas as expectativas.",
    avatar: "AC"
  },
  {
    name: "Boutique Litoral",
    role: "Gestora de Ativos",
    text: "A integração da IA no nosso fluxo de captação de leads transformou nossa conversão. É a ferramenta mais avançada do litoral catarinense.",
    avatar: "BL"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 md:py-32 bg-slate-50/50">
      <div className="container px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-4"
          >
            <ShieldCheck className="h-4 w-4" />
            Experiências Reais
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900"
          >
            A opinião de quem <br />
            <span className="text-gradient italic">lidera o mercado.</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 relative"
            >
              <Quote className="absolute top-8 right-8 h-10 w-10 text-primary/5" />
              <div className="flex gap-1.5 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary opacity-80" />)}
              </div>
              <p className="text-slate-600 mb-8 font-medium leading-relaxed italic text-lg">"{t.text}"</p>
              <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-[10px] tracking-widest shadow-lg shadow-slate-200">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base tracking-tight">{t.name}</h4>
                  <p className="text-[11px] font-bold text-primary uppercase tracking-widest mt-0.5">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};