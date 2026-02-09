// scripts/chunk_backfill.ts
//
// Creates retrieval chunks from messages.body and upserts into `chunks`.
// Marks messages as chunked to avoid reprocessing.
//
// Usage:
//   bun scripts/chunk_backfill.ts


import crypto from "crypto";
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
function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function chunkText(text: string, maxChars: number, overlapChars: number) {
  const clean = (text || "").trim();
  if (!clean) return [];

  // Prefer splitting on paragraph boundaries, but keep it simple for MVP.
  const parts = clean.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";

  const pushBuffer = () => {
    const trimmed = buffer.trim();
    if (trimmed) chunks.push(trimmed);
    buffer = "";
  };

  for (const p of parts.length ? parts : [clean]) {
    // If a paragraph itself is huge, fall back to raw slicing.
    if (p.length > maxChars) {
      if (buffer) pushBuffer();
      let start = 0;
      while (start < p.length) {
        const end = Math.min(p.length, start + maxChars);
        chunks.push(p.slice(start, end).trim());
        start = Math.max(end - overlapChars, end);
      }
      continue;
    }

    if (!buffer) {
      buffer = p;
      continue;
    }

    // Add paragraph if it fits, otherwise flush buffer.
    if ((buffer.length + 2 + p.length) <= maxChars) {
      buffer = `${buffer}\n\n${p}`;
    } else {
      pushBuffer();
      buffer = p;
    }
  }

  if (buffer) pushBuffer();

  // Add overlap between chunks (soft overlap by carrying tail)
  if (overlapChars > 0 && chunks.length > 1) {
    const withOverlap: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) {
        withOverlap.push(chunks[i]);
        continue;
      }
      const prev = withOverlap[i - 1];
      const tail = prev.slice(Math.max(0, prev.length - overlapChars));
      withOverlap.push((tail + "\n\n" + chunks[i]).trim());
    }
    return withOverlap;
  }

  return chunks;
}

async function ensureIndexes(db: ReturnType<MongoClient["db"]>) {
  await db.collection("chunks").createIndex({ chunkKey: 1 }, { unique: true });
  await db.collection("chunks").createIndex({ threadKey: 1, messageKey: 1, chunkIndex: 1 });
  await db.collection("messages").createIndex({ chunkedAt: 1 });
}

async function main() {
  const mongoUri = mustEnv("MONGODB_URI");
  const dbName = env("MONGODB_DB", "epstein_rag")!;
  const maxChars = Number(env("CHUNK_MAX_CHARS", "2000")!);
  const overlap = Number(env("CHUNK_OVERLAP_CHARS", "200")!);
  const batchSize = Number(env("CHUNK_BATCH_MESSAGES", "200")!);

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);

  console.log(`[chunk] DB: ${dbName}`);
  console.log(`[chunk] maxChars=${maxChars} overlap=${overlap} batchSize=${batchSize}`);

  await ensureIndexes(db);

  let processed = 0;

  while (true) {
    // Only process messages not yet chunked, with non-empty body.
    const msgs = await db.collection("messages")
      .find(
        { chunkedAt: { $exists: false }, body: { $type: "string", $ne: "" } },
        { projection: { threadKey: 1, messageKey: 1, orderIndex: 1, sender: 1, recipients: 1, timestamp: 1, timestampRaw: 1, subject: 1, body: 1 } }
      )
      .limit(batchSize)
      .toArray();

    if (msgs.length === 0) {
      console.log("[chunk] No more messages to chunk. Done.");
      break;
    }

    const chunkOps: AnyBulkWriteOperation<Document>[] = [];
    const msgOps: AnyBulkWriteOperation<Document>[] = [];

    for (const m of msgs) {
      const textChunks = chunkText(String(m.body || ""), maxChars, overlap);

      for (let i = 0; i < textChunks.length; i++) {
        const text = textChunks[i];
        const chunkKey = sha256(`${m.messageKey}::${i}::${text}`);

        chunkOps.push({
          updateOne: {
            filter: { chunkKey },
            update: {
              $set: {
                chunkKey,
                threadKey: m.threadKey,
                messageKey: m.messageKey,
                chunkIndex: i,
                text,
                metadata: {
                  orderIndex: m.orderIndex ?? null,
                  sender: m.sender ?? null,
                  recipients: m.recipients ?? [],
                  timestamp: m.timestamp ?? null,
                  timestampRaw: m.timestampRaw ?? null,
                  subject: m.subject ?? null,
                },
                updatedAt: new Date(),
              },
              $setOnInsert: { createdAt: new Date() },
            },
            upsert: true,
          },
        });
      }

      msgOps.push({
        updateOne: {
          filter: { messageKey: m.messageKey },
          update: { $set: { chunkedAt: new Date(), chunkCount: textChunks.length } },
        },
      });
    }

    if (chunkOps.length) await db.collection("chunks").bulkWrite(chunkOps, { ordered: false });
    if (msgOps.length) await db.collection("messages").bulkWrite(msgOps, { ordered: false });

    processed += msgs.length;
    console.log(`[chunk] processed_messages=${processed} (+${msgs.length}) inserted/updated_chunks=${chunkOps.length}`);
  }

  await client.close();
}

main().catch((e) => {
  console.error("[chunk] Failed:", e);
  process.exit(1);
});
