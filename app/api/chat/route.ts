import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const BodySchema = z.object({
  message: z.string().min(1).max(8000),
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

function buildContext(hits: Record<string, unknown>[]) {
  return hits
    .map(
      (h, i) =>
        `[#${i + 1}] score=${h.score}\n` +
        `threadKey=${h.threadKey}\nmessageKey=${h.messageKey}\nchunkKey=${h.chunkKey}\n` +
        `text:\n${h.text}`
    )
    .join("\n\n---\n\n");
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Rate-limit BEFORE embeddings + generation
  const rl = await enforceRateLimit({ ip, bucket: "chat", windowSec: 60, max: 20 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing OPENAI_API_KEY." }, { status: 500 });

  const embedModel = process.env.EMBED_MODEL || "text-embedding-3-small";
  const chatModel = process.env.CHAT_MODEL || "gpt-5";

  const openai = new OpenAI({ apiKey });

  const { message } = parsed.data;
  const topK = parsed.data.topK ?? 8;
  const numCandidates = parsed.data.numCandidates ?? Math.min(400, topK * 50);

  // 1) Embed user query
  const emb = await openai.embeddings.create({ model: embedModel, input: message });
  const queryVector = emb.data?.[0]?.embedding;
  if (!queryVector?.length) return NextResponse.json({ error: "Failed to embed query." }, { status: 500 });
  // Embeddings endpoint reference. :contentReference[oaicite:2]{index=2}

  // 2) Retrieve chunks via Atlas vector search
  const db = await getDb();
  const mongoFilter: Record<string, unknown> = {};
  if (parsed.data.filter?.threadKey) mongoFilter.threadKey = parsed.data.filter.threadKey;
  if (parsed.data.filter?.messageKey) mongoFilter.messageKey = parsed.data.filter.messageKey;

  const hits = await db.collection("chunks").aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
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

  const context = buildContext(hits);

  const system = [
    "You are a document-grounded assistant.",
    "Answer ONLY using the provided context excerpts.",
    "If the answer is not in the context, say you don’t have enough information from the dataset.",
    "Do not speculate or invent details.",
    "Cite excerpts like [#1], [#2].",
  ].join(" ");

  // 3) Generate answer (Responses API)
  const resp = await openai.responses.create({
    model: chatModel,
    input: [
      { role: "system", content: system },
      {
        role: "user",
        content:
          `Context excerpts:\n\n${context}\n\n` +
          `User question:\n${message}\n\n` +
          `Write the answer with citations like [#1].`,
      },
    ],
  });
  // Responses endpoint reference. :contentReference[oaicite:3]{index=3}

  const answer = resp.output_text || "";

  const citations = hits.map((h: Record<string, unknown>, i: number) => ({
    ref: `#${i + 1}`,
    score: h.score,
    chunkKey: h.chunkKey as string,
    threadKey: h.threadKey as string, 
    messageKey: h.messageKey as string,
    chunkIndex: h.chunkIndex as number,
    snippet: String(h.text || "").slice(0, 220),
  }));

  return NextResponse.json({
    answer,
    citations,
    remaining: rl.remaining,
    meta: { topK, numCandidates, embedModel, chatModel },
  });
}

