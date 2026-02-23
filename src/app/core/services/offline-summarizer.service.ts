import { Injectable } from '@angular/core';

import { FALLBACK_SUMMARY } from '../constants/summarizer.constants';

type SummarizationOutput = { summary_text: string };
type SummarizationPipeline = (
  text: string,
  options: { max_length: number; min_length: number },
) => Promise<SummarizationOutput[]>;

const OFFLINE_MODEL = 'Xenova/t5-small';
const MAX_FALLBACK_SENTENCES = 6;
const MIN_FALLBACK_SENTENCES = 3;
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is',
  'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'this',
  'these', 'those', 'their', 'there', 'about', 'into', 'than', 'then', 'them', 'they', 'you',
  'your', 'we', 'our', 'can', 'could', 'should', 'would', 'if', 'not', 'no', 'but',
]);

@Injectable({ providedIn: 'root' })
export class OfflineSummarizerService {
  private summarizerPromise: Promise<SummarizationPipeline> | null = null;
  private modelUnavailable = false;

  async summarize(text: string): Promise<string> {
    const plainText = text.trim();
    if (!plainText) return FALLBACK_SUMMARY;

    if (this.modelUnavailable) {
      return this.extractiveFallbackSummary(plainText);
    }

    try {
      const summarizer = await this.getSummarizer();
      const result = await summarizer(plainText, {
        max_length: 200,
        min_length: 100,
      });
      const summary = result[0]?.summary_text?.trim();
      return summary || this.extractiveFallbackSummary(plainText);
    } catch {
      this.modelUnavailable = true;
      this.clearTransformersCache();
      return this.extractiveFallbackSummary(plainText);
    }
  }

  private async getSummarizer(): Promise<SummarizationPipeline> {
    if (!this.summarizerPromise) {
      this.summarizerPromise = this.createSummarizer();
    }

    try {
      return await this.summarizerPromise;
    } catch (error) {
      // Allow a fresh initialization attempt on later requests.
      this.summarizerPromise = null;
      throw error;
    }
  }

  private async createSummarizer(): Promise<SummarizationPipeline> {
    const transformers = (await import('@xenova/transformers')) as {
      pipeline: (task: string, model: string) => Promise<unknown>;
    };
    return (await transformers.pipeline(
      'summarization',
      OFFLINE_MODEL,
    )) as SummarizationPipeline;
  }

  private extractiveFallbackSummary(text: string): string {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return FALLBACK_SUMMARY;

    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30);

    if (sentences.length === 0) {
      return normalized.slice(0, 520);
    }

    const frequencies = this.buildWordFrequency(sentences);
    const scored = sentences.map((sentence, index) => ({
      index,
      sentence,
      score: this.scoreSentence(sentence, frequencies),
    }));

    const targetCount = Math.min(
      MAX_FALLBACK_SENTENCES,
      Math.max(MIN_FALLBACK_SENTENCES, Math.ceil(sentences.length * 0.35)),
    );

    const selected = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCount)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.sentence);

    const summary = selected.join('\n\n').trim();
    return summary || FALLBACK_SUMMARY;
  }

  private buildWordFrequency(sentences: string[]): Map<string, number> {
    const freq = new Map<string, number>();
    for (const sentence of sentences) {
      const words = sentence.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? [];
      for (const word of words) {
        if (word.length < 3 || STOPWORDS.has(word)) continue;
        freq.set(word, (freq.get(word) ?? 0) + 1);
      }
    }
    return freq;
  }

  private scoreSentence(sentence: string, frequencies: Map<string, number>): number {
    const words = sentence.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? [];
    if (words.length === 0) return 0;

    let score = 0;
    let counted = 0;
    for (const word of words) {
      if (word.length < 3 || STOPWORDS.has(word)) continue;
      score += frequencies.get(word) ?? 0;
      counted++;
    }

    if (counted === 0) return 0;
    return score / counted;
  }

  private clearTransformersCache(): void {
    if (typeof caches === 'undefined') return;
    void caches.delete('transformers-cache');
  }
}
