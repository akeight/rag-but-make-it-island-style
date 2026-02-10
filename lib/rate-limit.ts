import crypto from "crypto";
import { getDb } from "@/lib/mongodb";

type RateLimitResult = { ok: boolean; remaining: number };

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function enforceRateLimit(opts: {
  ip: string;
  bucket: string;      // e.g. "retrieve" or "chat"
  windowSec: number;   // e.g. 60
  max: number;         // e.g. 30
}): Promise<RateLimitResult> {
  const db = await getDb();
  const col = db.collection("rate_limits");

  // TTL cleanup + unique key
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await col.createIndex({ key: 1 }, { unique: true });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + opts.windowSec * 1000);

  const salt = process.env.RATE_LIMIT_SALT || "dev-salt";
  const key = sha256(`${salt}::${opts.bucket}::${opts.ip}::${opts.windowSec}`);

  const res = await col.findOneAndUpdate(
    { key, expiresAt: { $gt: now } },
    {
      $inc: { count: 1 },
      $set: { updatedAt: now },
      $setOnInsert: { key, count: 0, createdAt: now, expiresAt },
    },
    { upsert: true, returnDocument: "after" }
  );

  const count = Number(res?.value?.count ?? 0);
  const remaining = Math.max(0, opts.max - count);
  return { ok: count <= opts.max, remaining };
}

