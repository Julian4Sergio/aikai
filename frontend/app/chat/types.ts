export type ChatError = {
  error_code: string;
  error_message: string;
  request_id: string;
};

export type ChatCompletionSuccess = {
  answer: string;
  request_id: string;
  latency_ms: number;
};

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatTurn = {
  question: string;
  answer: string;
  requestId: string;
  latencyMs: number | null;
};
