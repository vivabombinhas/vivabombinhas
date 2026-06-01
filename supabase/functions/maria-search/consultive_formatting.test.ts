import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";

/**
 * Helper to count sentences in a text.
 */
function countSentences(text: string): number {
  const cleanText = text.replace(/^[ \t]*[-*•]\s+/gm, "").replace(/^\d+\.\s+/gm, "");
  const sentences = cleanText.split(/[.!?]+(?:\s+|$)/).filter(s => s.trim().length > 0);
  return sentences.length;
}

/**
 * Helper to count bullet points in a text.
 */
function countBullets(text: string): number {
  const lines = text.split("\n");
  const bullets = lines.filter(line => 
    line.trim().startsWith("-") || 
    line.trim().startsWith("*") || 
    line.trim().startsWith("•") ||
    /^\d+\.\s+/.test(line.trim())
  );
  return bullets.length;
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const CONSULTIVO_CHAT_PROMPT = `Você é a MarIA, pré-consultora estratégica em Bombinhas (Mariscal, Bombas, Canto Grande, Quatro Ilhas). Seja premium, direta e estratégica.

REGRAS DE CONTEÚDO:
- REGRAS DE OURO: Use no máximo 4 frases CURTAS no total, contando bullets e perguntas. No máximo 3 bullets. É proibido ultrapassar 4 frases no total.
- TOM: Local, inteligente e objetivo. Sem hype ou tom de corretor. Use "costuma ter boa procura", "precisa ser comparado", "vale analisar com critério".
- METRO QUADRADO: Não invente valores. Explique que o valor m² varia drasticamente por distância do mar, padrão e idade do imóvel.
- CONDUÇÃO: Responda de forma útil e faça 1 pergunta estratégica (ex: busca renda, valorização ou uso próprio?).

REGRAS PARA "SEM RESULTADOS":
- Se perceber que não há imóveis exatos para o que o usuário busca, JAMAIS comece com "não encontrei", "não temos", "sem opções" ou qualquer frase negativa.
- Comece com uma leitura estratégica da região/perfil. Explique que, para investimento/moradia, limitar a decisão ao que está visível agora no portal pode não ser o melhor caminho.
- Ofereça comparação de regiões (ex: Mariscal vs Bombas) ou análise de perfil estratégica com o Daniel.
- Só mencione que não há opção exata agora se for perguntado diretamente ("Mas tem imóvel?") ou após propor o próximo passo estratégico.

DANIEL E LEAD:
- Ofereça análise estratégica com o Daniel para leads qualificados (>1.5M ou dúvidas estratégicas).
- Se o usuário aceitar, peça Nome e WhatsApp imediatamente: "Para encaminhar seu perfil corretamente, me informe seu nome e WhatsApp."
- Não diga "vou registrar seu interesse" sem antes ter o contato.
- Só emita [FILTERS] se ele pedir explicitamente para ver opções agora.`;

async function callMaria(message: string, history: any[] = []) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${LOVABLE_API_KEY}` 
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: CONSULTIVO_CHAT_PROMPT },
        ...history,
        { role: "user", content: message }
      ],
      temperature: 0,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

Deno.test("Consultive Mode: No results should NOT start with negative", async () => {
  if (!LOVABLE_API_KEY) return;

  const reply = await callMaria("Procuro cobertura em Mariscal de frente para o mar até 1 milhão para investir.");
  console.log(`Reply for unrealistic request: "${reply}"`);
  
  const lowerReply = reply.toLowerCase();
  const startsWithNegative = lowerReply.startsWith("não encontrei") || 
                           lowerReply.startsWith("infelizmente") || 
                           lowerReply.startsWith("não temos") ||
                           lowerReply.startsWith("sem resultados");
  
  assert(!startsWithNegative, "Should not start with a negative phrase for investment flows.");
  assert(reply.length > 20, "Should provide a strategic reading.");
});

Deno.test("Consultive Mode: Short sentence count check (2-4 sentences)", async () => {
  if (!LOVABLE_API_KEY) return;

  const testCases = [
    "Qual o valor do metro quadrado em Mariscal?",
    "Quero investir 5 milhões em Bombinhas para renda.",
  ];

  for (const input of testCases) {
    const reply = await callMaria(input);
    const sentences = countSentences(reply);
    assert(sentences >= 2 && sentences <= 4, `Sentences should be between 2 and 4. Got: ${sentences}\nReply: ${reply}`);
  }
});
