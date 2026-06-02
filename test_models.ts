const models = ["openai/gpt-5", "openai/gpt-5.5-pro", "openai/gpt-4o", "openai/gpt-4o-latest"];
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

for (const model of models) {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5
      }),
    });
    console.log(`${model}: ${response.status} ${response.statusText}`);
  } catch (err) {
    console.log(`${model}: Error ${err.message}`);
  }
}
