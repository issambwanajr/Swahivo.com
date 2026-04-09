import { GoogleGenAI } from "@google/genai";

let aiInstance: any = null;

export function getGemini() {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }
  return aiInstance;
}

export async function getEmbedding(text: string, isQuery: boolean = false) {
  try {
    const ai = getGemini();
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: [{ parts: [{ text }] }],
      config: {
        taskType: isQuery ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
        outputDimensionality: 512,
      }
    });
    return result.embeddings[0].values;
  } catch (error) {
    console.error("Embedding error:", error);
    throw error;
  }
}
