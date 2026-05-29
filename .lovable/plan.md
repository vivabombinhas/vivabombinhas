
# MarIA v3 — Auditoria técnica e plano de remodelagem

Antes do plano, dois achados críticos da auditoria que precisam de decisão sua:

- **Bug ativo no runtime:** o edge `maria-search` está retornando `AI Gateway error (Main): 400` (modelo `google/gemini-3-flash-preview`). Hoje, na prática, a MarIA não responde em produção. Já entra no escopo do "passo 0" abaixo.
- **Regressão de funcionalidade:** o `useMariaChat` espera campos como `show_results`, `all_properties`, `properties`, `gate_active`, `no_results_gate` vindos do edge, mas o `maria-search` atual só retorna `{ reply }`. Ou seja, **cards e lead gate não estão sendo disparados pelo backend hoje** — só o que estiver em cache na sessão. Isso precisa ser restaurado antes de qualquer evolução de v3.

## 1. O que pode ser preservado (não mexer)

- Banco de imóveis (`imoveis`, `imoveis_submissions`) e fluxo de cadastro/curadoria.
- CRM: `leads_maria`, `lead_conversations`, `lead_notes`, `lead_matches`, `lead_alerts`, `lead_revenue`, `broker_notifications`.
- Admin inteiro (`AdminLeads`, `AdminDashboard`, `AdminMatches`, `AdminAlerts`, `AdminFollowups`, `AdminCuradoria`, `AdminAIConfig` etc.).
- Componentes do chat: `MariaChat`, `ChatMessage`, `ChatInput`, `PropertyCard`, `LeadCaptureForm`, `SuggestionChips`, `FinalidadeQualifier`.
- Lógica de sessão, lead gate visual, persistência `lead_captured`, auto-match em triggers do Postgres.
- `notify-broker`, templates de WhatsApp, alertas inteligentes.

## 2. O que precisa ser alterado

Arquivos com mudança certa:

- `supabase/functions/maria-search/index.ts` — reescrever prompt, restaurar contrato de resposta (cards + gate), corrigir modelo e scoring.
- `src/components/maria/SuggestionChips.tsx` — remover linguagem de hype ("Oportunidades", "grande valorização", "Lançamentos") e alinhar aos 4 pilares.
- `src/components/maria/FinalidadeQualifier.tsx` — copy ajustada para v3 (sem "investir" prometendo retorno).
- `src/hooks/useMariaChat.ts` — pequeno ajuste só se mudarmos nomes de campos (preferência: manter contrato atual).
- `src/pages/MariaChat.tsx` — copy da mensagem inicial alinhada ao texto oficial v3.

Possíveis (decidir depois): `AdminAIConfig` (caso queiramos editar o prompt via UI) e `ai_config` (já existe a tabela).

## 3. Reescrita de prompts

Dois prompts no edge:

- **System prompt (conversação):** trocar a versão atual (que fala em "valorização m2", "off-market", "rentabilidade") por um prompt v3 consultivo, sem hype, com as 4 intenções (Temporada, Compra para morar, Compra para investir, Proprietário/Anunciante), regra de "uma pergunta por vez", proibição explícita das frases vetadas, e instrução de **nunca prometer** valorização/rentabilidade/atendimento imediato.
- **Extraction prompt:** manter, mas alinhar `objetivo` ao novo mapa (`temporada`, `morar`, `investir`, `anunciar`) e remover `forma_pagamento` (que hoje pontua "à vista" e induz hype comercial). Adicionar `intencao_analise_daniel: boolean`.

## 4. Campos do CRM — o que já existe vs. o que falta

Já existe em `leads_maria`: `nome`, `telefone`, `email`, `interesse`, `tipo_imovel`, `bairro_interesse`, `faixa_preco`, `orcamento_max`, `objetivo`, `prazo_compra`, `lead_score`, `resumo_ia`, `session_id`, `status`, `next_followup_at`, `last_contact_at`, `feedback_corretor`, `observacao_interna`, `mensagem_original`.

Sugestão de adicionar (migração pequena, opcional, sem quebrar nada):
- `finalidade` (text) — Temporada / Compra / Investimento / Anunciante (hoje é inferido em `interesse`).
- `perfil_anunciante` (text) — proprietário / corretor / imobiliária.
- `quer_falar_daniel` (boolean) — gatilho explícito de handover.

## 5. Novo mapa de intenções (v3)

