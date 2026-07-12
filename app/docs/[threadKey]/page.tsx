'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Users, Mail } from 'lucide-react';
import type { ThreadDetailResponse, ThreadMessage } from '@/lib/types';

interface DocumentViewerProps {
  params: Promise<{ threadKey: string }>;
}

export default function DocumentViewer({ params }: DocumentViewerProps) {
  const { threadKey } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightMessageKey = searchParams.get('messageKey');

  const [data, setData] = useState<ThreadDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/threads/${threadKey}`);
        const json = (await res.json().catch(() => ({}))) as ThreadDetailResponse & {
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error ?? 'Failed to load thread.');
          setData(null);
          return;
        }
        setData(json);
      } catch {
        if (!cancelled) setError('Network error while loading thread.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [threadKey]);

  // Scroll the highlighted (cited) message into view once loaded.
  useEffect(() => {
    if (data && highlightMessageKey && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [data, highlightMessageKey]);

  const subject = useMemo(
    () => data?.thread.subject?.trim() || 'No subject',
    [data]
  );

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading thread…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error ?? 'Thread not found'}</p>
          <Button onClick={() => router.push('/docs')}>Go back</Button>
        </div>
      </div>
    );
  }

  const { thread, messages } = data;

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left Sidebar: Thread Metadata */}
      <div className="w-80 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border">
          <Button variant="ghost" onClick={() => router.push('/docs')} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-semibold mb-2 break-words">{subject}</h2>
                  <Badge variant="secondary">
                    {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
                  </Badge>
                </div>
              </div>
            </div>

            {thread.participants.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Participants
                </div>
                <div className="flex flex-wrap gap-2">
                  {thread.participants.map((p, idx) => (
                    <Badge key={idx} variant="outline" className="max-w-full truncate">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Card className="p-3 bg-muted/50">
              <div className="text-xs space-y-2">
                <div className="font-medium">Source Information</div>
                <div className="text-muted-foreground">
                  This thread was released through public disclosures and is part of the
                  public record. Content is OCR-derived and may contain errors or redactions.
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content: Message Thread */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="border-b border-border p-4">
          <h1 className="text-lg font-semibold truncate">{subject}</h1>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <MessageCard
                key={message.messageKey}
                message={message}
                highlighted={message.messageKey === highlightMessageKey}
                ref={message.messageKey === highlightMessageKey ? highlightRef : undefined}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface MessageCardProps {
  message: ThreadMessage;
  highlighted: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

function MessageCard({ message, highlighted, ref }: MessageCardProps) {
  return (
    <div ref={ref}>
      <Card
        className={`p-4 ${
          highlighted ? 'border-primary ring-2 ring-primary/40 bg-primary/5' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="min-w-0">
            <div className="font-medium text-primary truncate">
              {message.sender ?? 'Unknown sender'}
            </div>
            {message.subject && (
              <div className="text-sm text-muted-foreground truncate">{message.subject}</div>
            )}
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {message.timestampRaw ?? ''}
          </div>
        </div>

        {message.recipients.length > 0 && (
          <div className="text-xs text-muted-foreground mb-3 line-clamp-1">
            To: {message.recipients.join(', ')}
          </div>
        )}

        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.body || <span className="text-muted-foreground italic">No body</span>}
        </div>
      </Card>
    </div>
  );
}
