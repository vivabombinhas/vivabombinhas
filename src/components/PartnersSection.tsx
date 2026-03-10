import { Building2, Users, Eye, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: Eye, title: "Mais visibilidade", desc: "Seus imóveis aparecem para quem está buscando ativamente na região." },
  { icon: Users, title: "Leads qualificados", desc: "Conecte-se com pessoas que já descreveram exatamente o que procuram." },
  { icon: TrendingUp, title: "Alcance inteligente", desc: "A IA da MarIA recomenda seus imóveis quando batem com a busca do usuário." },
  { icon: Building2, title: "Gestão simples", desc: "Cadastre e atualize seus anúncios em poucos minutos." },
];

const PartnersSection = () => {
  return (
    <section id="anunciar" className="py-12 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-accent uppercase tracking-wider mb-4">
              <Building2 className="h-4 w-4" />
              Para anunciantes
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Anuncie na <span className="text-gradient">MarIA</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Proprietários, corretores e imobiliárias: coloque seus imóveis na frente de quem está 
              procurando ativamente em Bombinhas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-10 md:mb-12">
            {benefits.map((b, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 hover:border-accent/30 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <b.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA card */}
          <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5 p-8 md:p-10 text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              Faça parte do ecossistema MarIA
            </h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Cadastre seus imóveis e seja encontrado por quem busca alugar, comprar ou investir em Bombinhas.
            </p>
            <Button size="lg" className="gap-2 rounded-xl bg-gradient-to-r from-accent to-primary hover:opacity-90 text-primary-foreground">
              Quero anunciar meus imóveis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
