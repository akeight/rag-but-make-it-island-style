export interface Citation {
  ref: string;
  score: number;
  chunkKey: string;
  threadKey: string;
  messageKey: string;
  chunkIndex: number;
  snippet: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp?: Date;
}

export interface ThreadSummary {
  threadKey: string;
  subject: string | null;
  participants: string[];
  messageCount: number;
}

export interface ThreadListResponse {
  threads: ThreadSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ThreadMessage {
  messageKey: string;
  orderIndex: number;
  sender: string | null;
  recipients: string[];
  subject: string | null;
  body: string;
  timestampRaw: string | null;
  timestamp: string | null;
}

export interface ThreadDetailResponse {
  thread: ThreadSummary;
  messages: ThreadMessage[];
}
