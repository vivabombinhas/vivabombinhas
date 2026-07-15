# Cockpit de Atendimento — entrega por etapas

Nada será apagado. Nenhuma tabela será fundida. É reorganização de UI. A cada etapa eu paro e te mostro antes de seguir.

## Etapa 1 (agora) — Layout de 3 zonas + seleção sem sair da tela

Transformar `/admin/atendimento` numa tela única dividida em 3 colunas fixas. Sem realtime, sem novas ações ainda — só o esqueleto navegável.

```text
┌──────────────┬────────────────────────────┬──────────────────┐
│ Zona 1       │ Zona 2                     │ Zona 3           │
│ Fila         │ Conversa                   │ Contexto + IA    │
│ priorizada   │ (histórico MarIA↔cliente)  │ + Ações          │
│              │                            │                  │
│ busca +      │ bolhas de chat, scroll     │ score, resumo,   │
│ filtros      │ até o fim, campo de        │ próxima ação,    │
│ rápidos      │ resposta (placeholder)     │ abas Notas/Hist  │
└──────────────┴────────────────────────────┴──────────────────┘
```

Escopo desta etapa:
- Reescrever `src/pages/AdminAtendimento.tsx` com grid de 3 colunas (empilha no mobile).
- **Zona 1 – Fila:** lista atual vira coluna vertical compacta. Card: nome, telefone, finalidade, bairro, badge de score colorido (quente/morno/novo). Busca no topo + chips de filtro rápido: status, finalidade, "só quentes", "follow-up hoje". Ordenação: quente > morno > novo, empate por `created_at` desc. Clicar seleciona o lead e carrega Zonas 2 e 3 sem navegação.
- **Zona 2 – Conversa (placeholder estrutural):** já busca `maria_messages` do lead selecionado (query que já existe) e renderiza como bolhas de chat (esquerda MarIA / direita cliente) com auto-scroll ao trocar de lead. Rodapé com textarea "Responder como atendente" desabilitado + aviso "envio via WhatsApp será ligado na Etapa 4". Sem realtime ainda.
- **Zona 3 – Contexto (placeholder estrutural):** move o conteúdo do Sheet atual (contexto, resumo IA, próxima ação, notas) para a coluna direita, empilhado. Mantém "Marcar como em atendimento". **Remove** o bloco "Mensagem WhatsApp sugerida" desta tela (será substituído pelo componente do Leads na Etapa 4 — não apago o código auxiliar, só deixo de renderizar aqui).
- Sheet lateral atual deixa de ser usado nessa página; código fica no arquivo mas sem uso, para eu remover só com sua aprovação depois.

Fora do escopo desta etapa (vem depois, uma por vez):
- Etapa 2: realtime em `maria_messages` + envio real da resposta do atendente.
- Etapa 3: refinar painel direito (score visual, ícones, colapsáveis).
- Etapa 4: portar mensagem pronta + Regenerar + Abrir no WhatsApp (do Leads), agendar follow-up, handoff Daniel, sugerir imóveis via `buscar-imoveis`.
- Etapa 5: copiloto "Pergunte à MarIA" contextual.
- Etapa 6: simplificar `/admin/leads` para modo lista/planilha.

## Detalhes técnicos (Etapa 1)

- Arquivo único alterado: `src/pages/AdminAtendimento.tsx`. Sem migrations, sem edge functions, sem mudanças em `leads_maria`.
- Grid: `lg:grid-cols-[320px_1fr_360px]`, colunas com `overflow-y-auto` independentes, altura `calc(100vh - header)`. Mobile: stack vertical com tabs (Fila / Conversa / Contexto).
- Score/temperatura reaproveita `priorityScore` já existente: >=100 quente (vermelho), >=40 morno (âmbar), resto novo (cinza).
- Filtros rápidos são estado local; "follow-up hoje" usa `next_followup_at` se existir no registro (campo já lido como `any`, sem alterar schema).
- Bolhas de chat renderizam `maria_messages.role` (`user` = cliente à esquerda, `assistant` = MarIA à direita — confirmo cor/lado na entrega).

Confirma que posso executar a Etapa 1 assim? Se quiser trocar algo (ex: ordem das zonas, o que fica no painel direito, manter o Sheet como fallback), me diz antes que eu ajusto o plano.
