
# Plano final — Da MarIA atual até "pronto pra divulgar"

Decisões travadas nesta conversa:
- **Fotos**: menu textual dentro do WhatsApp (nada automático, nada de botões nativos ainda).
- **Nomenclatura**: "Falar com especialista" (não "Daniel", não "corretor").
- **Número de teste**: `41998251888` — tratado como número do especialista em toda a jornada. Facilmente substituível em `config_imobiliaria`.
- **Botões interativos nativos**: adiados para depois da migração pra WhatsApp Business API oficial (não neste plano).

Legenda: 🤖 eu faço · 👤 você faz · 🤝 juntos

---

## SPRINT 1 — Card, fotos e handoff (esta semana)

### 1.1 Card de gestão própria aponta pro especialista 🤖
Em `PropertyCard.tsx`:
- Quando `gestao_propria = true`: botão WhatsApp usa o número de `config_imobiliaria` (hoje `41998251888` pra teste, depois vira o do Daniel real).
- Selo "Exclusivo VIV" visível sobre a foto (badge distinto do "Oportunidade Premium").
- Mensagem pré-preenchida: "Oi! Quero falar com um especialista sobre o imóvel [título] (Exclusivo VIV Bombinhas)".
- Imóveis de terceiros: botão continua indo pro `anunciante_telefone` normal.

### 1.2 Menu textual no card do WhatsApp 🤖 + 👤
Quando a MarIA envia um card no WhatsApp, a mensagem termina com:
```
Quer saber mais? É só responder:
1️⃣ Ver mais fotos
2️⃣ Falar com especialista
3️⃣ Ver o anúncio completo
```
- 🤖 Ajusto o template de card no `maria-search` (formato que vai pro Core montar a mensagem).
- 👤 Você atualiza o system prompt do MarIA Core (Render) pra interpretar "1"/"fotos", "2"/"especialista"/"humano", "3"/"anúncio" no contexto do último imóvel recomendado. Te entrego o texto pronto.

### 1.3 Edge function `maria-send-photos` 🤖
Nova função autenticada por `x-core-secret`:
- Recebe `{ phone, imovel_id }`.
- Busca até 5 fotos (prioridade: `fotos` → `photos_groups.likely`).
- Dispara álbum via `maria-core-whatsapp` (já existe, usa Z-API).
- Registra evento em `maria_core_events` pra observabilidade.

### 1.4 Ação "especialista" no Core 🤝
Quando o cliente digita "2" ou pede especialista:
- 🤖 Crio endpoint `maria-request-especialista` que marca `quer_falar_daniel=true` no lead e insere mensagem interna no CRM.
- 👤 Prompt do Core ganha instrução: "Se cliente pedir falar com especialista, confirme educadamente ('Já vou chamar o Daniel, nosso especialista em Bombinhas, ele te chama por aqui') e chame o endpoint".

**Entregável Sprint 1**: cliente recebe card enxuto com 3 opções claras. Fotos só quando pedido. Handoff pro especialista fluido. Testa você mesma no `41998251888`.

---

## SPRINT 2 — Estoque e curadoria (semana 2)

### 2.1 Prompt do Manus 🤖
Entrego prompt completo pra você rodar no Manus:
- Alvos: VivaReal, ZAP, OLX, Chaves na Mão, sites de imobiliárias locais.
- Bairros: Bombas, Mariscal, Canto Grande, Centro, Sertãozinho, Zimbros, Quatro Ilhas.
- Filtros de preço realistas por tipo/finalidade.
- Saída: **CSV com coluna `link`** (compatível com o importador em lote que já existe).
- Instrução anti-duplicata (Manus filtra URLs já vistas).

### 2.2 Execução 👤
Você roda o Manus, cola o CSV em `/admin/importar-links-lote` (30 por vez). Tudo entra pausado/oculto.

