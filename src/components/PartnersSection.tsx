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
    <section id="anunciar" className="py-32 bg-white relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em] mb-10"
            >
              <Building2 className="h-4 w-4 text-blue-600" />
              Parceiros e Corretores
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-slate-950 mb-10 leading-[1.05]"
            >
              Sua nova aliada na <br className="hidden md:block" />
              <span className="text-slate-400 italic font-medium">prospecção local.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 text-lg md:text-xl font-medium mb-12 leading-relaxed"
            >
              A MarIA qualifica a intenção do usuário antes mesmo do primeiro contato, garantindo leads mais maduros e poupando seu tempo.
            </motion.p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              {benefits.map((b, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex gap-5"
                >
                  <div className="w-12 h-12 rounded-[14px] bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                    <b.icon className="h-6 w-6 text-slate-900" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-950 mb-1.5">{b.title}</h4>
                    <p className="text-[13px] text-slate-500 leading-relaxed font-medium">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="p-12 md:p-16 rounded-[48px] bg-slate-950 text-white relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)]"
          >
            {/* Background pattern for the card */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-[28px] bg-white/10 backdrop-blur-md flex items-center justify-center mb-10 border border-white/10 shadow-xl">
                <Sparkles className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight">Anuncie seus imóveis.</h3>
              <p className="text-white/50 text-[15px] md:text-[17px] mb-12 max-w-sm font-medium leading-relaxed">
                Integre seu portfólio e apareça para quem busca o perfil exato do seu imóvel.
              </p>
              <Button
                asChild
                size="lg"
                className="w-full h-16 rounded-2xl bg-white text-slate-950 font-bold text-lg hover:bg-slate-100 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] duration-500"
              >
                <Link to="/anuncie" className="flex items-center justify-center gap-3">
                  Começar gratuitamente
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <p className="mt-8 text-[11px] font-bold text-white/20 uppercase tracking-[0.25em]">
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