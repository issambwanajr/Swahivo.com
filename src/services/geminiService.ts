import { GoogleGenAI } from "@google/genai";

let aiInstance: any = null;

export function getGemini() {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }
  return aiInstance;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded'))) {
      console.log(`Quota hit, retrying in ${delay}ms... (${retries} retries left)`);
      await sleep(delay);
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function getEmbedding(text: string, isQuery: boolean = false) {
  return withRetry(async () => {
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
  });
}

export async function batchGetEmbeddings(texts: string[]) {
  const batchSize = 10; // Process in small batches to respect quota
  const results: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing embedding batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(texts.length / batchSize)}`);
    
    const batchResults = await Promise.all(batch.map(text => getEmbedding(text, false)));
    results.push(...batchResults);
    
    if (i + batchSize < texts.length) {
      await sleep(500); // Small delay between batches
    }
  }
  
  return results;
}

export async function summarizeText(text: string) {
  return withRetry(async () => {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Please provide a concise summary of the following text. Focus on the main points and key takeaways. Keep it under 200 words.\n\nText:\n${(text || "").substring(0, 30000)}`, // Limit input size
    });
    return response.text;
  });
}

export async function getAgentPlan(query: string, history: any[], documents: any[]) {
  return withRetry(async () => {
    const ai = getGemini();
    const docList = documents.map(d => `- ${d.title} (${d.type})`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a Research Architect. Given a user query and a list of available documents, plan the research steps.
      Determine if we need to search local documents, scrape a website (if a URL is provided or implied), or just answer from knowledge.
      
      Available Documents:
      ${docList}
      
      User Query: ${query}
      
      Return a JSON object with:
      {
        "steps": ["Step 1...", "Step 2..."],
        "searchQueries": ["query 1", "query 2"],
        "needsWebScrape": "URL_TO_SCRAPE_OR_NULL",
        "reasoning": "Brief explanation of the plan"
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text);
  });
}

export async function synthesizeAnswer(query: string, context: string, history: any[]) {
  return withRetry(async () => {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are Noteflow, an advanced research assistant.
      Use the provided context to answer the query accurately. 
      CITE your sources using [Title, Page] format.
      If the context is insufficient, say so, but provide what you can.
      
      Context:
      ${context}
      
      User Query: ${query}`,
      config: {
        systemInstruction: "You are a world-class researcher. Be precise, academic yet accessible, and always cite sources."
      }
    });
    return response.text;
  });
}

export async function rerankResults(query: string, matches: any[]) {
  if (matches.length <= 3) return matches;
  
  return withRetry(async () => {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a Search Specialist. Rank these context snippets for relevance to the user's query.
      Query: ${query}
      
      Snippets:
      ${matches.map((m, i) => `ID ${i}: [${m.metadata.title}] ${m.metadata.text.substring(0, 300)}...`).join('\n\n')}
      
      Return a JSON array of the IDs in order of most relevant to least relevant. Only return top 5 IDs.
      Example: [2, 0, 5, 1, 3]`,
      config: {
        responseMimeType: "application/json"
      }
    });
    const order = JSON.parse(response.text);
    return order.map((idx: number) => matches[idx]).filter(Boolean);
  });
}
