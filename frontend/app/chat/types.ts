export type ChatError = {
  error_code: string;
  error_message: string;
  request_id: string;
};

export type StreamDonePayload = {
  request_id: string;
  latency_ms: number;
};

export type StreamDeltaPayload = {
  content: string;
};

export type ParsedSseEvent = {
  event: string;
  data: string;
};

export type ChatTurn = {
  question: string;
  answer: string;
  requestId: string;
  latencyMs: number | null;
};
