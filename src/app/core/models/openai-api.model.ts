export interface OpenAiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAiRequest {
  model: string;
  max_tokens: number;
  messages: OpenAiMessage[];
}

export interface OpenAiResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
