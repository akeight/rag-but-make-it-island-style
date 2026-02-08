'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { AnimatedBackground } from '@/components/animated-background';
import AnimatedList from '@/components/ui/animated-list';
import EmailCard from '@/components/email-card';
import { mockDocuments } from '@/lib/mock-data';

export default function Page() {
  const router = useRouter();
  const handleNavigate = (page: string) => {
    router.push(`/${page}`);
  };

  return (
    <div className="w-full h-full">
      <AnimatedBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-6">
              <Badge variant="secondary" className="w-fit">
                Public Document Corpus
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl">
                Shine a light on your questions. Get cited answers.
              </h1>
              
              <p className="text-lg text-muted-foreground">
                Explore the public Epstein emails with source links you can verify. 
                Every answer is grounded in citations from the available documents.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" onClick={() => handleNavigate('chat')}>
                  Start chatting
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => handleNavigate('docs')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Browse documents
                </Button>
              </div>

              <div className="pt-8 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Source-grounded responses</div>
                    <div className="text-sm text-muted-foreground">
                      Every answer includes citations to specific documents and pages
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Verify claims instantly</div>
                    <div className="text-sm text-muted-foreground">
                      Click any citation to open the source document viewer
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Explore the full corpus</div>
                    <div className="text-sm text-muted-foreground">
                      Search and filter documents by type, date, and topic
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Preview Card */}
            <Card className="p-6 bg-card/80 backdrop-blur border-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Sample answer with citations</span>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed">
                    According to the available flight logs, there are extensive records 
                    of private flights between 1997 and 2005. The logs document passenger 
                    manifests, departure and arrival locations, and dates...
                  </p>
                  
                  <div className="space-y-2">
                  <div className="text-sm font-medium">Sources (5):</div>
                  <AnimatedList
                    items={mockDocuments.slice(0, 5).map((document) => (
                      <EmailCard
                        key={document.id}
                        title={document.title}
                        page={1}
                        snippet={document.content}
                      />
                    ))}
                    className="w-full"
                    listClassName="max-h-[200px]"
                    itemClassName="bg-transparent p-0 text-foreground"
                    itemGapClassName="mb-2"
                    showGradients={false}
                    enableArrowNavigation={false}
                    displayScrollbar={true}
                  />

                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