### 2.3 Curadoria em massa 🤖 + 👤
- 🤖 Em `/admin/imoveis` adiciono:
  - Filtro rápido "Só rascunhos".
  - Coluna "Quality Score" ordenável.
  - Botão "Aprovar em lote" — só habilita pra imóveis com título + preço + bairro + tipo + ≥1 foto.
- 👤 Você/equipe revisa e aprova.

**Meta**: ≥ 100 imóveis ativos revisados antes de abrir tráfego.

---

## SPRINT 3 — Jurídico, métricas e landing (semanas 3-4)

### 3.1 LGPD 🤝
- 🤖 Crio `/privacidade` e `/termos` (template LGPD específico pra WhatsApp + captura de lead).
- 🤖 Ajusto primeira mensagem da MarIA pra incluir opt-in ("Ao continuar, você concorda com nossos termos [link]").
- 🤖 Footer do site com links.
- 👤 Você revisa o texto com apoio jurídico (não sou advogado).

### 3.2 WhatsApp Business API 👤
Decisão sua fora deste plano: quando/se migrar `41998251888` (ou número final do Daniel) pra API oficial. Sem isso, botões interativos não funcionam. Enquanto isso, menu textual segura bem.

### 3.3 Dashboard de conversão 🤖
Nova página `/admin/insights` (agrega tabelas que já existem):
- Conversas iniciadas (7d/30d).
- Taxa de qualificação (leads com nome+telefone / conversas iniciadas).
- Taxa de handoff pro especialista.
- Tempo médio até primeira resposta humana.
- Uso do menu textual: quantos clicaram em "fotos" vs "especialista" vs "anúncio".

### 3.4 Landing + tracking 🤝
- 🤖 GA4 e Meta Pixel (👤 você me passa os IDs).
- 🤖 SEO local nas meta tags ("imóveis Bombinhas", "temporada Mariscal", etc).
- 👤 Você me envia 2–3 depoimentos reais (texto + foto/nome) — 🤖 eu ponho na home.

### 3.5 SLA e cobertura 👤
Você define: tempo de resposta esperado do especialista pra lead quente? Cobertura fora de horário? Se quiser, 🤖 crio um "modo férias" no admin que muda a mensagem automática da MarIA.

---

## Detalhes técnicos (só o que muda no Sprint 1)

**Arquivos:**
- `src/components/maria/PropertyCard.tsx` — lógica gestão própria + selo Exclusivo VIV.
- `supabase/functions/maria-send-photos/index.ts` — **nova**.
- `supabase/functions/maria-request-especialista/index.ts` — **nova** (marca `quer_falar_daniel`).
- `supabase/functions/maria-search/index.ts` — anexa menu textual "1/2/3" no fim de cada card enviado ao Core.
- `src/lib/maria-whatsapp.ts` — nenhuma mudança (o número já vem daqui).

**Banco:** nada. Sprint 3 talvez precise de 1 view materializada pra insights, mas não é bloqueante.

**Segurança:** ambas as novas functions autenticadas via `x-core-secret` (padrão já em uso), sem exposição ao browser.

**Configuração do especialista:** eu leio de `config_imobiliaria` (já existe). Não hardcode número no código. Você troca no admin quando o Daniel entrar.

---

## Ordem de execução (Sprint 1)

1. 🤖 1.1 (card gestão própria) — 30 min, sem depender de nada externo.
2. 🤖 1.3 (edge `maria-send-photos`) — 1h, testável isolado.
3. 🤖 1.4 (edge `maria-request-especialista`) — 30 min.
4. 🤖 1.2 (menu textual no card) — 30 min no lado da edge.
5. 🤝 Te entrego o **texto do prompt do Core** pra você colar no Render.
6. 🤝 Você testa mandando "oi" pro `41998251888` como cliente e valida o fluxo inteiro.

Se aprovar, começo por 1.1 e 1.3 agora e paro pra você validar antes de avançar pro 1.2 e 1.4.
