import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";
import { openMariaWhatsapp } from "@/lib/maria-whatsapp";

const CTASection = () => {
  const [query, setQuery] = useState("");

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    openMariaWhatsapp(trimmed ? `Oi MarIA, ${trimmed}` : "geral");
  };

  return (
    <section className="section-padding relative overflow-hidden bg-muted/20 border-t border-border/40">
      {/* Decorative Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.05),transparent_70%)] pointer-events-none" />
      
      <div className="container-wide relative z-10">
        <div className="flex flex-col items-center text-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-20 h-20 rounded-[32px] bg-foreground flex items-center justify-center mb-12 shadow-2xl shadow-slate-200 group"
          >
            <Sparkles className="h-8 w-8 text-white group-hover:rotate-12 transition-transform duration-700" />
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-display mb-10"
          >
            Pronto para explorar<br /><span className="text-primary italic font-serif">imóveis em Bombinhas?</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-subtitle mb-16 max-w-2xl"
          >
            Converse com a MarIA. Ela combina IA, curadoria local e atendimento humano para orientar sua busca em Bombinhas.
          </motion.p>

          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="w-full max-w-2xl group"
          >
            <div className="relative p-2 rounded-full bg-background border border-border/60 flex flex-col sm:flex-row gap-2 shadow-premium focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-700">
              <div className="flex-1 flex items-center gap-4 px-8 py-4">
                <Search className="h-5 w-5 text-muted-foreground/70 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Cobertura em Bombas até R$ 2M..."
                  className="w-full bg-transparent text-foreground font-bold text-lg outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <Button 
                type="submit"
                size="lg" 
                className="h-14 px-10 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:brightness-105 transition-all duration-500 shadow-xl shadow-primary/10 group-hover:scale-[1.01]"
              >
                Conversar com a MarIA
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </div>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 flex flex-wrap justify-center gap-8"
          >
            {['IA + curadoria local', 'Atendimento humano quando precisar', 'Sem cadastro'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary/40" />
                <span className="text-badge">{item}</span>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default CTASection;