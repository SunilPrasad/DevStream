import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { ArticleMetadata } from '../models/article.model';
import { ClaudeRequest, ClaudeResponse } from '../models/claude-api.model';
import { OpenAiRequest, OpenAiResponse } from '../models/openai-api.model';
import { OfflineSummarizerService } from './offline-summarizer.service';
import {
  CLAUDE_KEY,
  DEFAULT_SUMMARIZER_MODE,
  FALLBACK_SUMMARY,
  isSummarizerMode,
  OPENAI_KEY,
  SummarizerMode,
  SUMMARIZER_MODE_KEY,
} from '../constants/summarizer.constants';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const OPENAI_MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 350;

const SUMMARISE_PROMPT = (title: string, text: string) =>
  `Article title: ${title}\n\n${text}\n\n` +
  `Write a focused 3-paragraph summary of this article in about 120 words. ` +
  `Use plain readable prose - no bullet points, no headers. ` +
  `Cover the key topic, main findings, and why it matters.`;

@Injectable({ providedIn: 'root' })
export class SummarizerService {
  private readonly http = inject(HttpClient);
  private readonly offlineSummarizer = inject(OfflineSummarizerService);

  /** In-memory summary cache, keyed by "<mode>::<articleUrl>". Never persisted. */
  private readonly cache = new Map<string, string>();

  getCached(url: string): string | undefined {
    const mode = this.getCurrentMode();
    return this.cache.get(this.cacheKey(url, mode));
  }

  /**
   * Returns a cached summary immediately, then dispatches by selected mode.
   * Never throws - falls back to FALLBACK_SUMMARY on any error.
   */
  summarize(article: ArticleMetadata): Observable<string> {
    const mode = this.getCurrentMode();
    const key = this.cacheKey(article.url, mode);
    const cached = this.cache.get(key);
    if (cached !== undefined) return of(cached);

    const plainText = this.stripHtml(article.rawContent ?? '');
    if (!plainText.trim()) return of(FALLBACK_SUMMARY);

    if (mode === 'offline') {
      return from(this.offlineSummarizer.summarize(plainText)).pipe(
        tap((summary) => this.cache.set(key, summary)),
        catchError(() => of(FALLBACK_SUMMARY)),
      );
    }

    if (mode === 'claude') {
      const claudeKey = localStorage.getItem(CLAUDE_KEY);
      if (!claudeKey) {
        return of('Add your Claude API key in Settings to enable Claude summaries.');
      }
      return this.callClaude(article, plainText, claudeKey, key);
    }

    const openaiKey = localStorage.getItem(OPENAI_KEY);
    if (!openaiKey) {
      return of('Add your OpenAI API key in Settings to enable OpenAI summaries.');
    }
    return this.callOpenAi(article, plainText, openaiKey, key);
  }

  private callClaude(
    article: ArticleMetadata,
    text: string,
    apiKey: string,
    cacheKey: string,
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
      tap((summary) => this.cache.set(cacheKey, summary)),
      catchError(() => of(FALLBACK_SUMMARY)),
    );
  }

  private callOpenAi(
    article: ArticleMetadata,
    text: string,
    apiKey: string,
    cacheKey: string,
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
      tap((summary) => this.cache.set(cacheKey, summary)),
      catchError(() => of(FALLBACK_SUMMARY)),
    );
  }

  private getCurrentMode(): SummarizerMode {
    const stored = localStorage.getItem(SUMMARIZER_MODE_KEY);
    return isSummarizerMode(stored) ? stored : DEFAULT_SUMMARIZER_MODE;
  }

  private cacheKey(url: string, mode: SummarizerMode): string {
    return `${mode}::${url}`;
  }

  private stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent ?? '';
  }
}
