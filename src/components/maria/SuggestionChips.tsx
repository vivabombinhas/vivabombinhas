import type { Finalidade } from "./FinalidadeQualifier";

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
  finalidade?: Finalidade | null;
}

const SUGGESTIONS_BY_FINALIDADE: Record<Finalidade, string[]> = {
  temporada: [
    "Casa para temporada em Mariscal",
    "Apartamento na praia para 6 pessoas",
    "Imóvel com vista para o mar",
    "Casa com piscina para 8 pessoas",
  ],
  aluguel_anual: [
    "Aluguel anual em Bombas até R$3.000",
    "Apartamento mobiliado pra morar",
    "Casa com 3 quartos em Bombinhas",
    "Aceita pet em Mariscal",
  ],
  venda: [
    "Apartamento para compra até 800 mil",
    "Casa à venda com vista mar",
    "Terreno em Bombinhas",
    "Cobertura frente mar",
  ],
};

const DEFAULT_SUGGESTIONS = [
  "Aluguel anual em Bombas até R$3.000",
  "Casa para temporada em Mariscal",
  "Apartamento para compra até 800 mil",
  "Imóvel com vista para o mar",
];

export function SuggestionChips({ onSelect, finalidade }: SuggestionChipsProps) {
  const suggestions = finalidade ? SUGGESTIONS_BY_FINALIDADE[finalidade] : DEFAULT_SUGGESTIONS;
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3 justify-center">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
