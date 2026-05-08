import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CTASection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    navigate("/maria", { state: { initialMessage: query.trim() } });
  };

  return (
    <section className="py-24 md:py-32 bg-slate-900 relative overflow-hidden rounded-[40px] md:rounded-[80px] mx-4 md:mx-8 mb-8">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 -translate-x-1/2 translate-y-1/2" />

      <div className="container max-w-4xl text-center relative z-10 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-8"
        >
          <Sparkles className="h-4 w-4" />
          Acesso imediato
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-7xl font-bold mb-8 tracking-tight text-white leading-tight"
        >
          Seja o próximo a <br />
          <span className="text-primary italic">descobrir o paraíso.</span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg md:text-2xl mb-16 max-w-2xl mx-auto font-light"
        >
          A MarIA está pronta para encontrar o ativo imobiliário que você sempre buscou. Sem taxas, sem cadastros, apenas inteligência.
        </motion.p>

        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSearch}
          className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl p-3 max-w-2xl mx-auto shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-4 bg-white/5 rounded-2xl px-6 py-4 border border-white/5">
              <Search className="h-5 w-5 text-slate-500 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Cobertura pé na areia em Mariscal..."
                className="w-full bg-transparent text-lg text-white outline-none placeholder:text-slate-600 font-medium"
              />
            </div>
            <Button 
              type="submit"
              size="lg" 
              className="h-16 px-10 gap-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              Iniciar Conversa
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </motion.form>
        
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-slate-500 text-sm font-semibold tracking-wider uppercase"
        >
          Bombinhas · Santa Catarina · Brasil
        </motion.p>
      </div>
    </section>
  );
};

export default CTASection;