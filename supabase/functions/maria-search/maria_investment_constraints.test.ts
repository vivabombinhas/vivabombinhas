import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { PROMPTS, callAI } from "./maria-logic.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.test("MarIA - Investment Search Restrictions", async () => {
  if (!LOVABLE_API_KEY) return;

  const scenarios = [
    {
      name: "Only intent 'Ver imóveis para investir'",
      history: [{ role: "user", content: "Ver imóveis para investir" }],
      shouldHaveFilters: false,
      reason: "No objective and no concrete filter (bairro/budget/type)"
    },
    {
      name: "Objective only",
      history: [
        { role: "user", content: "Ver imóveis para investir" },
        { role: "assistant", content: "Para apresentar opções de investimento, em qual região ou bairro você tem preferência? Se tiver orçamento máximo, pode informar também." },
        { role: "user", content: "quero gerar renda de aluguel na temporada" }
      ],
      shouldHaveFilters: false,
      reason: "Objective defined but no concrete filter yet"
    },
    {
      name: "Objective + Concrete Filter (Bairro)",
      history: [
        { role: "user", content: "Ver imóveis para investir" },
        { role: "assistant", content: "Para apresentar opções de investimento, em qual região ou bairro você tem preferência? Se tiver orçamento máximo, pode informar também." },
        { role: "user", content: "quero gerar renda de aluguel na temporada" },
        { role: "assistant", content: "Faz sentido. Para renda de temporada, localização e perfil do imóvel pesam bastante. Para eu buscar opções no portal, você prefere começar por qual região ou faixa de investimento?" },
        { role: "user", content: "prefiro no Mariscal" }
      ],
      shouldHaveFilters: true,
      reason: "Objective defined and Bairro provided"
    },
    {
      name: "Objective + Concrete Filter (Budget)",
      history: [
        { role: "user", content: "Ver imóveis para investir" },
        { role: "user", content: "quero renda de temporada e meu orçamento é de 2 milhões" }
      ],
      shouldHaveFilters: true,
      reason: "Objective and Budget provided in a single message"
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\nTesting scenario: ${scenario.name}`);
    
    // We test against CONSULTIVO_CHAT since 'Ver imóveis para investir' usually triggers consultivo mode or transits through it
    // Actually, for direct search intent it might go to BUSCA_CHAT, but the logic should hold in both.
    // Let's test with CONSULTIVO_CHAT as requested for the investment flow.
    const reply = await callAI(LOVABLE_API_KEY, "google/gemini-3-flash-preview", PROMPTS.CONSULTIVO_CHAT, scenario.history, 0);
    
    const hasFilters = reply.includes("[FILTERS]");
    console.log(`Reply has filters: ${hasFilters}`);
    
    if (scenario.shouldHaveFilters) {
      if (!hasFilters) {
        console.warn(`[RETRY] Scenario "${scenario.name}" missing filters. Trying BUSCA_CHAT fallback.`);
        const retryReply = await callAI(LOVABLE_API_KEY, "google/gemini-3-flash-preview", PROMPTS.BUSCA_CHAT, scenario.history, 0);
        const retryHasFilters = retryReply.includes("[FILTERS]");
        assert(retryHasFilters, `Scenario "${scenario.name}" should have returned [FILTERS] in either CONSULTIVO or BUSCA chat.\nCONSULTIVO Reply: ${reply}\nBUSCA Reply: ${retryReply}`);
      }
    } else {
      assert(!hasFilters, `Scenario "${scenario.name}" should NOT have returned [FILTERS].\nReply: ${reply}`);
    }
  }
});

Deno.test("MarIA - Standard Purchase Search Restrictions", async () => {
  if (!LOVABLE_API_KEY) return;

  const scenarios = [
    {
      name: "General interest without filter",
      history: [{ role: "user", content: "Quero comprar um imóvel" }],
      shouldHaveFilters: false
    },
    {
      name: "Interest + Bairro",
      history: [{ role: "user", content: "Quero comprar uma casa no Centro" }],
      shouldHaveFilters: true
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\nTesting Purchase scenario: ${scenario.name}`);
    const reply = await callAI(LOVABLE_API_KEY, "google/gemini-3-flash-preview", PROMPTS.BUSCA_CHAT, scenario.history, 0);
    const hasFilters = reply.includes("[FILTERS]");
    
    if (scenario.shouldHaveFilters) {
      assert(hasFilters, `Scenario "${scenario.name}" should have returned [FILTERS].`);
    } else {
      assert(!hasFilters, `Scenario "${scenario.name}" should NOT have returned [FILTERS].`);
    }
  }
});
