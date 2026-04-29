
# Reestruturação Estratégica MarIA — Conversão + Monetização Real

Antes do plano técnico, vou responder direto suas 4 perguntas e DEPOIS mostrar o que implementar.

---

## 1. Monetização — sendo honesto com você

Você está certo em desconfiar do "R$ 297–997/mês". Esse modelo só funciona quando a plataforma **já gera leads provados**. Hoje seria vender ar. Esquece assinatura premium por enquanto.

**Receita realista nos primeiros 6 meses (ordem de prioridade):**

| Fonte | Quem paga | Quanto | Quando ativar |
|---|---|---|---|
| **Comissão de temporada** | Proprietário/imobiliária parceira | 3–5% sobre a diária fechada | Já (é o motor principal) |
| **Comissão de aluguel anual** | Imobiliária parceira | 20–30% do 1º aluguel (split) | Já |
| **Comissão de venda** | Corretor parceiro | 0,5–1,5% (split com corretor) | Já, mas é cauda longa |
| **Destaque pago de anúncio** | Proprietário avulso | R$ 49–99 / 30 dias por imóvel | Mês 2-3 (precisa ter tráfego) |
| **Pacote "Imóvel Verificado"** | Proprietário avulso | R$ 197 one-time (foto + descrição IA + boost 60 dias) | Mês 3 |
| **Lead Pack para imobiliárias** | Imobiliária | R$ 20–50 por lead qualificado entregue (pré-pago em pacotes de 10/30/100) | Mês 4 (quando tiver volume) |
| **Assinatura B2B** | Imobiliária ativa | R$ 197–397/mês (acesso ilimitado a leads + dashboard parceiro) | Mês 6+ (só com prova social) |

**Onde está o dinheiro de verdade nos primeiros meses:** **temporada + destaque pago.** Temporada porque o ticket é alto e recorrente (uma família aluga 7 dias = R$ 3-5k de diárias = R$ 90-250 de comissão SEM você fazer nada operacional). Destaque pago porque é micro-pagamento sem fricção.

**O que NÃO cobrar da MarIA diretamente:** o usuário final (quem busca imóvel) **nunca paga**. Quem paga é sempre o lado da oferta (proprietário/corretor).

---

## 2. MarIA dizendo "não tem" e perdendo o lead — isso é sangria

Você identificou o bug mais caro do projeto. Hoje o fluxo é:

```
Usuário: "terreno em Mariscal pra venda"
MarIA: "Não encontrei. Quer fazer outra busca?"
Usuário: 👋 sai e não volta
```

O prompt já tem a regra `SEM_RESULTADOS` (linha 83-84 do edge function), mas ela está sendo **ignorada na prática** porque a MarIA está respondendo `[NO_RESULTS_YET]` em vez de `[SHOW_RESULTS]` quando não há resultado, e o front nem ativa o gate de captura. Resultado: zero captura quando mais importa.

**Fix obrigatório:** sempre que a busca for válida e retornar zero resultados, a MarIA deve:
1. Reconhecer com empatia ("Mariscal é disputado e terrenos somem rápido…")
2. Criar urgência futura ("Tenho corretores garimpando, entram novidades toda semana")
3. **Pedir nome + WhatsApp NA MESMA mensagem** (não em outra)
4. Salvar como **lead com alerta ativo** para essa busca específica → quando entrar imóvel que bate, dispara WhatsApp automático

---

## 3. MarIA precisa vender, não só "mostrar"

Hoje ela é uma **vitrine conversacional**. Precisa virar **vendedora consultiva**. Diferença prática:

| Vitrine (hoje) | Vendedora (objetivo) |
|---|---|
| "Achei 3 opções, dá uma olhada" | "Achei 3 opções. A do Bombas tem vista mar e cabe na sua família — quer que eu agende uma visita ainda essa semana?" |
| Espera o usuário perguntar | Pergunta: "Pra quando você precisa? Tem data de check-in?" |
| Mostra e some | Pergunta urgência, decisor, orçamento real |
| Não qualifica | Marca lead como `quente / morno / frio` automaticamente |

**Top de funil melhor = perguntas SPIN simplificadas:**
- **Situação:** "Vai morar ou é pra férias?"
- **Problema:** "O que tá te incomodando nos lugares que viu até agora?"
- **Implicação:** "Se não achar até [data], o que acontece?"
- **Necessidade:** "Se eu te mostrar exatamente o que você quer hoje, fecha?"

