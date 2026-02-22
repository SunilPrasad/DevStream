import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { ArticleMetadata } from '../models/article.model';
import { ClaudeRequest, ClaudeResponse } from '../models/claude-api.model';
import { OpenAiRequest, OpenAiResponse } from '../models/openai-api.model';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const OPENAI_MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 350;

const CLAUDE_KEY = 'devstream_claude_api_key';
const OPENAI_KEY = 'devstream_openai_api_key';

const FALLBACK_SUMMARY = 'Summary unavailable for this article.';

const SUMMARISE_PROMPT = (title: string, text: string) =>
  `Article title: ${title}\n\n${text}\n\n` +
  `Write a focused 3-paragraph summary of this article in about 120 words. ` +
  `Use plain readable prose — no bullet points, no headers. ` +
  `Cover the key topic, main findings, and why it matters.`;

@Injectable({ providedIn: 'root' })
export class SummarizerService {
  private readonly http = inject(HttpClient);

  /** In-memory summary cache — keyed by article URL. Never persisted. */
  private readonly cache = new Map<string, string>();

  getCached(url: string): string | undefined {
    return this.cache.get(url);
  }

  /**
   * Returns a cached summary immediately, or calls Claude (preferred) or
   * OpenAI (fallback) based on which key is configured in localStorage.
   * Never throws — falls back to FALLBACK_SUMMARY on any error.
   */
  summarize(article: ArticleMetadata): Observable<string> {
    const cached = this.cache.get(article.url);
    if (cached !== undefined) return of(cached);

    const claudeKey = localStorage.getItem(CLAUDE_KEY);
    const openaiKey = localStorage.getItem(OPENAI_KEY);

    if (!claudeKey && !openaiKey) {
      return of('Add your Claude or OpenAI API key in Settings to enable summaries.');
    }

    const plainText = this.stripHtml(article.rawContent ?? '');
    if (!plainText.trim()) return of(FALLBACK_SUMMARY);

    return claudeKey
      ? this.callClaude(article, plainText, claudeKey)
      : this.callOpenAi(article, plainText, openaiKey!);
  }

  private callClaude(
    article: ArticleMetadata,
    text: string,
    apiKey: string,
  ): Observable<string> {
    const body: ClaudeRequest = {
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: SUMMARISE_PROMPT(article.title, text) }],
    };

    const headers = new HttpHeaders({
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    });

    return this.http.post<ClaudeResponse>(CLAUDE_API_URL, body, { headers }).pipe(
      map((r) => r.content[0]?.text ?? FALLBACK_SUMMARY),
      tap((summary) => this.cache.set(article.url, summary)),
      catchError(() => of(FALLBACK_SUMMARY)),
    );
  }

  private callOpenAi(
    article: ArticleMetadata,
    text: string,
    apiKey: string,
  ): Observable<string> {
    const body: OpenAiRequest = {
      model: OPENAI_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: SUMMARISE_PROMPT(article.title, text) }],
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    });

    return this.http.post<OpenAiResponse>(OPENAI_API_URL, body, { headers }).pipe(
      map((r) => r.choices[0]?.message?.content ?? FALLBACK_SUMMARY),
      tap((summary) => this.cache.set(article.url, summary)),
      catchError(() => of(FALLBACK_SUMMARY)),
    );
  }

  private stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent ?? '';
  }
}
