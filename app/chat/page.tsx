'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import { MessageBubble, TypingIndicator } from '@/components/message-bubble';
import { ChatComposer } from '@/components/chat-composer';
import { EmptyChatState } from '@/components/empty-chat-state';
import { AnimatedBackground } from '@/components/animated-background';
import type { Message } from '@/lib/types';


function makeId() {
  // Works in the browser (client component)
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      const userText = (text ?? '').trim();
      if (!userText || isLoading) return;

      // Add the user's message immediately
      const userMsg: Message = {
        id: makeId(),
        role: 'user',
        content: userText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      setIsLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText, topK: 8 }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
        const errMsg: Message = {
            id: makeId(),
            role: 'assistant',
            content: data?.error ?? 'Request failed.',
          timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errMsg]);
          return;
        }

        const assistantMsg: Message = {
          id: makeId(),
          role: 'assistant',
          content: data?.answer ?? '',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e: unknown) {
        const errMsg: Message = {
          id: makeId(),
          role: 'assistant',
          content: (e as Error)?.message ?? 'Network error.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const promptSuggestions: string[] = [
    'What emails are related to Trump?',
    'Which emails mention Prince Andrew?',
    'How many emails mention pizza?',
    'Is Elon Musk mentioned in any emails?',
  ];

  const handleNewChat = () => {
    if (window.confirm('Start a new chat? This will clear the current conversation.')) {
      setMessages([]);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] max-w-[85%] mx-auto flex flex-col">
      <AnimatedBackground />
      {/* Chat Header */}
      <div className="border-b border-border bg-background px-4 py-3">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <h1 className="text-lg font-semibold">Chat</h1>

          <div className="flex items-center gap-4">
            {/* New Chat Button */}
            <Button variant="outline" onClick={handleNewChat}>
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New chat</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div className="container mx-auto max-w-4xl px-4 py-6">
          {messages.length === 0 ? (
            <EmptyChatState
              suggestions={promptSuggestions}
              onSuggestionClick={(s: string) => handleSendMessage(s)}
            />
          ) : (
            <>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isLoading && <TypingIndicator />}
            </>
          )}
        </div>
      </div>

      {/* Chat Composer */}
      <ChatComposer onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
