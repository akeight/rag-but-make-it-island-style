import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { ThreadMessage, ThreadSummary } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadKey: string }> }
) {
  const { threadKey } = await params;
  if (!threadKey) {
    return NextResponse.json({ error: "Missing threadKey." }, { status: 400 });
  }

  const db = await getDb();

  const threadDoc = await db.collection("threads").findOne(
    { threadKey },
    { projection: { _id: 0, threadKey: 1, subject: 1, participants: 1, messageCount: 1 } }
  );

  if (!threadDoc) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const messageDocs = await db
    .collection("messages")
    .find(
      { threadKey },
      {
        projection: {
          _id: 0,
          messageKey: 1,
          orderIndex: 1,
          sender: 1,
          recipients: 1,
          subject: 1,
          body: 1,
          timestampRaw: 1,
          timestamp: 1,
        },
      }
    )
    .sort({ orderIndex: 1 })
    .toArray();

  const thread: ThreadSummary = {
    threadKey: String(threadDoc.threadKey),
    subject: (threadDoc.subject ?? null) as string | null,
    participants: Array.isArray(threadDoc.participants) ? (threadDoc.participants as string[]) : [],
    messageCount: Number(threadDoc.messageCount ?? messageDocs.length),
  };

  const messages: ThreadMessage[] = messageDocs.map((m) => ({
    messageKey: String(m.messageKey),
    orderIndex: Number(m.orderIndex ?? 0),
    sender: (m.sender ?? null) as string | null,
    recipients: Array.isArray(m.recipients) ? (m.recipients as string[]) : [],
    subject: (m.subject ?? null) as string | null,
    body: String(m.body ?? ""),
    timestampRaw: (m.timestampRaw ?? null) as string | null,
    timestamp: m.timestamp ? new Date(m.timestamp as Date).toISOString() : null,
  }));

  return NextResponse.json({ thread, messages });
}
