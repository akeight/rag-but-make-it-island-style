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
