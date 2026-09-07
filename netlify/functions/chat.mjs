import { GoogleGenAI } from "@google/genai";

export async function handler(event) {
  // Only POST requests are allowed
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  }

  try {
    // Read request body safely
    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();

    if (!message) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Message is required"
        })
      };
    }

    // Get Gemini API key from Netlify Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "GEMINI_API_KEY is not set in Netlify Environment Variables"
        })
      };
    }

    // Initialize Google Gemini
    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    // Current stable Gemini Flash model
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: message
    });

    const responseText = response.text || "Sorry, I could not generate a response.";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reply: responseText
      })
    };

  } catch (error) {
    console.error("Gemini Function Error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: error?.message || "Something went wrong"
      })
    };
  }
}
