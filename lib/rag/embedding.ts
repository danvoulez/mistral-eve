import { embed, embedMany } from "ai";

export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL ?? "openai/text-embedding-3-small";

export async function generateEmbedding(text: string) {
  // A bare provider/model string routes through the AI Gateway on the
  // project's existing credential — same path the agent's inference uses.
  const { embedding } = await embed({ model: EMBEDDING_MODEL, value: text.trim() });
  return embedding;
}

// Batch path for ingestion — one round trip for a whole document's chunks.
export async function generateEmbeddings(texts: string[]) {
  const { embeddings } = await embedMany({ model: EMBEDDING_MODEL, values: texts });
  return embeddings;
}
