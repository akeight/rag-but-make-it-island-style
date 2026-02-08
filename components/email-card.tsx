import { FileText } from "lucide-react";
import { Card } from "./ui/card";

interface EmailCardProps {
  title: string;
  page: number;
  snippet: string;
}

export default function EmailCard({ title, page, snippet }: EmailCardProps) {
  return (
    <Card className="p-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
        <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                    {title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                    Page {page}
                    </div>
                    <div className="text-xs mt-1 line-clamp-2">
                    &quot;{snippet}&quot;
                    </div>
                </div>
        </div>
    </Card>
  );
}