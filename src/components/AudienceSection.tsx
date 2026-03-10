import { Home, Umbrella, Key, TrendingUp } from "lucide-react";

const audiences = [
  {
    icon: Home,
    title: "Aluguel Anual",
    desc: "Moradores e profissionais buscando casa ou apartamento para morar o ano todo em Bombinhas.",
  },
  {
    icon: Umbrella,
    title: "Temporada",
    desc: "Turistas e famílias procurando aluguéis de verão, feriados ou finais de semana na região.",
  },
  {
    icon: Key,
    title: "Compra de Imóvel",
    desc: "Interessados em adquirir propriedades na região, do terreno ao apartamento na praia.",
  },
  {
    icon: TrendingUp,
    title: "Investidores",
    desc: "Quem quer identificar oportunidades imobiliárias e acompanhar o mercado de Bombinhas.",
  },
];

const AudienceSection = () => {
  return (
    <section id="para-quem" className="py-20 md:py-28">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Para quem</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            MarIA ajuda <span className="text-gradient">todos os perfis</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Não importa se você quer alugar, comprar ou investir. MarIA encontra o que você precisa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {audiences.map((a, i) => (
            <div key={i} className="glass rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                <a.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{a.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