```text
                ┌────────────────────────┐
                │  Mensagem inicial v3   │
                └────────────┬───────────┘
                             │
        ┌────────────┬───────┴────────┬─────────────┐
        ▼            ▼                ▼             ▼
   Temporada     Compra            Investimento   Anunciante
   (tráfego)    (morar)            (premium)      (inventário)
                                     │
                                     ▼
                            Handover opcional → Daniel
```

Removidos do fluxo principal: aluguel anual, turismo, gastronomia, passeios.

## 6. Novo fluxo conversacional (resumo)

- **Abertura única:** "Oi, eu sou a MarIA, assistente do VIV Bombinhas. Posso te ajudar a encontrar imóvel para temporada, compra ou investimento em Bombinhas. O que você está buscando hoje?"
- **Se Compra:** segunda pergunta obrigatória — "morar, investir ou ainda entender o mercado?".
- **Temporada:** pessoas → mês → diária → bairro → tipo → extras → mostrar cards → lead gate.
- **Compra/morar:** faixa → bairro → tipo → estágio (pronto/usado/lançamento) → prazo → cards quando houver.
- **Investimento:** objetivo (renda/patrimônio/ambos) → faixa → conhece a região? → bairro → prazo → cards OU oferta de análise com Daniel.
- **Anunciante:** perfil → finalidade do imóvel → bairro → tem link? → direcionar para `/anuncie`.
- **Regra de ouro:** uma pergunta por vez, sem hype, sem promessa, sem pedir contato por texto quando o formulário visual existe.

## 7. Nova lógica de lead score (simples e objetiva)

Pontos somáveis (cap 100):

- Contato (nome + telefone): +30
- Finalidade declarada: +10
- Objetivo definido (morar/investir/renda/patrimônio/temporada): +10
- Orçamento informado: +15 (>R$ 1M soma +5)
- Prazo definido (imediato +20, 3m +15, 6m +10, futuro +5)
- Bairro/região específica: +10
- Aceita falar com Daniel: +10 (só para Compra/Investimento)

Classificação:
- Premium ≥ 80, Quente 60–79, Morno 30–59, Frio < 30.

## 8. Cards continuam funcionando — como garantir

Restaurar no `maria-search` o contrato que o front já espera:
`{ reply, show_results, all_properties, properties, gate_active, no_results_gate, clear_results }`.
Manter a regra atual: cards só aparecem com finalidade definida + ≥ 3 filtros concretos; sem resultados → modo alerta. Sem mudar nenhuma linha do `useMariaChat`/`ChatMessage`/`PropertyCard`.

## 9. Lead gate continua funcionando — como garantir

Mantém-se exatamente: 2 cards de degustação → `LeadCaptureForm` inline → `submit_lead` → libera restante. Nenhuma mudança em componentes. Só o backend precisa voltar a emitir `gate_active: true` quando `lead_captured=false` e houver mais de 2 imóveis (já era o comportamento original).

## 10. Daniel recebe só os leads certos — como garantir

- `notify-broker` só é chamado **após** captura via formulário (já é hoje).
- Adicionar filtro server-side no `notify-broker` (ou no `maria-search` antes de chamar): só dispara push/WhatsApp para Daniel quando `finalidade ∈ {compra, investimento}` **e** `lead_score ∈ {Quente, Premium}` **e** (`orcamento_max` definido **ou** `quer_falar_daniel = true`).
- Leads de temporada e anunciante seguem entrando no CRM normalmente, mas **sem** notificar Daniel.

## 11. Menor primeiro passo seguro

**Passo 0 (já necessário para destravar o produto):** reescrever apenas `supabase/functions/maria-search/index.ts` para:
1. Trocar o modelo quebrado por `google/gemini-2.5-flash` (estável).
2. Substituir o `SYSTEM_PROMPT` pelo prompt v3 sem hype.
3. Restaurar o contrato de resposta com cards + gate (busca em `imoveis` por finalidade/filtros).
4. Atualizar `EXTRACTION_PROMPT` + `calculateScore` conforme seção 7.
5. Manter `submit_lead` e `upsertLeadBySession` como estão.

Nada no front muda nesse passo. Se algo der errado, basta reverter o edge function — chat, cards, lead gate, CRM e admin continuam intactos.

Passos seguintes (em ordem, cada um isolado e revertível):
- Passo 1: ajustar copy de `SuggestionChips`, `FinalidadeQualifier` e mensagem inicial em `MariaChat`.
- Passo 2: migração opcional adicionando `finalidade`, `perfil_anunciante`, `quer_falar_daniel` em `leads_maria`.
- Passo 3: filtro de handover no `notify-broker`.
- Passo 4: expor o novo prompt em `AdminAIConfig` para edição sem deploy.

Quando aprovar, eu começo pelo Passo 0.
