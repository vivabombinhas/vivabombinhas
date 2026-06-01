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
  compra: [
    "Apartamento para morar até 1 milhão",
    "Casa à venda com vista mar",
    "Terreno em Bombinhas",
    "Cobertura em Bombas",
  ],
  investimento: [
    "Oportunidades para investimento",
    "Lançamentos em Bombinhas",
    "Imóvel para renda com temporada",
    "Bairros mais procurados",
  ],
  anunciante: [
    "Como anunciar meu imóvel?",
    "Quero destacar meu anúncio",
    "Quanto custa anunciar?",
    "Falar com um consultor",
  ],
};

const DEFAULT_SUGGESTIONS = [
  "Quero comprar para investir",
  "Casa para temporada em Mariscal",
  "Apartamento para morar até 1 milhão",
  "Quero anunciar meu imóvel",
];

export function SuggestionChips({ onSelect, finalidade }: SuggestionChipsProps) {
  const suggestions = finalidade ? SUGGESTIONS_BY_FINALIDADE[finalidade] : DEFAULT_SUGGESTIONS;
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3 justify-center">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="text-xs px-3.5 py-2 rounded-full border border-border bg-card/50 text-muted-foreground hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all duration-300 hover:shadow-sm"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
