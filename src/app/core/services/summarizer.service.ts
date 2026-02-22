import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { ArticleMetadata } from '../models/article.model';
import { ClaudeRequest, ClaudeResponse } from '../models/claude-api.model';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1500;
const API_KEY_STORAGE_KEY = 'devstream_claude_api_key';
const FALLBACK_SUMMARY = 'Summary unavailable for this article.';

const SUMMARISE_PROMPT = (title: string, text: string) =>
  `Article title: ${title}\n\n${text}\n\n` +
  `Write a detailed 10 to 15 line summary of this article in plain readable prose. ` +
  `Do not use bullet points. Write as flowing paragraphs that give the reader genuine ` +
  `insight into what the article covers.`;

@Injectable({ providedIn: 'root' })
export class SummarizerService {
  private readonly http = inject(HttpClient);

  /** In-memory summary cache — keyed by article URL. Never persisted. */
  private readonly cache = new Map<string, string>();

  getCached(url: string): string | undefined {
    return this.cache.get(url);
  }

  /**
   * Returns a cached summary immediately, or calls the Claude API.
   * Never throws — falls back to FALLBACK_SUMMARY on any error.
   */
  summarize(article: ArticleMetadata): Observable<string> {
    const cached = this.cache.get(article.url);
    if (cached !== undefined) return of(cached);

    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!apiKey) {
      const msg = 'Add your Claude API key in Settings to enable summaries.';
      return of(msg);
    }

    const plainText = this.stripHtml(article.rawContent ?? '');
    if (!plainText.trim()) {
      return of(FALLBACK_SUMMARY);
    }

    const body: ClaudeRequest = {
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: SUMMARISE_PROMPT(article.title, plainText) }],
    };

    const headers = new HttpHeaders({
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    });

    return this.http.post<ClaudeResponse>(CLAUDE_API_URL, body, { headers }).pipe(
      map((response) => response.content[0]?.text ?? FALLBACK_SUMMARY),
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
