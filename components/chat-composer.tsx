'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send } from 'lucide-react';

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled = false }: ChatComposerProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-background p-4">
      <div className="container mx-auto max-w-4xl z-10">
        <div className="flex gap-2 items-baseline">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the emails..."
              disabled={disabled}
              className="min-h-[60px] max-h-[200px] resize-none font-semibold hover:focus:ring-1 focus:ring-0"
              rows={1}
            />
            <div className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line.
            </div>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || disabled}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0 hover:bg-primary/100 hover:text-primary-foreground"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </form>
  );
}