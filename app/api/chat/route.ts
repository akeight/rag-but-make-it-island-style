import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const BodySchema = z.object({
  message: z.string().min(1).max(8000),
});

function getClientIp(req: Request) {
  // Vercel passes x-forwarded-for
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0]?.trim() || "unknown").slice(0, 80);
}

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-openai-key") || "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key (send x-openai-key header)." },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const rl = await enforceRateLimit({ ip, apiKey, windowSec: 60, max: 30 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: "gpt-5.2",
    input: parsed.data.message,
  });

  return NextResponse.json({
    text: response.output_text ?? "",
    remaining: rl.remaining,
  });
}
