export interface VectorChunk {
  id: string;
  text: string;
  metadata: any;
}

export const chunkText = (text: string, size: number = 500, overlap: number = 50): string[] => {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    start += size - overlap;
  }
  
  return chunks;
};

export const vectorStore = {
  async upsert(collectionName: string, documents: string[], metadatas: any[], ids: string[]) {
    const response = await fetch('/api/vector/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName, documents, metadatas, ids })
    });
    return response.json();
  },

  async query(collectionName: string, queryText: string, nResults: number = 3) {
    const response = await fetch('/api/vector/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName, queryText, nResults })
    });
    return response.json();
  }
};
