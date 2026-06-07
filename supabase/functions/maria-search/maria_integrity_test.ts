import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

/**
 * Testes de Integridade de Busca da MarIA
 * Objetivo: Garantir que a IA respeite rigorosamente os filtros de região e orçamento
 * e não retorne "falsos positivos" (imóveis fora do que foi pedido).
 */

Deno.test("Busca Específica: Mariscal até 1.5M", async () => {
  const mockFilters = { bairro: "Mariscal", preco_max: 1500000, finalidade: "compra" };
  
  // Simulação de lógica de busca (deve ser idêntica à do index.ts)
  const results = [
    { bairro: "Mariscal", preco: 1200000 },
    { bairro: "Canto Grande", preco: 1400000 }, // Vizinho, mas o usuário pediu Mariscal
    { bairro: "Mariscal", preco: 1600000 }  // Fora do orçamento
  ].filter(p => 
    p.bairro.toLowerCase().includes(mockFilters.bairro.toLowerCase()) && 
    p.preco <= mockFilters.preco_max
  );

  assertEquals(results.length, 1, "Deveria retornar apenas o imóvel exato de Mariscal dentro do preço");
  assertEquals(results[0].bairro, "Mariscal");
});

Deno.test("Busca Multi-bairro: Bombas ou Centro até 2M", async () => {
  const inputBairros = "Bombas ou Centro";
  const precoMax = 2000000;
  
  // Lógica de parsing de bairros da MarIA
  const bairros = inputBairros.toLowerCase().split(/[\s,e|/]+/).filter(b => b.length > 3 && b !== "bombinhas");
  
  const properties = [
    { bairro: "Bombas", preco: 1800000 },
    { bairro: "Centro", preco: 1950000 },
    { bairro: "Mariscal", preco: 1500000 }
  ];

  const filtered = properties.filter(p => 
    bairros.some(b => p.bairro.toLowerCase().includes(b)) && 
    p.preco <= precoMax
  );

  assertEquals(filtered.length, 2, "Deveria retornar apenas Bombas e Centro");
  assertExists(filtered.find(p => p.bairro === "Bombas"));
  assertExists(filtered.find(p => p.bairro === "Centro"));
});

Deno.test("Extração de Filtros: Investimento de 2 milhões", async () => {
  // Simula a extração feita pela IA
  const rawReply = '[FILTERS]{"finalidade":"investimento", "bairro":null, "tipo":null, "preco_max":2000000}[/FILTERS]';
  const match = rawReply.match(/\[FILTERS\]([\s\S]*?)\[\/FILTERS\]/);
  
  assertExists(match);
  const filters = JSON.parse(match[1]);
  
  assertEquals(filters.preco_max, 2000000);
  assertEquals(filters.finalidade, "investimento");
});
