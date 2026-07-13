'use client';

import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Mail, Users } from 'lucide-react';
import type { ThreadSummary } from '@/lib/types';

interface EmailRowProps {
  thread: ThreadSummary;
  onOpen: (threadKey: string) => void;
}

export default function EmailRow({ thread, onOpen }: EmailRowProps) {
  const subject = thread.subject?.trim() || 'No subject';
  const participants = thread.participants ?? [];
  const shownParticipants = participants.slice(0, 3);
  const extraParticipants = Math.max(0, participants.length - shownParticipants.length);

  return (
    <Card className="p-6 rounded-lg hover:bg-accent/50 transition-colors mx-auto">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Mail className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="font-medium mb-1 truncate">{subject}</h3>
            {participants.length > 0 && (
              <p className="text-sm text-muted-foreground line-clamp-1 flex items-center gap-1">
                <Users className="w-3 h-3 flex-shrink-0" />
                {shownParticipants.join(', ')}
                {extraParticipants > 0 && ` +${extraParticipants} more`}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
            </Badge>
            <span className="font-mono">{thread.threadKey.slice(0, 12)}…</span>
          </div>
        </div>

        <Button onClick={() => onOpen(thread.threadKey)} variant="outline">
          Open
        </Button>
      </div>
    </Card>
  );
}
