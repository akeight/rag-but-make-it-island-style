'use client';

import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { FileText, Calendar, Tag } from 'lucide-react';
import { Document } from '@/lib/mock-data';

interface DocRowProps {
  document: Document;
  onOpen: (docId: string) => void;
}

export default function DocRow({ document, onOpen }: DocRowProps) {
  return (
    <Card className="p-6 rounded-lg hover:bg-accent/50 transition-colors mx-auto">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="font-medium mb-1">{document.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {document.description}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(document.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            
            <Badge variant="outline" className="text-xs">
              {document.type}
            </Badge>
            
            {document.pageCount && (
              <span>{document.pageCount} pages</span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {document.tags.map((tag: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        <Button onClick={() => onOpen(document.id)} variant="outline">
          Open
        </Button>
      </div>
    </Card>
  );
}