import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ricardo Silva",
    role: "Proprietário em Bombinhas",
    text: "Consegui alugar meu apartamento em menos de uma semana depois que a MarIA começou a indicá-lo. O filtro de leads é fantástico.",
    avatar: "RS"
  },
  {
    name: "Ana Paula",
    role: "Buscando Imóvel",
    text: "A MarIA me poupou horas de pesquisa. Ela entendeu exatamente que eu queria uma cobertura com vista para o mar em Bombas.",
    avatar: "AP"
  },
  {
    name: "Imobiliária Litoral",
    role: "Parceiro",
    text: "O portal VIV Bombinhas se tornou nossa principal fonte de leads qualificados. A integração com IA é o futuro.",
    avatar: "IL"
  }
];

const partners = [
  { name: "Airbnb", logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg" },
  { name: "OLX", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9e/OLX_logo.svg" },
  { name: "Zap Imóveis", logo: "https://upload.wikimedia.org/wikipedia/pt/4/44/Logo_ZAP_Imóveis.png" },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-12 md:py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 font-display">Quem usa, aprova</h2>
          <p className="text-muted-foreground">Depoimentos reais de quem já transformou sua busca por imóveis.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow relative">
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-muted-foreground mb-6 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-10 border-t border-border">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">Parceiros e Integrações</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
             {partners.map((p, i) => (
               <img key={i} src={p.logo} alt={p.name} className="h-8 md:h-10 w-auto" />
             ))}
          </div>
        </div>
      </div>
    </section>
  );
};