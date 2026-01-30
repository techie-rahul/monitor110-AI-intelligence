import Groq from "groq-sdk";

/**
 * Lazy Groq client initialization (avoids env timing issues)
 */
function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Check backend/.env");
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

/**
 * Real LLM analysis using Groq
 */
export async function analyzeWithLLM(query, documents) {
  const client = getGroqClient(); // ✅ FIX 1: create client here

  const context = documents
    .map(
      (doc, i) =>
        `Source ${i + 1} (${doc.source}): ${doc.headline}\n${doc.content}`
    )
    .join("\n\n");

  const prompt = `
You are a financial intelligence analyst.

You MUST ONLY use the information provided below.
Do NOT add external knowledge.

CONTEXT:
${context}

QUERY:
${query}

TASK:
1. Write a 2–3 sentence market narrative
2. Sentiment: POSITIVE / NEUTRAL / NEGATIVE
3. Confidence: CONFIRMED / EMERGING / RUMOR
4. Explain the confidence briefly
5. List key insights (3–4 bullets)

If data is insufficient, say so clearly.

Return ONLY valid JSON in this format:
{
  "narrative": "",
  "sentiment": "",
  "sentimentScore": 0.0,
  "confidence": "",
  "confidenceExplanation": "",
  "keyInsights": []
}
`;

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant", // Groq free + strong
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const analysis = JSON.parse(
    completion.choices[0].message.content
  );

  // ✅ FIX 2: wrap response in expected structure
  return {
    success: true,
    analysis,
    metadata: {
      model: "llama-3.1-8b-instant",
      isMock: false,
      documentsAnalyzed: documents.length,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Mock fallback (used when API key missing or useMock=true)
 */
export function generateMockAnalysis(query, documents) {
  return {
    success: true,
    analysis: {
      narrative:
        "Based on available sources, the market shows mixed but cautiously optimistic signals.",
      sentiment: "POSITIVE",
      sentimentScore: 0.7,
      confidence: "EMERGING",
      confidenceExplanation:
        "The analysis is based on multiple credible sources, but long-term impacts remain uncertain.",
      keyInsights: [
        "AI-related demand continues to drive market momentum",
        "Earnings performance remains strong across major players",
        "Regulatory risks exist but are currently manageable",
      ],
    },
    metadata: {
      model: "MOCK",
      isMock: true,
      documentsAnalyzed: documents.length,
      timestamp: new Date().toISOString(),
    },
  };
}
