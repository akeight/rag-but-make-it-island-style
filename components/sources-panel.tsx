'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import type { Citation } from '@/lib/types';
import { CitationCard } from '@/components/citations';

interface SourcesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  citations: Citation[];
  onCitationClick: (threadKey: string, messageKey?: string) => void;
}

export default function SourcesPanel({ isOpen, onClose, citations, onCitationClick }: SourcesPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Sources ({citations.length})</SheetTitle>
          <SheetDescription>
            Citations and references from the document corpus
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-3 px-4 pb-4">
            {citations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No citations available for this response.
              </div>
            ) : (
              citations.map((citation) => (
                <CitationCard
                  key={citation.chunkKey}
                  citation={citation}
                  onClick={() => {
                    onCitationClick(citation.threadKey, citation.messageKey);
                    onClose();
                  }}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
