import { Link } from "react-router-dom";
import { Building2, Users, Eye, Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TypingText } from "@/components/ui/TypingText";

const benefits = [
  { icon: Eye, title: "Visibilidade", desc: "Apareça para quem busca ativamente na região." },
  { icon: Users, title: "Qualificação", desc: "Conecte-se com leads prontos para negociar." },
  { icon: Search, title: "Curadoria", desc: "Match real entre busca e portfólio." },
  { icon: Building2, title: "Agilidade", desc: "Processamento automático de anúncios." },
];

const PartnersSection = () => {
  return (
    <section id="anunciar" className="section-padding bg-background relative overflow-hidden">
      <div className="container-wide relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">
          
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <Building2 className="h-4 w-4 text-primary" />
              <TypingText text="Parceiros" className="text-badge text-primary" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-h2 mb-10"
            >
              Sua nova aliada na <br className="hidden md:block" />
              <span className="text-muted-foreground/40 italic font-serif">prospecção local.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-subtitle mb-12"
            >
              A MarIA qualifica a intenção do usuário antes mesmo do primeiro contato, garantindo eficiência máxima para corretores e imobiliárias.
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
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
                    <b.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold mb-1.5">{b.title}</h4>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="p-10 md:p-16 rounded-[48px] bg-foreground text-white relative overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-10 border border-white/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-h2 mb-6">Anuncie seus imóveis.</h3>
              <p className="text-white/60 text-lg mb-12 max-w-sm font-medium leading-relaxed">
                Apareça para quem busca o perfil exato do seu imóvel em Bombinhas.
              </p>
              <Button
                asChild
                size="lg"
                className="w-full h-16 rounded-full bg-white text-foreground font-bold text-lg hover:bg-muted transition-all duration-500 shadow-xl"
              >
                <Link to="/anuncie" className="flex items-center justify-center gap-3">
                  Começar agora
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default PartnersSection;