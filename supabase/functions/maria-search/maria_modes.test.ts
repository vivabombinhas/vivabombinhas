import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { PROMPTS, callAI, safeParseJSON } from "./maria-logic.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.test("MarIA - Intent Routing Validation", async () => {
  if (!LOVABLE_API_KEY) return;

  const scenarios = [
    { input: "Quero ver casas em Mariscal até 1.5M", expected: "busca" },
    { input: "Vale a pena investir em Bombinhas?", expected: "consultivo" },
    { input: "Qual o valor do m2 em Canto Grande?", expected: "consultivo" },
    { input: "Quero anunciar meu apartamento para temporada", expected: "proprietario" },
    { input: "Oi, como você pode me ajudar?", expected: "comum" },
  ];

  for (const scenario of scenarios) {
    const reply = await callAI(LOVABLE_API_KEY, "google/gemini-3-flash-preview", PROMPTS.ROUTER, [{ role: "user", content: scenario.input }], 0);
    const data = safeParseJSON(reply);
    console.log(`Input: "${scenario.input}" -> Intent: ${data?.intent}`);
    assertEquals(data?.intent, scenario.expected, `Failed for input: ${scenario.input}`);
  }
});

Deno.test("MarIA - Consultivo Mode: Tone and Negative Check", async () => {
  if (!LOVABLE_API_KEY) return;

  const input = "Procuro uma oportunidade de investimento em Mariscal com retorno garantido.";
  const reply = await callAI(LOVABLE_API_KEY, "google/gemini-3-flash-preview", PROMPTS.CONSULTIVO_CHAT, [{ role: "user", content: input }], 0);
  
  console.log(`Consultivo Reply: "${reply}"`);
  
  const lowerReply = reply.toLowerCase();
  
  // Prohibitions check
  const hasForbidden = ["garantido", "excelente", "com certeza", "melhores oportunidades", "off-market"].some(word => lowerReply.includes(word));
  assert(!hasForbidden, "Reply contains forbidden words.");

  // Negative start check
  const startsWithNegative = lowerReply.startsWith("não encontrei") || 
                             lowerReply.startsWith("não temos") || 
                             lowerReply.startsWith("infelizmente");
  assert(!startsWithNegative, "Consultivo reply should not start with negative phrase.");
  
  // Strategic reading check
  assert(reply.length > 50, "Reply should be a strategic reading, not too short.");
});

Deno.test("MarIA - Busca Mode: Objective Check", async () => {
  if (!LOVABLE_API_KEY) return;

  const input = "Quero ver apartamentos de 2 quartos em Bombas.";
  const reply = await callAI(LOVABLE_API_KEY, "google/gemini-3-flash-preview", PROMPTS.BUSCA_CHAT, [{ role: "user", content: input }], 0);
  
  console.log(`Busca Reply: "${reply}"`);
  
  // Check if it's objective (not too long)
  const sentences = reply.split(/[.!?]+/).filter((s: string) => s.trim().length > 0).length;
  assert(sentences <= 5, "Busca reply should be objective and short.");
});

Deno.test("MarIA - Proprietario Mode: Logic Check", async () => {
  if (!LOVABLE_API_KEY) return;

  const input = "Tenho uma casa para anunciar no portal.";
  const reply = await callAI(LOVABLE_API_KEY, "google/gemini-3-flash-preview", PROMPTS.PROPRIETARIO_CHAT, [{ role: "user", content: input }], 0);
  
  console.log(`Proprietario Reply: "${reply}"`);
  
  const lowerReply = reply.toLowerCase();
  const mentionsSaleOrSeason = lowerReply.includes("venda") || lowerReply.includes("temporada");
  const mentionsMatching = lowerReply.includes("combinam") || lowerReply.includes("match") || lowerReply.includes("buscas");
  
  assert(mentionsSaleOrSeason, "Should ask if it's for sale or vacation/season.");
  assert(mentionsMatching, "Should explain that properties are recommended based on real searches.");
});

Deno.test("MarIA - Comum Mode: Role Explanation", async () => {
  if (!LOVABLE_API_KEY) return;

  const input = "O que você faz?";
  const reply = await callAI(LOVABLE_API_KEY, "google/gemini-3-flash-preview", PROMPTS.COMUM_CHAT, [{ role: "user", content: input }], 0);
  
  console.log(`Comum Reply: "${reply}"`);
  
  const lowerReply = reply.toLowerCase();
  const coversAllBases = (lowerReply.includes("encontrar") || lowerReply.includes("busca")) && 
                         (lowerReply.includes("investir") || lowerReply.includes("investimento")) && 
                         (lowerReply.includes("anunciar") || lowerReply.includes("vender"));
  
  assert(coversAllBases, "Comum reply should explain help for finding, investing, and announcing.");
});
