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
    { label: "Casa para 6 pessoas em Mariscal", value: "Quero uma casa para 6 pessoas em Mariscal" },
    { label: "Apartamento pé na areia", value: "Quero um apartamento pé na areia em Bombinhas" },
    { label: "Casa com piscina e churrasqueira", value: "Casa com piscina e churrasqueira para família" },
    { label: "Preciso aceitar pet", value: "Estou procurando imóvel de temporada que aceite pet" },
  ],
  compra: [
    {
      label: "Comprar para morar",
      subtext: "Uso próprio, moradia ou casa de praia",
      value: "Quero comprar um imóvel para uso próprio em Bombinhas",
    },
    {
      label: "Comprar para renda de temporada",
      subtext: "Rentabilidade com locação de curto prazo",
      value: "Quero comprar um imóvel para gerar renda com temporada",
    },
    {
      label: "Comprar para patrimônio",
      subtext: "Valorização e reserva de valor",
      value: "Quero comprar em Bombinhas pensando em patrimônio de longo prazo",
    },
    {
      label: "Analisar meu perfil com o especialista",
      subtext: "Conversa consultiva com o Daniel",
      value: "Quero uma análise estratégica do meu perfil de investidor",
    },
  ],
  investimento: [
    {
      label: "Analisar meu perfil",
      subtext: "Entender onde faz mais sentido investir",
      value: "Analisar meu perfil",
    },
    {
      label: "Entender o mercado",
      subtext: "Regiões, riscos e compra segura",
      value: "Entender o mercado",
    },
    {
      label: "Ver imóveis disponíveis",
      subtext: "Navegar por opções no portal",
      value: "Ver imóveis disponíveis",
    },
  ],
  anunciante: [
    { label: "Como anunciar meu imóvel?", value: "Como anunciar meu imóvel?" },
    { label: "Quero destacar meu anúncio", value: "Quero destacar meu anúncio" },
    { label: "Quanto custa anunciar?", value: "Quanto custa anunciar?" },
    { label: "Falar com um consultor", value: "Falar com um consultor" },
  ],
  entender: [
    {
      label: "Como são os bairros de Bombinhas?",
      subtext: "Perfil de Bombas, Mariscal, Canto Grande e Centro",
      value: "Pode me explicar como são os bairros de Bombinhas?",
    },
    {
      label: "Melhor época para visitar",
      subtext: "Alta, baixa temporada e movimento",
      value: "Qual a melhor época para visitar Bombinhas?",
    },
    {
      label: "Como funciona o mercado de temporada",
      subtext: "Ocupação, diárias e sazonalidade",
      value: "Como funciona o mercado de temporada em Bombinhas?",
    },
    {
      label: "Estou só começando a pesquisar",
      subtext: "Ajuda inicial sem compromisso",
      value: "Ainda estou pesquisando Bombinhas, pode me ajudar a entender melhor?",
    },
  ],
};

const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  { label: "Quero alugar para temporada", value: "Quero alugar um imóvel para temporada em Bombinhas" },
  { label: "Quero comprar / investir", value: "Quero comprar ou investir em um imóvel em Bombinhas" },
  { label: "Quero anunciar um imóvel", value: "Quero anunciar meu imóvel" },
  { label: "Quero entender Bombinhas", value: "Quero entender melhor Bombinhas antes de decidir" },
];

export function SuggestionChips({ onSelect, finalidade }: SuggestionChipsProps) {
  const suggestions = finalidade ? SUGGESTIONS_BY_FINALIDADE[finalidade] : DEFAULT_SUGGESTIONS;
  const stackedLayout = finalidade === "investimento" || finalidade === "compra" || finalidade === "entender";

  return (
    <div className={`flex flex-wrap gap-2 px-4 pb-3 ${stackedLayout ? 'flex-col sm:flex-row' : 'justify-center'}`}>
      {suggestions.map((s) => (
        <button
          key={s.value}
          onClick={() => onSelect(s.value)}
          className={`group flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-border bg-card/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:shadow-md ${
            stackedLayout ? 'flex-1 min-w-[200px]' : 'text-xs px-3.5 py-2 rounded-full'
          }`}
        >
          <span className={`font-semibold ${stackedLayout ? 'text-sm mb-0.5' : ''}`}>
            {s.label}
          </span>
          {s.subtext && (
            <span className="text-[10px] text-muted-foreground/70 group-hover:text-primary-foreground/90 leading-tight">
              {s.subtext}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
