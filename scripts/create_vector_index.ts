// scripts/create_vector_index.ts
//
// Creates the Atlas Vector Search index on the `chunks` collection and waits
// until it is queryable. Safe to re-run: if an index with the same name already
// exists it is left in place.
//
// Usage:
//   bun scripts/create_vector_index.ts

import { MongoClient } from "mongodb";

const VECTOR_INDEX = "vector_index";
const EMBEDDING_DIMS = 1536; // text-embedding-3-small

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

async function main() {
  const mongoUri = mustEnv("MONGODB_URI");
  const dbName = env("MONGODB_DB", "epstein_rag")!;

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  const chunks = db.collection("chunks");

  console.log(`[index] DB: ${dbName} | collection: chunks | index: ${VECTOR_INDEX}`);

  const existing = await chunks.listSearchIndexes().toArray();
  if (existing.some((i) => i.name === VECTOR_INDEX)) {
    console.log(`[index] "${VECTOR_INDEX}" already exists. Nothing to do.`);
    await client.close();
    return;
  }

  console.log(`[index] Creating vectorSearch index "${VECTOR_INDEX}" (dims=${EMBEDDING_DIMS}, cosine)...`);

  await chunks.createSearchIndex({
    name: VECTOR_INDEX,
    type: "vectorSearch",
    definition: {
      fields: [
        {
          type: "vector",
          path: "embedding",
          numDimensions: EMBEDDING_DIMS,
          similarity: "cosine",
        },
        { type: "filter", path: "threadKey" },
        { type: "filter", path: "messageKey" },
      ],
    },
  });

  console.log("[index] Index submitted. Waiting for it to become queryable...");

  const deadline = Date.now() + 10 * 60 * 1000; // 10 minutes
  while (Date.now() < deadline) {
    const indexes = (await chunks.listSearchIndexes().toArray()) as Array<Record<string, unknown>>;
    const idx = indexes.find((i) => i.name === VECTOR_INDEX);
    const status = (idx?.status as string) ?? "UNKNOWN";
    const queryable = Boolean(idx?.queryable);
    console.log(`[index] status=${status} queryable=${queryable}`);
    if (queryable) {
      console.log("[index] Index is queryable. Done.");
      await client.close();
      return;
    }
    await sleep(5000);
  }

  console.warn("[index] Timed out waiting for the index to become queryable. Check the Atlas UI.");
  await client.close();
}

main().catch((e) => {
  console.error("[index] Failed:", e?.message ?? e);
  console.error(
    "[index] If programmatic creation is not supported on your Atlas tier, create the index in the Atlas UI:\n" +
      '  collection: chunks, name: "vector_index", type: Vector Search\n' +
      '  field: embedding (vector, 1536 dims, cosine); filter fields: threadKey, messageKey'
  );
  process.exit(1);
});
