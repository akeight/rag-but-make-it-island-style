// scripts/embed_backfill.ts
//
// Backfills OpenAI embeddings for docs in `chunks` that are missing `embedding`.
//
// Usage:
//   bun scripts/embed_backfill.ts


import OpenAI from "openai";
import { MongoClient, type AnyBulkWriteOperation, type Document } from "mongodb";

function env(name: string, fallback?: string) {
  const v = process.env[name];
  return v == null || v === "" ? fallback : v;
}
function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseJsonFilter(raw: string): Record<string, unknown> {
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? (obj as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

type HttpErrorLike = {
  status?: number;
  headers?: Record<string, string>;
  response?: {
    status?: number;
    headers?: Record<string, string>;
  };
};

function getRetryInfo(err: unknown): { status?: number; retryAfter?: number } {
  if (!err || typeof err !== "object") {
    return {};
  }

  const errorLike = err as HttpErrorLike;
  const status = typeof errorLike.status === "number"
    ? errorLike.status
    : typeof errorLike.response?.status === "number"
      ? errorLike.response.status
      : undefined;

  const retryAfterRaw =
    errorLike.headers?.["retry-after"] ??
    errorLike.response?.headers?.["retry-after"];

  const retryAfter = typeof retryAfterRaw === "string" || typeof retryAfterRaw === "number"
    ? Number(retryAfterRaw)
    : undefined;

  return {
    status,
    retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
  };
}

async function embedWithRetry(openai: OpenAI, model: string, input: string[], attempt = 1): Promise<number[][]> {
  try {
    const resp = await openai.embeddings.create({ model, input });
    // resp.data is aligned with input order
    return resp.data.map((d) => d.embedding as number[]);
  } catch (err) {
    const retryInfo = getRetryInfo(err);
    const status = retryInfo.status ?? 0;
    const retryAfter = retryInfo.retryAfter ?? NaN;
    const is429 = status === 429;

    if (attempt <= 8 && (is429 || status >= 500)) {
      const backoff = Number.isFinite(retryAfter)
        ? Math.max(1, retryAfter) * 1000
        : Math.min(60_000, attempt * attempt * 800);

      await sleep(backoff + Math.floor(Math.random() * 400));
      return embedWithRetry(openai, model, input, attempt + 1);
    }

    throw err;
  }
}

async function ensureIndexes(db: ReturnType<MongoClient["db"]>) {
  // For later: vector search index is created in Atlas UI, not here.
  await db.collection("chunks").createIndex({ chunkKey: 1 }, { unique: true });
  await db.collection("chunks").createIndex({ embeddedAt: 1 });
}

async function main() {
  const mongoUri = mustEnv("MONGODB_URI");
  const dbName = env("MONGODB_DB", "epstein_rag")!;
  const apiKey = mustEnv("OPENAI_API_KEY");

  const model = env("EMBED_MODEL", "text-embedding-3-small")!;
  const batchSize = Math.max(1, Number(env("EMBED_BATCH_SIZE", "64")!));
  const delayMs = Math.max(0, Number(env("EMBED_DELAY_MS", "250")!));
  const maxChunks = Math.max(0, Number(env("EMBED_MAX_CHUNKS", "0")!));
  const extraFilter = parseJsonFilter(env("EMBED_QUERY_FILTER", "{}")!);

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);

  await ensureIndexes(db);

  const openai = new OpenAI({ apiKey });

  console.log(`[embed] DB: ${dbName}`);
  console.log(`[embed] model=${model} batchSize=${batchSize} delayMs=${delayMs} maxChunks=${maxChunks || "∞"}`);

  let processed = 0;
  let lastDims: number | null = null;

  while (true) {
    if (maxChunks > 0 && processed >= maxChunks) {
      console.log("[embed] Reached EMBED_MAX_CHUNKS cap. Done.");
      break;
    }

    const remaining = maxChunks > 0 ? (maxChunks - processed) : batchSize;
    const limit = maxChunks > 0 ? Math.min(batchSize, remaining) : batchSize;

    const filter: Record<string, unknown> = {
      embedding: { $exists: false },
      text: { $type: "string", $ne: "" },
      ...extraFilter,
    };

    const docs = await db.collection("chunks")
      .find(filter, { projection: { chunkKey: 1, text: 1 } })
      .limit(limit)
      .toArray();

    if (docs.length === 0) {
      console.log("[embed] No more chunks missing embeddings. Done.");
      break;
    }

    const texts = docs.map((d) => String(d.text));
    // Embeddings input must not be empty strings; your filter ensures that. :contentReference[oaicite:2]{index=2}
    const vectors = await embedWithRetry(openai, model, texts);

    lastDims = vectors[0]?.length ?? lastDims;

    const ops: AnyBulkWriteOperation<Document>[] = [];
    for (let i = 0; i < docs.length; i++) {
      const chunkKey = docs[i].chunkKey;
      const embedding = vectors[i];

      ops.push({
        updateOne: {
          filter: { chunkKey },
          update: {
            $set: {
              embedding,
              embeddingModel: model,
              embeddingDims: embedding.length,
              embeddedAt: new Date(),
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: false, // chunk should already exist
        },
      });
    }

    await db.collection("chunks").bulkWrite(ops, { ordered: false });

    processed += docs.length;
    console.log(`[embed] processed=${processed} (+${docs.length}) dims=${lastDims ?? "?"}`);

    if (delayMs > 0) await sleep(delayMs);
  }

  if (lastDims) {
    console.log(`[embed] Last observed embeddingDims=${lastDims} (use this in your Atlas Vector Search index).`);
  }

  await client.close();
}

main().catch((e) => {
  console.error("[embed] Failed:", e?.message ?? e);
  process.exit(1);
});
