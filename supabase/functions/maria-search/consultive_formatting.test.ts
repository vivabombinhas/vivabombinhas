import { assertEquals, assertGreaterOrEqual, assertLessOrEqual } from "https://deno.land/std@0.168.0/testing/asserts.ts";

/**
 * Helper to count sentences in a text.
 */
function countSentences(text: string): number {
  // Remove bullet points before counting sentences to avoid confusion
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
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Mocking the environment for the test if needed, but here we want to test the actual prompt behavior
// if possible, or at least the logic that would be used.

async function callMaria(message: string) {
  // We can't easily call the 'serve' function directly from a test without exporting it.
  // But we can test the AI response by simulating what the Edge Function does.
  
  // Since we want to validate the PROMPT behavior, we'll call the AI Gateway with the CONSULTIVO_CHAT prompt.
  const PROMPTS = {
    CONSULTIVO_CHAT: `Você é a MarIA, pré-consultora estratégica em Bombinhas (Mariscal, Bombas, Canto Grande, Quatro Ilhas). Seja premium, direta e estratégica.

REGRAS DE CONTEÚDO:
- RESPOSTAS CURTAS: 2 a 4 frases curtas. No máximo 1 lista de 3 bullets se essencial. Nunca escreva textão.
- TOM: Local, inteligente e objetivo. Sem hype ("oportunidade única", "valorização garantida") ou tom de corretor. Use "costuma ter boa procura", "precisa ser comparado", "vale analisar com critério".
- METRO QUADRADO: Não invente valores. Responda que não pode passar um número solto sem contexto pois varia por distância do mar, vista, padrão e idade do imóvel.
- CONDUÇÃO: Responda de forma útil e faça 1 pergunta estratégica (ex: busca renda, valorização ou uso próprio?). Conduza o usuário em etapas.

DANIEL E LEAD:
- Ofereça análise estratégica com o Daniel para leads qualificados (>1.5M ou dúvidas estratégicas).
- Apresente o Daniel como análise humana estratégica de risco e coerência, não como vendedor.
- Se o usuário aceitar ou quiser análise, peça Nome e WhatsApp imediatamente: "Para encaminhar seu perfil corretamente, me informe seu nome e WhatsApp."
- Não diga "vou registrar seu interesse" sem antes ter o contato. Não prometa retorno imediato.
- Só emita [FILTERS] se ele pedir explicitamente para ver opções agora.`
  };

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${LOVABLE_API_KEY}` 
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash", // Using flash for tests
      messages: [
        { role: "system", content: PROMPTS.CONSULTIVO_CHAT },
        { role: "user", content: message }
      ],
      temperature: 0,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

Deno.test("Consultive Mode: Short sentence count check (2-4 sentences)", async () => {
  if (!LOVABLE_API_KEY) {
    console.warn("Skipping test: LOVABLE_API_KEY not found");
    return;
  }

  const testCases = [
    "Qual o valor do metro quadrado em Mariscal?",
    "Quero investir 5 milhões em Bombinhas para renda.",
    "Quais os riscos de investir em Bombinhas hoje?"
  ];

  for (const input of testCases) {
    console.log(`Testing input: "${input}"`);
    const reply = await callMaria(input);
    console.log(`Reply: "${reply}"`);
    
    const sentences = countSentences(reply);
    const bullets = countBullets(reply);
    
    console.log(`Sentences: ${sentences}, Bullets: ${bullets}`);
    
    assertGreaterOrEqual(sentences, 2, `Should have at least 2 sentences. Got: ${sentences}\nReply: ${reply}`);
    assertLessOrEqual(sentences, 5, `Should have at most 4-5 sentences (allowing a bit of slack for greetings/signoffs). Got: ${sentences}\nReply: ${reply}`);
    assertLessOrEqual(bullets, 3, `Should have at most 3 bullets. Got: ${bullets}\nReply: ${reply}`);
  }
});

Deno.test("Consultive Mode: Max bullets check", async () => {
  if (!LOVABLE_API_KEY) return;

  const reply = await callMaria("Me dê 5 razões para investir em Mariscal.");
  const bullets = countBullets(reply);
  
  console.log(`Reply for 5 reasons: "${reply}"`);
  console.log(`Bullets count: ${bullets}`);
  
  assertLessOrEqual(bullets, 3, "Even if asked for more, it should strictly follow the 3 bullets limit.");
});
