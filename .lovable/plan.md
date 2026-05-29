# Plano Operacional: Validação e Lançamento MarIA v3

Este plano visa transformar a estrutura técnica da MarIA v3 em um motor de receita validado em 7 dias.

## 1. Hipótese Principal do Negócio
"A MarIA v3 consegue identificar e qualificar leads 'Premium' em Bombinhas com uma taxa de conversão em contato real superior a 15%, gerando um Custo por Lead Qualificado (CPLQ) que justifica a operação comercial para corretores parceiros."

## 2. MVP (Produto Mínimo Viável)
O MVP deve focar na **Qualificação Assistida**:
- **Obrigatório**: Fluxos de conversa por pilar, Lógica de Lead Scoring (0-100), Persistência de dados comerciais no banco, Dashboard para Daniel.
- **Descartável (para depois)**: Integração direta com CRMs externos, Pagamento in-app, Dashboard para múltiplos corretores, IA de voz.

## 3. Fluxo Ideal do Usuário
1. **Entrada**: Anúncio focado ("Oportunidades em Bombinhas") ou Botão no site.
2. **Pilar**: Usuário escolhe uma das 4 portas (Temporada, Compra, Investimento, Captação).
3. **Engajamento**: MarIA entrega 2-3 imóveis/info rápidas e faz uma pergunta de qualificação.
4. **Lead Gate**: Solicitação de contato para "liberar análise completa" ou "receber alerta no WhatsApp".
5. **Score**: Sistema calcula o score em tempo real baseado nas respostas.
6. **Handover**: Daniel recebe notificação via WhatsApp com o resumo "mastigado".

## 4. Classificação de Leads
- **Premium (80-100 pts)**: Telefone válido, orçamento > R$ 1M, prazo < 3 meses, objetivo claro (investimento/moradia).
- **Quente (60-79 pts)**: Telefone válido, orçamento definido, bairro de preferência, interesse real.
- **Morno (30-59 pts)**: Telefone válido, mas sem orçamento ou prazo definido (apenas "olhando").
- **Frio (< 30 pts)**: Sem telefone ou apenas perguntas genéricas sem filtros.

## 5. Inteligência de Dados (Campos no Banco)
- **Comerciais**: `orcamento_max`, `prazo_compra`, `objetivo`, `perfil_investidor`.
- **Comportamentais**: `bairro_interesse`, `tipo_imovel`, `score_total`.
- **Handover**: `resumo_ia` (string curta para o WhatsApp do Daniel).

## 6. Roteiro de Conversa Estratégico
- **Investimento**: "Para te enviar as melhores taxas de retorno, você busca ganho de capital (revenda) ou renda passiva (aluguel)?" -> Entrega exemplo -> "Qual o teto de investimento que você planeja?"
- **Compra**: "Bombinhas tem perfis muito diferentes. Você prefere a agitação do Centro ou o sossego de Zimbros?" -> "Já tem uma ideia de quantos quartos precisa?"
- **Captação**: "Queremos garantir que seu imóvel se destaque. Qual o ponto mais forte dele hoje (localização, vista, acabamento)?"

## 7. Lógica de Lead Scoring (0-100)
- **+20 pts**: Telefone e Nome confirmados.
- **+20 pts**: Orçamento informado (numeric).
- **+20 pts**: Prazo de compra definido (ex: "até 3 meses").
- **+20 pts**: Objetivo validado (Investimento/Moradia).
- **+10 pts**: Bairro ou Condomínio específico mencionado.
- **+10 pts**: Usuário aceita falar com Daniel.

## 8. Teste com Tráfego Real
- **Canais**: Facebook/Instagram Ads.
- **Público**: Interesses em "Bombinhas", "Investimento Imobiliário", "Second Home".
- **Orçamento**: R$ 50/dia por 7 dias (R$ 350 total).
- **Oferta**: "Deixe a MarIA encontrar sua próxima oportunidade em Bombinhas - Análise gratuita de mercado."

## 9. Métricas de Sucesso (KPIs)
- **Início de Conversa**: > 20% dos cliques.
- **Lead Capturado**: > 10% das conversas.
- **Lead Quente/Premium**: > 30% dos leads capturados.
- **CPL Qualificado**: < R$ 25,00.

## 10. Modelo de Monetização (Veredito: Híbrido)
Começar com **Pay per Lead Qualificado (PPL)** para validar o valor, evoluindo para **Comissão** no fechamento. O corretor paga uma taxa pequena pelo lead filtrado e uma fatia da comissão se vender.

## 11. Dashboard do Daniel (Prioridade 1)
Uma visão simples em `AdminLeads`:
- Cards coloridos por Score (Ouro para Premium).
- Botão "Ver Resumo IA" que abre o histórico mastigado.
- Botão "Chamar no WhatsApp" com template: "Oi [Nome], vi que a MarIA te ajudou com [Objetivo] em [Bairro]..."

## 12. Plano de 7 Dias (Ação Objetiva)
- **Dia 1**: Implementar lógica de Lead Scoring automática no `maria-search`.
- **Dia 2**: Atualizar UI do Admin para exibir Score e novos campos (`objetivo`, `prazo`, etc).
- **Dia 3**: Refinar Prompt para garantir que a MarIA não "solte" todos os imóveis sem pedir o objetivo.
- **Dia 4**: Criar 2 campanhas de teste (Temporada vs. Investimento).
- **Dia 5**: Lançar tráfego (R$ 50/dia).
- **Dia 6**: Monitorar conversas e ajustar "alucinações" ou pontos de abandono.
- **Dia 7**: Reunião de veredito: O lead gerado é bom? Daniel conseguiu contato?

## 13. Veredito Operacional
- **O que fazer agora**: Implementar o scoring e a visualização no admin. Sem isso, estamos voando cegos.
- **O que NÃO fazer**: Mudar o design do chat ou site. O visual atual é funcional o suficiente para teste.
- **Maior Risco**: MarIA ser muito "interrogadora" e o usuário sair antes de deixar o telefone.
- **Maior Oportunidade**: O pilar de **Investimento** é o que tem o ticket médio mais alto e o lead mais carente de uma "análise" rápida antes de falar com o corretor.
