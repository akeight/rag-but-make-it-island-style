// Ingest threads + messages from Hugging Face dataset viewer API into MongoDB.
//
// Usage:
//   bun scripts/ingest.ts

import crypto from "crypto";
import { MongoClient, type AnyBulkWriteOperation, type Db, type Document } from "mongodb";

const HF_BASE = "https://datasets-server.huggingface.co";

type HFRowResponse = {
  features?: Array<unknown>;
  rows: Array<{
    row_idx: number;
    row: {
      thread_id: string;
      source_file: string;
      subject?: string | null;
      messages: unknown; // JSON string or array of message objects
      message_count?: number;
      [k: string]: unknown;
    };
    truncated_cells?: unknown[];
  }>;
  num_rows_total?: number;
  num_rows_per_page?: number;
  partial?: boolean;
};

function env(name: string, fallback?: string) {
  const v = process.env[name];
  return (v === undefined || v === "") ? fallback : v;
}

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function asString(x: unknown): string | null {
  if (typeof x === "string") return x;
  if (x == null) return null;
  if (typeof x === "number" || typeof x === "boolean") return String(x);
  return null;
}

function asStringArray(x: unknown): string[] {
  if (!x) return [];
  if (typeof x === "string") return [x];
  if (Array.isArray(x)) return x.map(asString).filter((v): v is string => !!v);
  return [];
}

function asNumber(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && x.trim() !== "") {
    const parsed = Number(x);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function extractSender(msg: Record<string, unknown>): string | null {
  // Common patterns
  const direct =
    asString(msg?.sender) ??
    asString(msg?.from) ??
    asString(msg?.from_email) ??
    asString(msg?.fromName) ??
    asString(msg?.from_name);

  if (direct) return direct;

  // Sometimes "from" is an object like { name, email }
  const fromObj = msg?.from;
  if (fromObj && typeof fromObj === "object") {
    const name = asString((fromObj as { name: unknown }).name);
    const email = asString((fromObj as { email: unknown }).email);
    return [name, email].filter(Boolean).join(" ") || null;
  }

  return null;
}

function extractRecipients(msg: Record<string, unknown>): string[] {
  // Try common shapes
  const to = asStringArray(msg?.to);
  const cc = asStringArray(msg?.cc);
  const bcc = asStringArray(msg?.bcc);
  const rec = asStringArray(msg?.recipients);

  // Sometimes fields are objects like [{name,email}]
  function fromObjList(x: unknown): string[] {
    if (!Array.isArray(x)) return [];
    const out: string[] = [];
    for (const it of x) {
      if (typeof it === "string") out.push(it);
      else if (it && typeof it === "object") {
        const name = asString(it.name);
        const email = asString(it.email);
        const combined = [name, email].filter(Boolean).join(" ");
        if (combined) out.push(combined);
      }
    }
    return out;
  }

  const toObj = fromObjList(msg?.to);
  const ccObj = fromObjList(msg?.cc);
  const bccObj = fromObjList(msg?.bcc);

  const all = [...to, ...cc, ...bcc, ...rec, ...toObj, ...ccObj, ...bccObj]
    .map((s) => s.trim())
    .filter(Boolean);

  // de-dupe
  return Array.from(new Set(all));
}

function extractTimestamp(msg: Record<string, unknown>): { timestamp: Date | null; timestampRaw: string | null } {
  const raw =
    asString(msg?.timestamp) ??
    asString(msg?.date) ??
    asString(msg?.sent_at) ??
    asString(msg?.sentAt) ??
    asString(msg?.datetime);

  if (!raw) return { timestamp: null, timestampRaw: null };

  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) return { timestamp: null, timestampRaw: raw };

  return { timestamp: new Date(ms), timestampRaw: raw };
}

function extractBody(msg: Record<string, unknown>): string {
  const body =
    asString(msg?.body) ??
    asString(msg?.text) ??
    asString(msg?.content) ??
    asString(msg?.message) ??
    asString(msg?.raw);

  return body ?? "";
}

function normalizeMessages(input: unknown): Record<string, unknown>[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object");
  }
  if (typeof input === "string") {
    const parsed = safeJsonParse<unknown>(input);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object");
    }
  }
  return [];
}

function inferDbName(uri: string): string | null {
  try {
    const parsed = new URL(uri);
    const name = parsed.pathname?.replace(/^\//, "").trim();
    return name ? name : null;
  } catch {
    return null;
  }
}

async function fetchRows(params: {
    dataset: string;
    config: string;
    split: string;
    offset: number;
    length: number;
  }): Promise<HFRowResponse> {
    const url = new URL(`${HF_BASE}/rows`);
    url.searchParams.set("dataset", params.dataset);
    url.searchParams.set("config", params.config);
    url.searchParams.set("split", params.split);
    url.searchParams.set("offset", String(params.offset));
    url.searchParams.set("length", String(params.length));
  
    let lastErr: unknown = new Error("Unknown error");
  
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        const res = await fetch(url.toString(), {
          method: "GET",
          headers: { Accept: "application/json" },
        });
  
        if (res.ok) return (await res.json()) as HFRowResponse;
  
        if (res.status === 429) {
          // IMPORTANT: set lastErr so we never throw undefined
          lastErr = new Error(`HF rate limited (429) at offset=${params.offset} attempt=${attempt}`);
  
          const retryAfterHeader = res.headers.get("retry-after");
          const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
  
          const baseDelay = Number.isFinite(retryAfterSeconds)
            ? Math.max(1, retryAfterSeconds) * 1000
            : attempt * 1500;
  
          const jitter = Math.floor(Math.random() * 500);
          await new Promise((r) => setTimeout(r, baseDelay + jitter));
          continue;
        }
  
        lastErr = new Error(`HF /rows failed: ${res.status} ${res.statusText} offset=${params.offset}`);
        throw lastErr;
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, attempt * 750));
      }
    }
  
    throw lastErr;
  }
  

