import type { Finalidade } from "./FinalidadeQualifier";

interface SuggestionItem {
  label: string;
  subtext?: string;
  value: string;
}

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
  finalidade?: Finalidade | null;
}

const SUGGESTIONS_BY_FINALIDADE: Record<Finalidade, SuggestionItem[]> = {
  temporada: [
    { label: "Casa para temporada em Mariscal", value: "Casa para temporada em Mariscal" },
    { label: "Apartamento na praia para 6 pessoas", value: "Apartamento na praia para 6 pessoas" },
    { label: "Imóvel com vista para o mar", value: "Imóvel com vista para o mar" },
    { label: "Casa com piscina para 8 pessoas", value: "Casa com piscina para 8 pessoas" },
  ],
  compra: [
    { label: "Apartamento para morar até 1 milhão", value: "Apartamento para morar até 1 milhão" },
    { label: "Casa à venda com vista mar", value: "Casa à venda com vista mar" },
    { label: "Terreno em Bombinhas", value: "Terreno em Bombinhas" },
    { label: "Cobertura em Bombas", value: "Cobertura em Bombas" },
  ],
  investimento: [
    { 
      label: "Ver imóveis para investir", 
      subtext: "Quero analisar opções disponíveis",
      value: "Ver imóveis para investir"
    },
    { 
      label: "Analisar meu perfil", 
      subtext: "Quero entender onde faz mais sentido investir",
      value: "Analisar meu perfil"
    },
    { 
      label: "Entender o mercado", 
      subtext: "Regiões, m², riscos e potencial",
      value: "Entender o mercado"
    },
  ],
  anunciante: [
    { label: "Como anunciar meu imóvel?", value: "Como anunciar meu imóvel?" },
    { label: "Quero destacar meu anúncio", value: "Quero destacar meu anúncio" },
    { label: "Quanto custa anunciar?", value: "Quanto custa anunciar?" },
    { label: "Falar com um consultor", value: "Falar com um consultor" },
  ],
};

const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  { label: "Quero comprar para investir", value: "Quero comprar para investir" },
  { label: "Casa para temporada em Mariscal", value: "Casa para temporada em Mariscal" },
  { label: "Apartamento para morar até 1 milhão", value: "Apartamento para morar até 1 milhão" },
  { label: "Quero anunciar meu imóvel", value: "Quero anunciar meu imóvel" },
];

export function SuggestionChips({ onSelect, finalidade }: SuggestionChipsProps) {
  const suggestions = finalidade ? SUGGESTIONS_BY_FINALIDADE[finalidade] : DEFAULT_SUGGESTIONS;
  
  return (
    <div className={`flex flex-wrap gap-2 px-4 pb-3 ${finalidade === 'investimento' ? 'flex-col sm:flex-row' : 'justify-center'}`}>
      {suggestions.map((s) => (
        <button
          key={s.value}
          onClick={() => onSelect(s.value)}
          className={`group flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-border bg-card/50 text-muted-foreground hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all duration-300 hover:shadow-sm ${
            finalidade === 'investimento' ? 'flex-1 min-w-[200px]' : 'text-xs px-3.5 py-2 rounded-full'
          }`}
        >
          <span className={`font-semibold ${finalidade === 'investimento' ? 'text-sm mb-0.5' : ''}`}>
            {s.label}
          </span>
          {s.subtext && (
            <span className="text-[10px] text-muted-foreground/70 group-hover:text-accent/70 leading-tight">
              {s.subtext}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
