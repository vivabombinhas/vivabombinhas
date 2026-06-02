const models = ["openai/gpt-5", "openai/gpt-5.5-pro", "openai/gpt-4o", "openai/gpt-4o-mini"];
const lovableApiKey = process.env.LOVABLE_API_KEY;

if (!lovableApiKey) {
  console.error("LOVABLE_API_KEY not found");
  process.exit(1);
}

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
