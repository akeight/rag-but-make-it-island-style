import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ThreadDoc = {
  threadKey: string;
  subject?: string | null;
};

type MessageDoc = {
  orderIndex: number;
  subject?: string | null;
  body?: string | null;
  timestampRaw?: string | null;
  sender?: string | null;
};

type Props = {
  thread: ThreadDoc;
  messages: MessageDoc[];
};

export function ThreadEmailCard({ thread, messages }: Props) {
  const latest =
    messages.length === 0
      ? null
      : messages.reduce((acc, cur) => (cur.orderIndex > acc.orderIndex ? cur : acc));

  const sender = latest?.sender ?? "Unknown sender";
  const latestSubject = latest?.subject ?? thread.subject ?? "No subject";
  const latestTimestampRaw = latest?.timestampRaw ?? "Unknown time";
  const latestBody = latest?.body ?? "No body";
  return (
    <Card className="p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <CardDescription className="truncate">
              <span className="font-medium text-primary">{sender}</span> <br />
              <span className="text-muted-foreground text-xs font-italic">{latestTimestampRaw}</span>
            </CardDescription>
          </div>
          <Badge variant="secondary">{messages.length} new message</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm">
          <span className="text-primary">{latestSubject}</span>
        </div>

        <div className="text-sm">
          <span className="text-primary">{latestBody}</span>
        </div>
      </CardContent>
    </Card>
  );
}
