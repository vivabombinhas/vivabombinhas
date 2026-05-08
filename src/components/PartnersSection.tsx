import { Link } from "react-router-dom";
import { Building2, Users, Eye, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const benefits = [
  { icon: Eye, title: "Visibilidade Estratégica", desc: "Seus ativos apresentados para investidores qualificados que buscam ativamente na região." },
  { icon: Users, title: "Inteligência de Leads", desc: "Conexão direta com perfis que possuem intenção real de aquisição ou locação." },
  { icon: TrendingUp, title: "Algoritmo de Recomendação", desc: "A MarIA prioriza seus imóveis quando há um match exato com o perfil do cliente." },
  { icon: Building2, title: "Onboarding Instantâneo", desc: "Sincronização automatizada de anúncios existentes via IA em poucos segundos." },
];

const PartnersSection = () => {
  return (
    <section id="anunciar" className="py-24 md:py-32 relative overflow-hidden bg-white">
      <div className="container relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-4"
            >
              <Building2 className="h-4 w-4" />
              Ecossistema de Parceiros
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-slate-900">
              Maximize o alcance do seu <br />
              <span className="text-gradient italic">portfólio.</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium">
              Proprietários e imobiliárias: utilizem nossa tecnologia para conectar seus melhores imóveis aos clientes certos.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((b, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-[32px] border border-slate-100 bg-slate-50/50 p-8 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 tracking-tight">{b.title}</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed font-medium">{b.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[40px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-8 md:p-16 text-center shadow-sm"
          >
            <div className="inline-flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-6">
              <Sparkles className="h-4 w-4" /> Automação Inteligente
            </div>
            <h3 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight text-slate-900">
              Sincronize seu anúncio em segundos.
            </h3>
            <p className="text-slate-500 mb-10 max-w-xl mx-auto font-medium">
              Nossa IA extrai automaticamente as informações do seu anúncio em qualquer plataforma (ZAP, Airbnb, Instagram) e o integra à nossa curadoria.
            </p>
            <Button
              asChild
              size="lg"
              className="h-16 px-10 gap-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-xl shadow-slate-200"
            >
              <Link to="/anuncie">
                Listar meu imóvel agora
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;