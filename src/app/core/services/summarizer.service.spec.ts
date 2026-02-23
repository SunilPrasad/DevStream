import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { vi } from 'vitest';

import { ArticleMetadata } from '../models/article.model';
import {
  CLAUDE_KEY,
  FALLBACK_SUMMARY,
  OPENAI_KEY,
  SUMMARIZER_MODE_KEY,
} from '../constants/summarizer.constants';
import { OfflineSummarizerService } from './offline-summarizer.service';
import { SummarizerService } from './summarizer.service';

const ARTICLE: ArticleMetadata = {
  url: 'https://example.com/post',
  title: 'Example Article',
  imageUrl: null,
  publishedDate: '2026-02-23',
  sourceName: 'Example Blog',
  sourceLogoUrl: 'https://example.com/logo.png',
  rawContent: '<p>This is a detailed article body.</p>',
};

describe('SummarizerService', () => {
  const httpPostMock = vi.fn();
  const offlineSummarizeMock = vi.fn();

  function buildService(): SummarizerService {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { post: httpPostMock } },
        { provide: OfflineSummarizerService, useValue: { summarize: offlineSummarizeMock } },
      ],
    });

    return TestBed.inject(SummarizerService);
  }

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('uses offline mode by default and caches its summary', async () => {
    offlineSummarizeMock.mockResolvedValue('Offline summary');
    const service = buildService();

    const result = await firstValueFrom(service.summarize(ARTICLE));

    expect(result).toBe('Offline summary');
    expect(offlineSummarizeMock).toHaveBeenCalledTimes(1);
    expect(httpPostMock).not.toHaveBeenCalled();
    expect(service.getCached(ARTICLE.url)).toBe('Offline summary');
  });

  it('returns a key-required message for Claude mode without key', async () => {
    localStorage.setItem(SUMMARIZER_MODE_KEY, 'claude');
    const service = buildService();

    const result = await firstValueFrom(service.summarize(ARTICLE));

    expect(result).toContain('Add your Claude API key');
    expect(httpPostMock).not.toHaveBeenCalled();
  });

  it('returns a key-required message for OpenAI mode without key', async () => {
    localStorage.setItem(SUMMARIZER_MODE_KEY, 'openai');
    const service = buildService();

    const result = await firstValueFrom(service.summarize(ARTICLE));

    expect(result).toContain('Add your OpenAI API key');
    expect(httpPostMock).not.toHaveBeenCalled();
  });

  it('returns fallback summary if offline summarization fails', async () => {
    offlineSummarizeMock.mockRejectedValue(new Error('local model failed'));
    const service = buildService();

    const result = await firstValueFrom(service.summarize(ARTICLE));

    expect(result).toBe(FALLBACK_SUMMARY);
  });

  it('keeps cache entries separated by summarizer mode', async () => {
    offlineSummarizeMock.mockResolvedValue('Offline summary');
    const service = buildService();

    localStorage.setItem(SUMMARIZER_MODE_KEY, 'offline');
    const offlineResult = await firstValueFrom(service.summarize(ARTICLE));
    expect(offlineResult).toBe('Offline summary');

    httpPostMock.mockReturnValue(
      of({
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Claude summary' }],
        model: 'claude-sonnet-4-6',
        stop_reason: 'stop',
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    );

    localStorage.setItem(SUMMARIZER_MODE_KEY, 'claude');
    localStorage.setItem(CLAUDE_KEY, 'sk-test');
    const claudeResult = await firstValueFrom(service.summarize(ARTICLE));

    expect(claudeResult).toBe('Claude summary');
    expect(httpPostMock).toHaveBeenCalledTimes(1);
    expect(offlineSummarizeMock).toHaveBeenCalledTimes(1);
    expect(service.getCached(ARTICLE.url)).toBe('Claude summary');

    localStorage.setItem(SUMMARIZER_MODE_KEY, 'offline');
    expect(service.getCached(ARTICLE.url)).toBe('Offline summary');
  });

  it('calls OpenAI when mode is openai and key is configured', async () => {
    localStorage.setItem(SUMMARIZER_MODE_KEY, 'openai');
    localStorage.setItem(OPENAI_KEY, 'sk-openai');
    httpPostMock.mockReturnValue(
      of({
        id: 'chatcmpl_1',
        choices: [{ message: { role: 'assistant', content: 'OpenAI summary' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
    );

    const service = buildService();

    const result = await firstValueFrom(service.summarize(ARTICLE));

    expect(result).toBe('OpenAI summary');
    expect(httpPostMock).toHaveBeenCalledTimes(1);
  });
});
