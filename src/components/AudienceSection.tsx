import { Home, Umbrella, Key, TrendingUp, ArrowRight } from "lucide-react";

const audiences = [
  {
    icon: Home,
    title: "Aluguel Anual",
    desc: "Moradores e profissionais buscando casa ou apartamento para morar o ano todo.",
    color: "from-primary to-primary",
  },
  {
    icon: Umbrella,
    title: "Temporada",
    desc: "Turistas e famílias procurando aluguéis de verão, feriados ou fins de semana.",
    color: "from-accent to-accent",
  },
  {
    icon: Key,
    title: "Compra",
    desc: "Interessados em adquirir propriedades na região, do terreno ao apartamento.",
    color: "from-primary to-accent",
  },
  {
    icon: TrendingUp,
    title: "Investimento",
    desc: "Quem quer identificar oportunidades e acompanhar o mercado de Bombinhas.",
    color: "from-accent to-primary",
  },
];

const AudienceSection = () => {
  return (
    <section id="para-quem" className="py-12 md:py-20">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Para quem</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Um assistente para
            <br />
            <span className="text-gradient">cada perfil</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Não importa seu objetivo. MarIA adapta a busca ao que você precisa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {audiences.map((a, i) => (
            <div key={i} className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <a.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-foreground">{a.title}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;