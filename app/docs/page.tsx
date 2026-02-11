'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockDocuments } from '@/lib/mock-data';
import EmailRow from '@/components/email-row';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DocsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get unique tags
  const allTags = Array.from(new Set(mockDocuments.flatMap(d => d.tags)));

  // Filter documents
  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => doc.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedTags.length > 0 || searchQuery !== '';

  return (
    <div className="h-[calc(100vh-4rem)] max-w-[85%] mx-auto flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-4 py-6">
        <div className="container mx-auto max-w-5xl space-y-4">
          <div className="space-y-2 justify-center items-center flex flex-col">
            <h1 className="text-2xl font-semibold mb-2">Email Thread Browser</h1>
            <p className="text-muted-foreground">
              Explore {mockDocuments.length} publicly released email threads
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-2">
            <div className="relative w-3/4 justify-center items-center flex mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search email threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>


            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Filter className="w-4 h-4 mr-2" />
                  Tags
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedTags.length}
                    </Badge>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-64">
                  {allTags.map(tag => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  Tag: {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document List */}
      <ScrollArea className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredDocuments.length} of {mockDocuments.length} email threads
          </div>
          
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No email threads found</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              filteredDocuments.map(doc => (
                <EmailRow
                  key={doc.id}
                  document={doc}
                  onOpen={(docId) => router.push(`/docs/${docId}`)}
                />
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
