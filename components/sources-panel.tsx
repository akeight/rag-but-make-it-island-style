'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Citation } from '@/lib/mock-data';
import { CitationCard } from '@/components/citations';

interface SourcesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  citations: Citation[];
  onCitationClick: (docId: string, page?: number) => void;
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
          <div className="space-y-3 pr-4">
            {citations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No citations available for this response.
              </div>
            ) : (
              citations.map((citation, idx) => (
                <CitationCard
                  key={idx}
                  citation={citation}
                  onClick={() => {
                    onCitationClick(citation.docId, citation.page);
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