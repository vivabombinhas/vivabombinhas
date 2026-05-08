import { Link } from "react-router-dom";
import { Building2, Users, Eye, Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const benefits = [
  { icon: Eye, title: "Visibilidade", desc: "Seus imóveis aparecem para quem busca ativamente na região." },
  { icon: Users, title: "Qualificação", desc: "Conecte-se com interessados que já entendem o perfil do imóvel." },
  { icon: Search, title: "Curadoria", desc: "A MarIA sugere seu anúncio quando há match real com a busca." },
  { icon: Building2, title: "Agilidade", desc: "Seus anúncios são lidos e organizados automaticamente pela IA." },
];

const PartnersSection = () => {
  return (
    <section id="anunciar" className="py-24 bg-white relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">
              <Building2 className="h-3 w-3" />
              Para Imobiliárias e Corretores
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950 mb-8 leading-[1.1]">
              Uma aliada na sua<br /><span className="text-blue-600 italic">prospecção.</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium mb-12 leading-relaxed">
              MarIA ajuda a qualificar a intenção do usuário antes mesmo do primeiro contato, otimizando seu tempo.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                    <b.icon className="h-5 w-5 text-slate-900" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{b.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[40px] bg-slate-950 text-white relative overflow-hidden shadow-2xl shadow-slate-200"
          >
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-8 border border-white/10">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Anuncie seus imóveis.</h3>
              <p className="text-white/40 text-sm mb-10 max-w-xs font-medium leading-relaxed">
                Integre seus anúncios e apareça para quem busca o perfil exato do seu portfólio.
              </p>
              <Button
                asChild
                size="lg"
                className="w-full h-14 rounded-2xl bg-white text-slate-950 font-bold hover:bg-slate-100 transition-all shadow-lg"
              >
                <Link to="/anuncie" className="flex items-center justify-center gap-2">
                  Começar gratuitamente
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                Cadastro em segundos • Sem custos iniciais
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default PartnersSection;