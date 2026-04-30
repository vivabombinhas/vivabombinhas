import { Home, Calendar, Tag } from "lucide-react";

export type Finalidade = "venda" | "aluguel_anual" | "temporada";

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
    label: "Temporada",
    description: "Aluguel por dias ou semanas",
    icon: Calendar,
    emoji: "🏖️",
  },
  {
    id: "aluguel_anual",
    label: "Aluguel anual",
    description: "Para morar (12 meses+)",
    icon: Home,
    emoji: "🏠",
  },
  {
    id: "venda",
    label: "Comprar",
    description: "Venda de imóvel",
    icon: Tag,
    emoji: "💰",
  },
];

export function FinalidadeQualifier({ onSelect }: FinalidadeQualifierProps) {
  return (
    <div className="w-full max-w-md mx-auto px-4 space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        Pra eu te ajudar melhor, me conta: o que você procura?
      </p>
      <div className="grid gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="group flex items-center gap-3 w-full text-left rounded-xl border border-border bg-card hover:border-accent/50 hover:bg-accent/5 transition-all px-4 py-3"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-lg">
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
