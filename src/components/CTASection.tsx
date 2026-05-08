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
    <section className="py-32 relative overflow-hidden bg-white">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="container max-w-5xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col items-center text-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-20 h-20 rounded-[32px] bg-slate-950 flex items-center justify-center mb-10 shadow-2xl shadow-slate-300 group"
          >
            <Sparkles className="h-8 w-8 text-white group-hover:rotate-12 transition-transform duration-500" />
          </motion.div>

          <h2 className="text-4xl md:text-7xl font-bold tracking-tight text-slate-950 mb-6 leading-[1.05]">
            Pronto para encontrar<br /><span className="text-primary italic">o seu imóvel?</span>
          </h2>
          
          <p className="text-slate-500 text-lg md:text-xl font-medium mb-12 max-w-2xl leading-relaxed">
            Experimente a forma mais inteligente de buscar em Bombinhas. Sem formulários, apenas conversa.
          </p>

          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-2xl"
          >
            <div className="relative p-2 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col sm:flex-row gap-2 shadow-2xl shadow-slate-100">
              <div className="flex-1 flex items-center gap-4 px-6 py-4">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Descreva o imóvel que você imagina..."
                  className="w-full bg-transparent text-slate-900 font-medium outline-none placeholder:text-slate-300"
                />
              </div>
              <Button 
                type="submit"
                size="lg" 
                className="h-14 px-8 rounded-2xl bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Começar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.form>

          <p className="mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            Gratuito • Instantâneo • Sem Cadastro
          </p>

        </div>
      </div>
    </section>
  );
};

export default CTASection;