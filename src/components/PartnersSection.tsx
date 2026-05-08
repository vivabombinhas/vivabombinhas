import { Link } from "react-router-dom";
import { Building2, Users, Eye, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const benefits = [
  { icon: Eye, title: "Visibilidade", desc: "Seus imóveis aparecem para quem busca ativamente na região." },
  { icon: Users, title: "Qualificação", desc: "Conecte-se com leads que já sabem exatamente o que querem." },
  { icon: TrendingUp, title: "Recomendação", desc: "A MarIA sugere seu imóvel quando o perfil do cliente dá match." },
  { icon: Building2, title: "Agilidade", desc: "Cadastro rápido via link: a IA lê as informações para você." },
];

const PartnersSection = () => {
  return (
    <section id="anunciar" className="py-24 bg-white relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">
              <Building2 className="h-3 w-3" />
              Para Imobiliárias e Corretores
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-950 mb-8 leading-[1.1]">
              Potencialize seus <span className="text-primary italic">resultados.</span>
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium mb-12 leading-relaxed">
              MarIA não é uma concorrente. É uma aliada que qualifica o lead antes mesmo do primeiro contato.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <b.icon className="h-5 w-5 text-slate-900" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{b.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[48px] bg-slate-950 text-white relative overflow-hidden shadow-2xl shadow-slate-200"
          >
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-8 border border-white/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Anuncie agora.</h3>
              <p className="text-white/40 text-sm mb-10 max-w-xs font-medium leading-relaxed">
                Cole o link do seu anúncio existente e deixe nossa IA fazer o trabalho pesado de cadastro.
              </p>
              <Button
                asChild
                size="lg"
                className="w-full h-14 rounded-2xl bg-white text-slate-950 font-bold hover:bg-white/90 transition-all"
              >
                <Link to="/anuncie" className="flex items-center justify-center gap-2">
                  Começar gratuitamente
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                Sem custos ocultos • Cadastro em 30s
              </p>
            </div>
            
            {/* Visual background details */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px]" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px]" />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default PartnersSection;