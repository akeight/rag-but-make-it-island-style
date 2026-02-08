import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, ExternalLink } from 'lucide-react';
import { Citation } from '@/lib/mock-data';

interface CitationChipProps {
  citation: Citation;
  onClick: () => void;
}

export function CitationChip({ citation, onClick }: CitationChipProps) {
  return (
    <Badge
      variant="secondary"
      className="cursor-pointer hover:bg-secondary/80 transition-colors gap-1 pr-2"
      onClick={onClick}
    >
      <FileText className="w-3 h-3" />
      {citation.docTitle}
      {citation.page && ` - p.${citation.page}`}
      <ExternalLink className="w-3 h-3 ml-1" />
    </Badge>
  );
}

interface CitationCardProps {
  citation: Citation;
  onClick: () => void;
}

export function CitationCard({ citation, onClick }: CitationCardProps) {
  return (
    <Card 
      className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="font-medium text-sm">{citation.docTitle}</div>
          {citation.page && (
            <div className="text-xs text-muted-foreground">
              Page {citation.page}
              {citation.section && ` • ${citation.section}`}
            </div>
          )}
          <div className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-3 mt-2">
            &quot;{citation.snippet}&quot;
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Card>
  );
}