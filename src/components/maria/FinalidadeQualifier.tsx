import { Home, Calendar, UserPlus, Compass } from "lucide-react";

export type Finalidade = "compra" | "investimento" | "temporada" | "anunciante" | "entender";

interface FinalidadeQualifierProps {
  onSelect: (finalidade: Finalidade) => void;
}

const OPTIONS: Array<{
  id: Finalidade;
  label: string;
  description: string;
  icon: typeof Home;
  emoji: string;
}> = [
  {
    id: "temporada",
    label: "Quero alugar para temporada",
    description: "Férias, feriados e fins de semana",
    icon: Calendar,
    emoji: "🏖️",
  },
  {
    id: "compra",
    label: "Quero comprar / investir",
    description: "Uso próprio, renda de temporada ou patrimônio",
    icon: Home,
    emoji: "🏠",
  },
  {
    id: "anunciante",
    label: "Quero anunciar um imóvel",
    description: "Sou proprietário, corretor ou imobiliária",
    icon: UserPlus,
    emoji: "🤝",
  },
  {
    id: "entender",
    label: "Quero entender Bombinhas",
    description: "Bairros, perfil das praias e o mercado local",
    icon: Compass,
    emoji: "🧭",
  },
];

export function FinalidadeQualifier({ onSelect }: FinalidadeQualifierProps) {
  return (
    <div className="w-full max-w-md mx-auto px-4 space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        Por onde prefere começar?
      </p>
      <div className="grid gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="group flex items-center gap-4 w-full text-left rounded-2xl border border-border bg-card hover:border-accent/40 hover:bg-accent/5 hover:shadow-sm active:scale-[0.98] transition-all px-5 py-4"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-xl shadow-inner">
                <span aria-hidden>{opt.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-accent" />
                  {opt.label}
                </div>
                <div className="text-xs text-muted-foreground">{opt.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
