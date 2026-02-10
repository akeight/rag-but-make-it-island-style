export interface Citation {
  docId: string;
  docTitle: string;
  page?: number;
  section?: string;
  snippet: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp?: Date;
}
