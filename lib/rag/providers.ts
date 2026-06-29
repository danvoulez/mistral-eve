import { generateEmbeddings } from "./embedding";

export type EmbeddingProvider = {
  id: string;
  dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
};

const gatewayProvider: EmbeddingProvider = {
  id: "gateway",
  dimensions: 1536,
  async embed(texts) {
    return generateEmbeddings(texts);
  },
};

const googleProvider: EmbeddingProvider = {
  id: "google",
  dimensions: 1536,
  async embed() {
    throw new Error(
      "Google embedding provider not configured. Install @ai-sdk/google and set outputDimensionality: 1536.",
    );
  },
};

const localProvider: EmbeddingProvider = {
  id: "local",
  dimensions: 768,
  async embed() {
    throw new Error(
      "Local embedding provider not configured. Install transformers.js and ensure vector column matches the model's native dimension.",
    );
  },
};

const providers = new Map<string, EmbeddingProvider>([
  [gatewayProvider.id, gatewayProvider],
  [googleProvider.id, googleProvider],
  [localProvider.id, localProvider],
]);

export function registerEmbeddingProvider(p: EmbeddingProvider) {
  providers.set(p.id, p);
}

export function resolveEmbeddingProvider(): EmbeddingProvider {
  const id = process.env.EMBEDDING_PROVIDER ?? "gateway";
  return providers.get(id) ?? gatewayProvider;
}
