# Plano de Remodelagem Estratégica: MarIA v3

Este plano detalha a transição da MarIA de um assistente de busca para um motor de inteligência comercial focado em captação, segmentação e geração de leads qualificados.

## 1. Auditoria de Arquivos e Estruturas

### Arquivos a serem alterados:
- `supabase/functions/maria-search/index.ts`: O "cérebro" da MarIA. Onde a lógica de qualificação, intenção e lead score será implementada.
- `src/hooks/useMariaChat.ts`: Ajuste no estado inicial e tratativa de novas categorias (investimento, proprietário).
- `src/components/maria/FinalidadeQualifier.tsx`: Atualização dos botões iniciais para refletir o novo posicionamento (Remover Aluguel Anual, Adicionar Investimento e Anunciante).

### Arquivos preservados (Segurança):
- `src/components/maria/PropertyCard.tsx`: Mantém a exibição visual de imóveis.
- `src/components/maria/LeadCaptureForm.tsx`: Mantém a funcionalidade de "Lead Gate".
- `supabase/functions/notify-broker/index.ts`: Mantém o envio de alertas para corretores.

### Tabelas/Campos necessários:
- **Tabela `leads_maria`**: 
    - `lead_score`: text (frio, morno, quente, premium)
    - `perfil_investidor`: boolean
    - `objetivo`: text (morar, investir, anunciar, temporada)
    - `orcamento_max`: numeric
    - `prazo_compra`: text
- **Tabela `conversas_maria`**: Já existe para histórico, mas precisamos garantir que armazene a classificação da intenção em cada turno.

## 2. Novo Fluxo Conversacional

### Fase 1: Descoberta de Intenção
A MarIA iniciará com:
"Oi, eu sou a MarIA, assistente do VIV Bombinhas. Você está procurando imóvel para temporada ou para compra em Bombinhas?"
*   **Opções:** [Temporada] [Compra] [Anunciar meu Imóvel]

### Fase 2: Ramificação (Branching)
- **Se Compra:** "Você está comprando para morar, investir ou ainda entender melhor o mercado?"
- **Se Investimento:** Focar em faixa de investimento e prazo.
- **Se Anunciante:** Encaminhar para a rota de cadastro ou explicar o processo de destaque premium.

## 3. Lógica de Lead Score e Encaminhamento

A classificação será processada no final de cada qualificação dentro da Edge Function:

| Score | Critérios | Ação |
| :--- | :--- | :--- |
| **Frio** | Navegação básica, filtros genéricos, sem telefone. | Alerta de novos imóveis. |
| **Morno** | Telefone capturado + filtros de interesse definidos. | CRM padrão. |
| **Quente** | Intenção clara + orçamento + bairro definido. | CRM + Alerta Corretor. |
| **Premium** | Investimento/Compra + Prazo imediato + Perfil qualificado. | **Direcionamento para Daniel.** |

## 4. Plano de Implementação em Fases

### Fase 1: Mudança Estrutural no Backend (Seguro)
- Atualizar a Edge Function `maria-search` para reconhecer as novas finalidades (`investimento`, `anunciante`).
- Implementar a extração de novos campos no prompt de extração de filtros (prazo, perfil investidor).
- Adicionar os novos campos na tabela `leads_maria` via migração SQL.

### Fase 2: Ajuste de Interface Inicial
- Modificar o `FinalidadeQualifier.tsx` para mostrar as novas opções.
- Atualizar o `useMariaChat.ts` para lidar com a nova primeira pergunta.

### Fase 3: Lógica de Lead Score & Daniel
- Implementar o cálculo de `lead_score` no backend.
- Adicionar a mensagem de ponte para o Daniel ("Pelo seu perfil, talvez faça sentido uma análise...").

### Fase 4: Limpeza e Otimização
- Remover o código legado de "Aluguel Anual".
- Ajustar os prompts de sistema para serem mais rígidos quanto a não prometer retorno financeiro.

---

## Detalhes Técnicos para Desenvolvimento

### Mudanças no prompt de Sistema (System Prompt):
O novo prompt incluirá diretrizes de "Guardrails" para evitar promessas financeiras e garantir que a MarIA não tente agir como corretora humana, mas sim como uma facilitadora técnica.

### Migração de Dados:
```sql
ALTER TABLE leads_maria 
ADD COLUMN IF NOT EXISTS lead_score TEXT DEFAULT 'frio',
ADD COLUMN IF NOT EXISTS objetivo TEXT,
ADD COLUMN IF NOT EXISTS prazo_compra TEXT,
ADD COLUMN IF NOT EXISTS orcamento_max NUMERIC;
```
