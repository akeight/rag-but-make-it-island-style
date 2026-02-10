import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const BodySchema = z.object({
  query: z.string().min(1).max(8000),
  topK: z.number().int().min(1).max(20).optional(),
  numCandidates: z.number().int().min(10).max(2000).optional(),
  filter: z
    .object({
      threadKey: z.string().min(1).optional(),
      messageKey: z.string().min(1).optional(),
    })
    .optional(),
});

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0]?.trim() || "unknown").slice(0, 80);
}

export async function POST(req: Request) {
  // 1) Rate limit first (cheap)
  const ip = getClientIp(req);
  const rl = await enforceRateLimit({ ip, bucket: "retrieve", windowSec: 60, max: 60 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  // 2) Validate body
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 3) Use backend OpenAI key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY." }, { status: 500 });
  }

  const { query } = parsed.data;
  const topK = parsed.data.topK ?? 8;
  const numCandidates = parsed.data.numCandidates ?? Math.min(200, topK * 20);

  const embedModel = process.env.EMBED_MODEL || "text-embedding-3-small";
  const openai = new OpenAI({ apiKey });

  // 4) Embed the query
  const emb = await openai.embeddings.create({
    model: embedModel,
    input: query,
  });

  const queryVector = emb.data?.[0]?.embedding;
  if (!queryVector?.length) {
    return NextResponse.json({ error: "Failed to embed query." }, { status: 500 });
  }

  // 5) Vector search in Atlas
  const db = await getDb();

  const mongoFilter: Record<string, unknown> = {};
  if (parsed.data.filter?.threadKey) mongoFilter.threadKey = parsed.data.filter.threadKey;
  if (parsed.data.filter?.messageKey) mongoFilter.messageKey = parsed.data.filter.messageKey;

  const hits = await db.collection("chunks").aggregate([
    {
      $vectorSearch: {
        index: "epstein_vector_index",
        path: "embedding",
        queryVector,
        numCandidates,
        limit: topK,
        ...(Object.keys(mongoFilter).length ? { filter: mongoFilter } : {}),
      },
    },
    {
      $project: {
        _id: 0,
        chunkKey: 1,
        threadKey: 1,
        messageKey: 1,
        chunkIndex: 1,
        text: 1,
        metadata: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]).toArray();

  return NextResponse.json({
    hits,
    remaining: rl.remaining,
    meta: {
      topK,
      numCandidates,
      embedModel,
      filter: Object.keys(mongoFilter).length ? mongoFilter : null,
    },
  });
}

