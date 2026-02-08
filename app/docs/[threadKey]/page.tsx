'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Search, FileText, Calendar, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockDocuments, Document } from '@/lib/mock-data';

interface DocumentViewerProps {
  params: {
    threadKey: string;
  };
}

export default function DocumentViewer({ params }: DocumentViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = useMemo(() => {
    const pageParam = searchParams.get('page');
    if (!pageParam) {
      return 1;
    }
    const parsed = Number(pageParam);
    if (Number.isNaN(parsed) || parsed < 1) {
      return 1;
    }
    return Math.floor(parsed);
  }, [searchParams]);
  const document = mockDocuments.find((d: Document) => d.id === params.threadKey);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!document) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Document not found</p>
          <Button onClick={() => router.push('/docs')}>Go back</Button>
        </div>
      </div>
    );
  }

  const totalPages = document.pageCount || 1;

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left Sidebar: Document Metadata */}
      <div className="w-80 border-r border-border bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border">
          <Button variant="ghost" onClick={() => router.push('/docs')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Document Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold mb-2">{document.title}</h2>
                  <p className="text-sm text-muted-foreground">{document.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(document.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>

              <Badge variant="outline">{document.type}</Badge>

              {document.pageCount && (
                <div className="text-sm text-muted-foreground">
                  {document.pageCount} pages
                </div>
              )}
            </div>

            {/* Tags */}
            {document.tags.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Download */}
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>

            {/* Source Info */}
            <Card className="p-3 bg-muted/50">
              <div className="text-xs space-y-2">
                <div className="font-medium">Source Information</div>
                <div className="text-muted-foreground">
                  This document was released through public court proceedings 
                  and legal disclosures. All information is part of the public record.
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content: Document Viewer */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Viewer Toolbar */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search in document..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-2 min-w-[120px] justify-center">
                <span className="text-sm">Page</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-16 text-center"
                />
                <span className="text-sm text-muted-foreground">of {totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <ScrollArea className="flex-1">
          <div className="p-8">
            <Card className="max-w-4xl mx-auto min-h-[800px] p-12 bg-white text-black">
              {/* Mock Document Content */}
              <div className="space-y-4">
                <div className="text-center mb-8 pb-8 border-b border-gray-300">
                  <h1 className="text-2xl font-bold mb-2">{document.title}</h1>
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="mb-4">{document.content}</p>
                  
                  {currentPage === initialPage && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                      <p className="text-sm">
                        <strong>Citation Reference:</strong> You are viewing the section 
                        referenced in the citation. The highlighted content appears on this page.
                      </p>
                    </div>
                  )}
                  
                  <p className="mb-4">
                    [This is a mock document viewer. In a production environment, this would 
                    display the actual PDF or document content using a proper document viewer 
                    library like PDF.js or similar.]
                  </p>

                  <p className="mb-4">
                    The document continues with additional details, testimony, evidence, 
                    and supporting materials that comprise the full {totalPages}-page record.
                  </p>

                  <p className="mb-4">
                    Additional context, dates, names, locations, and other relevant 
                    information would appear throughout the document, properly formatted 
                    and indexed for searchability.
                  </p>

                  {searchTerm && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded mt-6">
                      <p className="text-sm text-blue-900">
                        Searching for: <strong>&quot;{searchTerm}&quot;</strong>
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        In a full implementation, matching text would be highlighted 
                        and navigation controls would jump between matches.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}