Cada resposta enriquece o lead e aumenta o score. Lead com SPIN respondido vale 5x mais para o corretor parceiro.

---

## 4. Dois agentes especializados — SIM, mas com cuidado

**Recomendação:** fazer **dentro do próprio Lovable / edge function**, não em n8n. Motivos:

- Já temos `maria-search` rodando. Adicionar roteamento custa pouco.
- n8n adicionaria latência (webhook → n8n → LLM → volta) e mais um ponto de falha.
- n8n faz sentido depois, para **automações fora do chat** (envio em massa de WhatsApp, integração com CRM externo, etc.).

**Arquitetura proposta (1 roteador + 2 especialistas):**

```text
            ┌─────────────────────┐
   user ───►│  MarIA Router       │ classifica intenção:
            │  (Gemini Flash)     │  - locacao_temporada
            └────┬────────┬───────┘  - locacao_anual
                 │        │          - venda
                 │        │          - anunciar
                 │        │          - off_topic
                 ▼        ▼
       ┌────────────┐  ┌────────────┐
       │ Agente     │  │ Agente     │
       │ LOCAÇÃO    │  │ VENDAS     │
       │ (temp+anual)│  │            │
       │ Gemini Flash│  │ Gemini Pro │  ← venda exige mais raciocínio
       └────────────┘  └────────────┘
```

**Por que separar:** prompt fica 60% menor por agente, modelo de vendas pode ser mais caro/inteligente (ticket compensa), métricas de conversão ficam segmentadas, treinamento independente.

**Por que NÃO 3 agentes (temporada/anual/venda separados):** locação temporada e anual compartilham 80% das objeções e perguntas. Separar mais que isso é over-engineering nessa fase.

---

# PLANO DE EXECUÇÃO

## Sprint A — Parar a sangria (prioridade absoluta)

### A1. Captura proativa em "sem resultado"
- No `maria-search/index.ts`: quando a busca retorna 0 imóveis E a intent é `search` válida, **forçar** o gate de captação (mesmo fluxo do gate atual, mas com copy de "alerta de novidade").
- Criar tabela `lead_alerts` com os filtros salvos do lead (finalidade, tipo, bairro, preço_max).
- Trigger no insert de `imoveis`: cruzar com `lead_alerts` ativos e criar `lead_matches` automáticos (já existe lógica de match — reaproveitar).
- Página `/admin/alerts` já existe → adicionar aba "Alertas Ativos" mostrando leads esperando imóvel.

### A2. Refinar prompt para nunca "morrer" sem captura
- Reescrever a regra `SEM_RESULTADOS` no system prompt para ser **um único parágrafo obrigatório** com nome + WhatsApp pedido na mesma frase.
- Adicionar regra: se usuário recusar captura 2x na mesma sessão, parar de pedir e sugerir busca alternativa (não ser chato).

## Sprint B — Roteador + 2 agentes

### B1. Estrutura
- Criar `supabase/functions/maria-router/index.ts`: recebe mensagem, classifica intenção em 5 categorias com Gemini Flash (chamada barata, ~200 tokens).
- Renomear `maria-search` → manter como **agente de Locação** (já é majoritariamente isso).
- Criar `supabase/functions/maria-vendas/index.ts`: novo agente especializado em compra/venda, com prompt focado em qualificação de investidor/comprador.
- Front (`useMariaChat.ts`): chamar primeiro o roteador, depois o agente correto. Manter histórico unificado por `session_id`.

### B2. Prompt do agente Vendas (diferenças-chave)
- Pergunta cedo: "É pra morar ou investir?" (muda tudo)
- Investidor → puxa ROI, ocupação média da região, valorização histórica
- Morar → foco em escola, vizinhança, financiamento (perguntar se tem aprovação)
- Sempre pede WhatsApp no 2º turno (lead de venda vale 50x mais que temporada)

### B3. Prompt do agente Locação (refinamento)
- Adicionar SPIN curto: "Pra quando? Quantas pessoas? Já viu outras opções?"
- Sempre que mostrar 1+ imóvel, oferecer ação concreta: "Quer que eu peça pro corretor confirmar disponibilidade?"

## Sprint C — Monetização inicial (sem fantasia)

