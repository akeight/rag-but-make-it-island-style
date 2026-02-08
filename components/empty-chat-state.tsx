'use client';

import { Card } from './ui/card';
import { LightbulbIcon } from 'lucide-react';

interface PromptSuggestionProps {
  text: string;
  onClick: (text: string) => void;
}

export function PromptSuggestion({ text, onClick }: PromptSuggestionProps) {
  return (
    <Card
      className="p-4 cursor-pointer hover:bg-accent transition-colors"
      onClick={() => onClick(text)}
    >
      <div className="flex items-start gap-3">
        <LightbulbIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm">{text}</div>
      </div>
    </Card>
  );
}

interface EmptyChatStateProps {
  suggestions: string[];
  onSuggestionClick: (text: string) => void;
}

export function EmptyChatState({ suggestions, onSuggestionClick }: EmptyChatStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-4 max-w-[80%] mx-auto">
          <h2 className="text-4xl font-semibold">Shine a light on your questions. Ask away!</h2>
          <p className="font-light mx-auto text-muted-foreground">
            Start by asking about the documents in the corpus. 
            All answers will include citations you can verify.
          </p>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((suggestion, idx) => (
            <PromptSuggestion
              key={idx}
              text={suggestion}
              onClick={onSuggestionClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
