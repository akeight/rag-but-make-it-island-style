import crypto from "crypto";
import { getDb } from "./mongodb";

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

type RateLimitArgs = {
  ip: string;
  apiKey: string;
  windowSec?: number; // default 60
  max?: number;       // default 30
};

export async function enforceRateLimit({
  ip,
  apiKey,
  windowSec = 60,
  max = 30,
}: RateLimitArgs) {
  const db = await getDb();
  const col = db.collection("rate_limits");

  const keyHash = sha256(apiKey);
  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const _id = `${ip}:${keyHash}:${bucket}`;

  const res = await col.findOneAndUpdate(
    { _id },
    {
      $inc: { count: 1 },
      $setOnInsert: { createdAt: new Date(), expiresAt: new Date(Date.now() + windowSec * 1000) },
    },
    { upsert: true, returnDocument: "after" }
  );

  const count = (res.value?.count as number) ?? 0;
  const remaining = Math.max(0, max - count);

  if (count > max) {
    return { ok: false as const, remaining: 0 };
  }
  return { ok: true as const, remaining };
}