### C1. Destaque pago de anúncio
- Adicionar campo `destaque_ate` (timestamp) e `destaque_pago` (boolean) em `imoveis`.
- Página pública `/anunciar` ganha opção "Destaque por R$ 49 / 30 dias" (Stripe checkout one-time).
- Imóveis com destaque ativo aparecem **primeiro** nos resultados da MarIA e ganham badge "🔥 Destaque".
- Pré-requisito: ativar Lovable Payments (Stripe). Decisão sua.

### C2. Lead Pack para imobiliárias (manual primeiro)
- Página `/parceiros` simples: explica modelo, captura interesse de imobiliárias.
- Aba `/admin/parceiros`: cadastro manual de imobiliária + saldo de leads.
- Quando admin "entrega" um lead a uma imobiliária pelo CRM, debita do saldo.
- Sem cobrança automática nessa fase — você fecha por WhatsApp e cobra Pix.

### C3. Tracking de origem de receita (já existe → só completar)
- `lead_revenue` já existe. Adicionar campo `fonte_monetizacao`: `comissao_temporada | comissao_anual | comissao_venda | destaque_pago | lead_pack | assinatura`.
- Dashboard ganha gráfico de pizza "Receita por fonte" para você visualizar de onde vem o dinheiro real.

## Sprint D — Inteligência de conversão

### D1. Lead scoring automático
- Função SQL que calcula score 0-100 baseado em: respondeu SPIN? deu telefone? abriu link de imóvel? voltou >1 vez? finalidade=venda?
- Coluna `score` em `leads_maria`, recalculada por trigger.
- `/admin/leads` ordena por score por padrão.

### D2. Disparo automático de WhatsApp em momentos-chave
- Lead criado sem telefone após 10min → notifica admin (você liga/WhatsApp manual).
- Match novo de score >70 → mensagem WhatsApp template para o lead em 1 clique.
- Continuar com WhatsApp manual (link `wa.me`) — não automatizar envio até ter API oficial (caro e burocrático).

---

# Detalhes Técnicos

**Arquivos novos:**
- `supabase/functions/maria-router/index.ts` — classificador de intenção
- `supabase/functions/maria-vendas/index.ts` — agente de venda
- `supabase/migrations/<ts>_lead_alerts_and_destaque.sql` — tabela `lead_alerts`, colunas `destaque_*` em `imoveis`, campo `fonte_monetizacao` em `lead_revenue`, função de score
- `src/pages/AdminParceiros.tsx` — gestão manual de imobiliárias parceiras
- `src/components/admin/LeadScoreBadge.tsx` — badge visual de score

**Arquivos modificados:**
- `supabase/functions/maria-search/index.ts` → vira agente Locação puro + força gate em sem-resultado
- `src/hooks/useMariaChat.ts` → chama roteador, depois agente certo
- `src/pages/AdminDashboard.tsx` → gráfico de receita por fonte
- `src/pages/Anunciar.tsx` → opção de destaque pago
- `src/components/admin/AdminSidebar.tsx` → item "Parceiros"

**Modelos de IA:**
- Roteador: `google/gemini-2.5-flash-lite` (rápido + barato, só classifica)
- Agente Locação: `google/gemini-2.5-flash` (atual)
- Agente Vendas: `google/gemini-2.5-pro` (justifica custo pelo ticket)

**O que deixar pra depois (anti-overengineering):**
- n8n: só quando precisar disparar WhatsApp em massa fora do chat
- API oficial WhatsApp Business: só após primeiros R$ 5k/mês de receita
- Assinatura B2B automatizada: só após 50 leads/mês comprovados
- App mobile: só após 6 meses de PMF web

---

# Ordem sugerida de execução

1. **Sprint A** (1 sessão) — para a sangria de leads perdidos. **Maior ROI imediato.**
2. **Sprint B** (1-2 sessões) — roteador + agente vendas. Sobe qualidade de qualificação.
3. **Sprint C1** (1 sessão) — destaque pago. Primeira receita 100% automatizada (precisa ativar Stripe).
4. **Sprint D** (1 sessão) — scoring + alertas. Otimiza seu tempo focando nos leads quentes.
5. **Sprint C2** (1 sessão) — parceiros manuais. Quando você já tiver volume.

**Quer que eu comece pela Sprint A?** É a que mais dói hoje e a mais barata de fazer. Se sim, aprovando esse plano eu já implemento.
