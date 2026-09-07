import { GoogleGenAI } from "@google/genai";

export async function handler(event) {
  // 1. Only POST requests are allowed
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // 2. Read request body safely
    let body = {};
    if (event.body) {
      try {
        body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      } catch (e) {
        body = {};
      }
    }

    // Support both 'message' and 'prompt' keys from frontend
    const message = String(body.message || body.prompt || "").trim();

    if (!message) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Message is required" }),
      };
    }

    // 3. Get Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "GEMINI_API_KEY is not set in Netlify Environment Variables" }),
      };
    }

    // 4. Initialize Google Gemini
    const ai = new GoogleGenAI({ apiKey });

    // 5. Call valid stable Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: message,
    });

    const responseText = response.text || "Sorry, I could not generate a response.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: responseText }),
    };
  } catch (error) {
    console.error("Gemini Function Error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "Something went wrong" }),
    };
  }
}
