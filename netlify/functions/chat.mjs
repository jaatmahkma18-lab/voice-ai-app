import { GoogleGenerativeAI } from "@google/generative-ai";

export async function handler(event) {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  // Allow only POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    // Read request body safely
    let body = {};
    if (event.body) {
      try {
        body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      } catch (e) {
        body = {};
      }
    }

    // Support prompt/message keys from frontend
    const message = String(body.message || body.prompt || "").trim();

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Message is required" })
      };
    }

    // Get API Key from Netlify Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "GEMINI_API_KEY is missing in Netlify Environment Variables" })
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // List of model aliases to attempt sequentially
    const modelCandidates = [
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro"
    ];

    let responseText = "";
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(message);
        const res = await result.response;
        responseText = res.text();
        if (responseText) break; // Success, exit loop
      } catch (err) {
        lastError = err;
        console.warn(`Failed with model ${modelName}:`, err.message);
      }
    }

    if (!responseText) {
      throw lastError || new Error("Failed to get response from Gemini API");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: responseText })
    };

  } catch (error) {
    console.error("Gemini Handler Error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "An unexpected error occurred"
      })
    };
  }
}