async function ensureIndexes(db: Db) {
  await db.collection("threads").createIndex({ threadKey: 1 }, { unique: true });
  await db.collection("messages").createIndex({ messageKey: 1 }, { unique: true });
  await db.collection("messages").createIndex({ threadKey: 1, orderIndex: 1 });
  await db.collection("messages").createIndex({ threadKey: 1, timestamp: 1 });
}

async function main() {
  const mongoUri = mustEnv("MONGODB_URI");
  const dbName = env("MONGODB_DB") ?? inferDbName(mongoUri);
  if (!dbName) {
    throw new Error("Missing MONGODB_DB and no database name present in MONGODB_URI.");
  }

  const dataset = env("HF_DATASET", "notesbymuneeb/epstein-emails")!;
  const config = env("HF_CONFIG", "default")!;
  const split = env("HF_SPLIT", "train")!;

  const pageSize = Math.min(Number(env("HF_PAGE_SIZE", "100")!), 100); // /rows max is 100
  const startOffset = Number(env("HF_START_OFFSET", "0")!);
  const maxRows = Number(env("HF_MAX_ROWS", "0")!); // 0 = no cap
  const storeRaw = (env("STORE_RAW_MESSAGE", "false")! === "true");

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);

  console.log(`[ingest] DB: ${dbName}`);
  console.log(`[ingest] Dataset: ${dataset} | ${config}/${split}`);

  await ensureIndexes(db);

  // First call to learn total rows
  const first = await fetchRows({ dataset, config, split, offset: startOffset, length: 1 });
  const total = first.num_rows_total ?? 0;
  if (!total) {
    console.warn("[ingest] Could not determine num_rows_total; will iterate until empty pages.");
  }
  console.log(`[ingest] Reported total rows: ${total || "unknown"}`);

  let offset = startOffset;
  let ingestedThreads = 0;
  let ingestedMessages = 0;

  while (true) {
    const remaining = maxRows > 0 ? Math.max(0, maxRows - (offset - startOffset)) : Infinity;
    if (remaining <= 0) break;

    const length = maxRows > 0 ? Math.min(pageSize, remaining) : pageSize;

    const page = await fetchRows({ dataset, config, split, offset, length });
    const rows = page.rows ?? [];

    if (rows.length === 0) {
      console.log(`[ingest] No rows returned at offset ${offset}. Done.`);
      break;
    }

    const threadOps: AnyBulkWriteOperation<Document>[] = [];
    const messageOps: AnyBulkWriteOperation<Document>[] = [];

    for (const item of rows) {
      const r = item.row;

      const threadId = r.thread_id;
      const sourceFile = r.source_file;
      const threadSubject = (r.subject ?? null) as string | null;
      const msgCount = asNumber(r.message_count ?? null) ?? undefined;

      const threadKey = sha256(`${sourceFile}::${threadId}`);

      threadOps.push({
        updateOne: {
          filter: { threadKey },
          update: {
            $set: {
              threadKey,
              threadId,
              sourceFile,
              subject: threadSubject,
              messageCount: msgCount,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: true,
        },
      });

      // messages is a JSON string containing list of messages
      const parsedMsgs = normalizeMessages(r.messages);
      const participants = new Set<string>();

      for (let i = 0; i < parsedMsgs.length; i++) {
        const msg = parsedMsgs[i];

        const sender = extractSender(msg);
        const recipients = extractRecipients(msg);
        const { timestamp, timestampRaw } = extractTimestamp(msg);
        const body = extractBody(msg);
        const subject = asString(msg?.subject) ?? threadSubject;

        if (sender) participants.add(sender);
        for (const p of recipients) participants.add(p);

        // stable id: threadKey + order + hash(raw msg)
        const rawStr = JSON.stringify(msg);
        const messageKey = sha256(`${threadKey}::${i}::${rawStr}`);

        const baseDoc: Record<string, unknown> = {
          threadKey,
          messageKey,
          orderIndex: i,
          sender,
          recipients,
          timestamp,
          timestampRaw,
          subject,
          body,
          updatedAt: new Date(),
        };

        if (storeRaw) baseDoc.raw = msg;

        messageOps.push({
          updateOne: {
            filter: { messageKey },
            update: {
              $set: baseDoc,
              $setOnInsert: { createdAt: new Date() },
            },
            upsert: true,
          },
        });
      }

      // Optional: update participants list on thread
      if (participants.size > 0) {
        threadOps.push({
          updateOne: {
            filter: { threadKey },
            update: { $set: { participants: Array.from(participants).slice(0, 500) } },
          },
        });
      }
    }

    if (threadOps.length) {
      const res = await db.collection("threads").bulkWrite(threadOps, { ordered: false });
      ingestedThreads += (res.upsertedCount ?? 0);
    }
    if (messageOps.length) {
      const res = await db.collection("messages").bulkWrite(messageOps, { ordered: false });
      ingestedMessages += (res.upsertedCount ?? 0);
    }

    offset += rows.length;

    console.log(
      `[ingest] offset=${offset} (+${rows.length}) | threads(upserted)+=${threadOps.length} | messages(upserted)+=${messageOps.length}`
    );
    
    // Add a small delay between pages
    const delayMs = Number(env("HF_DELAY_MS", "0")!);
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));


    // Stop if we know total and reached it
    if (total && offset >= startOffset + total) break;
  }

  console.log(`[ingest] Done. Upserted threads: ${ingestedThreads}, upserted messages: ${ingestedMessages}`);
  await client.close();
}

main().catch((e) => {
  console.error("[ingest] Failed:", e);
  process.exit(1);
});