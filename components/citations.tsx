'use client';

import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { FileText } from 'lucide-react';
import type { Citation } from '@/lib/types';

interface CitationCardProps {
  citation: Citation;
  onClick?: () => void;
}

export function CitationCard({ citation, onClick }: CitationCardProps) {
  const scorePct =
    typeof citation.score === 'number' ? `${(citation.score * 100).toFixed(0)}%` : null;

  return (
    <Card
      onClick={onClick}
      className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {citation.ref}
            </Badge>
            {scorePct && (
              <span className="text-xs text-muted-foreground">score {scorePct}</span>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-4">
            {citation.snippet}
          </p>

          <div className="text-xs text-muted-foreground truncate">
            thread {citation.threadKey.slice(0, 12)}… · chunk #{citation.chunkIndex}
          </div>
        </div>
      </div>
    </Card>
  );
}
