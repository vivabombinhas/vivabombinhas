interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
}

const suggestions = [
  "Aluguel anual em Bombas até R$3.000",
  "Casa para temporada em Mariscal",
  "Apartamento para compra até 800 mil",
  "Imóvel com vista para o mar",
  "Casa para 8 pessoas em Zimbros",
];

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
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
