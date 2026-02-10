
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Copy, Flag } from 'lucide-react';
import type { Message } from '@/lib/types';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const handleCopy = () => {
    // eslint-disable-next-line prefer-const
    let text = message.content;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleReport = () => {
    toast.info('Report submitted. Thank you for your feedback.');
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <Card className="max-w-[80%] p-4 bg-primary text-primary-foreground">
          <div className="text-sm leading-relaxed">{message.content}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <Card className="max-w-[85%] p-4 bg-card">
        <div className="space-y-4">
          {/* Answer text */}
          <div className="text-sm leading-relaxed">{message.content}</div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReport}
              className="h-8"
            >
              <Flag className="w-3 h-3 mr-1" />
              Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <Card className="p-4 bg-card">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
          </div>
          <span className="text-xs text-muted-foreground">Searching emails...</span>
        </div>
      </Card>
    </div>
  );
}