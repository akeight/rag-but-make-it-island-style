import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { ThreadSummary } from "@/lib/types";

export const runtime = "nodejs";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 20));

  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ subject: rx }, { participants: rx }];
  }

  const total = await db.collection("threads").countDocuments(filter);

  const docs = await db
    .collection("threads")
    .find(filter, {
      projection: { _id: 0, threadKey: 1, subject: 1, participants: 1, messageCount: 1 },
    })
    .sort({ messageCount: -1, threadKey: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  const threads: ThreadSummary[] = docs.map((d) => ({
    threadKey: String(d.threadKey),
    subject: (d.subject ?? null) as string | null,
    participants: Array.isArray(d.participants) ? (d.participants as string[]) : [],
    messageCount: Number(d.messageCount ?? 0),
  }));

  return NextResponse.json({ threads, total, page, pageSize });
}
