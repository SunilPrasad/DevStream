import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { vi } from 'vitest';

const pipelineMock = vi.fn();
vi.mock('@xenova/transformers', () => ({ pipeline: pipelineMock }));

import { FALLBACK_SUMMARY } from '../constants/summarizer.constants';
import { OfflineSummarizerService } from './offline-summarizer.service';

const LONG_TEXT =
  'DevStream aggregates articles from multiple engineering blogs. ' +
  'It presents one card at a time and preloads nearby cards for smooth navigation. ' +
  'The offline summarizer should provide useful prose even when model loading fails. ' +
  'Users still need readable summaries without API keys or cloud dependencies. ' +
  'A robust fallback avoids blank cards and keeps the reading flow uninterrupted.';

describe('OfflineSummarizerService', () => {
  function buildService(): OfflineSummarizerService {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    return TestBed.inject(OfflineSummarizerService);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates the summarization pipeline lazily and reuses it', async () => {
    const summarizeFn = vi.fn().mockResolvedValue([{ summary_text: 'Offline summary' }]);
    pipelineMock.mockResolvedValue(summarizeFn);

    const service = buildService();

    const first = await service.summarize('Article text one');
    const second = await service.summarize('Article text two');

    expect(first).toBe('Offline summary');
    expect(second).toBe('Offline summary');
    expect(pipelineMock).toHaveBeenCalledTimes(1);
    expect(pipelineMock).toHaveBeenCalledWith('summarization', 'Xenova/t5-small');
    expect(summarizeFn).toHaveBeenCalledWith('Article text one', {
      max_length: 200,
      min_length: 100,
    });
  });

  it('returns heuristic summary when pipeline initialization fails', async () => {
    pipelineMock.mockRejectedValue(new Error('pipeline load failed'));

    const service = buildService();

    const result = await service.summarize(LONG_TEXT);

    expect(result).not.toBe(FALLBACK_SUMMARY);
    expect(result.length).toBeGreaterThan(40);
  });

  it('returns heuristic summary when model output is empty', async () => {
    const summarizeFn = vi.fn().mockResolvedValue([]);
    pipelineMock.mockResolvedValue(summarizeFn);

    const service = buildService();

    const result = await service.summarize(LONG_TEXT);

    expect(result).not.toBe(FALLBACK_SUMMARY);
    expect(result.length).toBeGreaterThan(40);
  });

  it('stops retrying model initialization after a hard failure', async () => {
    pipelineMock.mockRejectedValue(new Error('protobuf parsing failed'));

    const service = buildService();
    await service.summarize(LONG_TEXT);
    await service.summarize(LONG_TEXT);

    expect(pipelineMock).toHaveBeenCalledTimes(1);
  });
});
