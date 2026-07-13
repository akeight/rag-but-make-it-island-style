import crypto from "crypto";
import { getDb } from "@/lib/mongodb";

type RateLimitResult = { ok: boolean; remaining: number };

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// Ensure the supporting indexes exist only once per process, not on every
// request (createIndex on the hot path adds latency to every call).
let indexesReady: Promise<void> | null = null;
function ensureIndexes() {
  if (!indexesReady) {
    indexesReady = (async () => {
      const db = await getDb();
      const col = db.collection("rate_limits");
      await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await col.createIndex({ key: 1 }, { unique: true });
    })().catch((e) => {
      // Reset so a later request can retry index creation.
      indexesReady = null;
      throw e;
    });
  }
  return indexesReady;
}

export async function enforceRateLimit(opts: {
  ip: string;
  bucket: string;      // e.g. "retrieve" or "chat"
  windowSec: number;   // e.g. 60
  max: number;         // e.g. 30
}): Promise<RateLimitResult> {
  const db = await getDb();
  const col = db.collection("rate_limits");

  await ensureIndexes();

  const now = new Date();

  // Fixed-window counter. The key includes the window index so each window has
  // its own document; expired windows are removed by the TTL index. This avoids
  // reusing a key across windows (which would collide with the unique index).
  const windowIndex = Math.floor(now.getTime() / (opts.windowSec * 1000));
  // Keep the doc slightly past the window end so late-arriving requests in the
  // same window still find it before the TTL monitor deletes it.
  const expiresAt = new Date((windowIndex + 2) * opts.windowSec * 1000);

  const salt = process.env.RATE_LIMIT_SALT || "dev-salt";
  const key = sha256(`${salt}::${opts.bucket}::${opts.ip}::${opts.windowSec}::${windowIndex}`);

  // Driver v6+ returns the document directly (not a { value } wrapper).
  const doc = await col.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { key, createdAt: now, expiresAt },
    },
    { upsert: true, returnDocument: "after" }
  );

  const count = Number(doc?.count ?? 1);
  const remaining = Math.max(0, opts.max - count);
  return { ok: count <= opts.max, remaining };
}
