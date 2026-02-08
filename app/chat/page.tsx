'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageSquarePlus, Settings2 } from 'lucide-react';
import { Citation, Message, generateMockResponse, promptSuggestions } from '@/lib/mock-data';
import { MessageBubble, TypingIndicator } from '@/components/message-bubble';
import { ChatComposer } from '@/components/chat-composer';
import { EmptyChatState } from '@/components/empty-chat-state';
import SourcesPanel from '@/components/sources-panel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatedBackground } from '@/components/animated-background';

interface ChatPageProps {
  onNavigateToDoc: (docId: string, page?: number) => void;
}

export default function ChatPage({ onNavigateToDoc }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [citationsRequired, setCitationsRequired] = useState(true);
  const [responseStyle, setResponseStyle] = useState('balanced');
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [currentCitations, setCurrentCitations] = useState<Citation[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const { content: responseContent, citations } = generateMockResponse(content);
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: responseContent,
        citations: citationsRequired ? citations : undefined,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleNewChat = () => {
    if (window.confirm('Start a new chat? This will clear the current conversation.')) {
      setMessages([]);
    }
  };

  const handleViewSources = (citations: Citation[]) => {
    setCurrentCitations(citations);
    setSourcesOpen(true);
  };

  return (
    <div className="h-[calc(100vh-4rem)] max-w-[85%] mx-auto flex flex-col">
      <AnimatedBackground />
      {/* Chat Header */}
      <div className="border-b border-border bg-background px-4 py-3">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <h1 className="text-lg font-semibold">Chat</h1>
          
          <div className="flex items-center gap-4">
            {/* Citations Required Toggle */}
            <div className="hidden sm:flex items-center gap-2">
              <Switch
                id="citations-mode"
                checked={citationsRequired}
                onCheckedChange={setCitationsRequired}
              />
              <Label htmlFor="citations-mode" className="text-sm cursor-pointer">
                Citations required
              </Label>
            </div>

            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Response Style</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={responseStyle} onValueChange={setResponseStyle}>
                  <DropdownMenuRadioItem value="concise">Concise</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="balanced">Balanced</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="detailed">Detailed</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                
                <DropdownMenuSeparator />
                <div className="px-2 py-2 sm:hidden">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="citations-mobile" className="text-sm">
                      Citations required
                    </Label>
                    <Switch
                      id="citations-mobile"
                      checked={citationsRequired}
                      onCheckedChange={setCitationsRequired}
                    />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
              onSuggestionClick={handleSendMessage}
            />
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCitationClick={onNavigateToDoc}
                  onViewSources={() => message.citations && handleViewSources(message.citations)}
                />
              ))}
              {isLoading && <TypingIndicator />}
            </>
          )}
        </div>
      </div>

      {/* Chat Composer */}
      <ChatComposer onSend={handleSendMessage} disabled={isLoading} />

      {/* Sources Panel */}
      <SourcesPanel
        isOpen={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        citations={currentCitations}
        onCitationClick={onNavigateToDoc}
      />
    </div>
  );
}