export type SummarizerMode = 'offline' | 'claude' | 'openai';

export const CLAUDE_KEY = 'devstream_claude_api_key';
export const OPENAI_KEY = 'devstream_openai_api_key';
export const SUMMARIZER_MODE_KEY = 'devstream_summarizer_mode';

export const DEFAULT_SUMMARIZER_MODE: SummarizerMode = 'offline';

export const FALLBACK_SUMMARY = 'Summary unavailable for this article.';

export function isSummarizerMode(value: string | null): value is SummarizerMode {
  return value === 'offline' || value === 'claude' || value === 'openai';
}
