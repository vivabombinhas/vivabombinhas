const models = ["openai/gpt-4o", "gpt-4o", "google/gemini-3-flash-preview"];
const lovableApiKey = process.env.LOVABLE_API_KEY;

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
