'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import EmailRow from '@/components/email-row';
import type { ThreadSummary, ThreadListResponse } from '@/lib/types';

const PAGE_SIZE = 20;

export default function DocsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search input.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadThreads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedQuery) params.set('q', debouncedQuery);

      const res = await fetch(`/api/threads?${params.toString()}`);
      const data = (await res.json().catch(() => ({}))) as Partial<ThreadListResponse> & {
        error?: string;
      };

      if (!res.ok) {
        setError(data?.error ?? 'Failed to load threads.');
        setThreads([]);
        setTotal(0);
        return;
      }

      setThreads(data.threads ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError('Network error while loading threads.');
      setThreads([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedQuery]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = searchQuery !== '';

  return (
    <div className="h-[calc(100vh-4rem)] max-w-[85%] mx-auto flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-4 py-6">
        <div className="container mx-auto max-w-5xl space-y-4">
          <div className="space-y-2 justify-center items-center flex flex-col">
            <h1 className="text-2xl font-semibold mb-2">Email Thread Browser</h1>
            <p className="text-muted-foreground">
              Explore {total.toLocaleString()} publicly released email threads
            </p>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative w-3/4 justify-center items-center flex mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject or participant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={() => setSearchQuery('')}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <div className="mb-4 text-sm text-muted-foreground">
            {isLoading
              ? 'Loading…'
              : `Showing ${threads.length} of ${total.toLocaleString()} threads (page ${page} of ${totalPages})`}
          </div>

          <div className="space-y-3">
            {error ? (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={loadThreads}>
                  Retry
                </Button>
              </div>
            ) : !isLoading && threads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No email threads found</p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              threads.map((thread) => (
                <EmailRow
                  key={thread.threadKey}
                  thread={thread}
                  onOpen={(threadKey) => router.push(`/docs/${threadKey}`)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
