import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ImageCursorTrail } from "@/components/ui/image-cursor-trail";

const CTASection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    navigate("/maria", { state: { initialMessage: query.trim() } });
  };

  const images = [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format", // Modern Beach House
    "https://images.unsplash.com/photo-1600585154340-be6199f7a096?q=80&w=600&auto=format", // Luxury Interior
    "https://images.unsplash.com/photo-1600607687940-c52fb0729a5c?q=80&w=600&auto=format", // Contemporary Villa
    "https://images.unsplash.com/photo-1600566752355-3979ff69a3bc?q=80&w=600&auto=format", // Modern Living Room
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=600&auto=format", // Beach Apartment
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=600&auto=format", // Coastal View
  ];

  return (
    <section className="py-40 relative overflow-hidden bg-background border-t border-slate-50 group/cta">
      <ImageCursorTrail 
        items={images} 
        maxNumberOfImages={6} 
        distance={40} 
        fadeAnimation={true}
        imgClass="w-32 h-44 md:w-52 md:h-72"
        className="z-10"
      />
      
      <div className="container max-w-5xl mx-auto px-6 lg:px-12 relative z-20">
        <div className="flex flex-col items-center text-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-24 h-24 rounded-[36px] bg-foreground flex items-center justify-center mb-12 shadow-2xl shadow-slate-200 group"
          >
            <Sparkles className="h-10 w-10 text-white group-hover:rotate-12 transition-transform duration-700" />
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-display mb-10"
          >
            Pronto para encontrar<br /><span className="text-primary italic font-medium">seu lugar?</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-subtitle mb-16 max-w-2xl"
          >
            Experimente a forma mais inteligente de buscar em Bombinhas. Sem formulários, apenas conversa.
          </motion.p>

          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="w-full max-w-2xl group"
          >
            <div className="relative p-3 rounded-[40px] bg-background border border-border flex flex-col sm:flex-row gap-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] focus-within:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.15)] transition-all duration-700">
              <div className="flex-1 flex items-center gap-5 px-8 py-5">
                <Search className="h-6 w-6 text-muted-foreground/60 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Apartamento 3 quartos em Bombas..."
                  className="w-full bg-transparent text-slate-900 font-bold text-lg outline-none placeholder:text-slate-200"
                />
              </div>
              <Button 
                type="submit"
                size="lg" 
                className="h-16 px-12 rounded-[28px] bg-foreground text-white font-bold text-lg hover:bg-slate-800 transition-all duration-500 shadow-xl group-hover:scale-[1.02] active:scale-[0.98]"
              >
                Buscar agora
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
            {['Gratuito', 'Instantâneo', 'Sem Cadastro'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
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