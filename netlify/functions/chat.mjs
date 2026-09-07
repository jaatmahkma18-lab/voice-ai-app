export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405 });
  }

  try {
    const body = await req.json();
    const prompt = body.prompt;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key is missing in Netlify settings." }), { status: 500 });
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: "No prompt provided." }), { status: 400 });
    }

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await apiResponse.json();
    
    let reply = "No response from AI.";
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      reply = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      reply = "API Error: " + data.error.message;
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error: " + error.message }), { status: 500 });
  }
};
