import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ArticleMetadata } from '../models/article.model';
import { BLOG_SOURCES } from '../constants/blog-sources';
import { RssService } from './rss.service';

const STORAGE_KEY = 'devstream_last_index';

@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly rssService = inject(RssService);

  /** Full interleaved article pool for the session. Fixed after load. */
  readonly articles = signal<ArticleMetadata[]>([]);

  /** Index of the currently visible card */
  readonly currentIndex = signal<number>(0);

  /** True while all RSS sources are being fetched in parallel */
  readonly isLoading = signal<boolean>(true);

  /** Non-null if every source failed or pool is empty after loading */
  readonly loadError = signal<string | null>(null);

  constructor() {
    this.loadFeed();
  }

  /**
   * Fetch all sources in parallel, interleave results with round-robin,
   * then restore or randomise the starting position.
   * Individual source failures are swallowed — the session continues
   * with whichever sources succeeded.
   */
  private loadFeed(): void {
    const requests = BLOG_SOURCES.map((source) =>
      this.rssService.fetchArticles(source).pipe(catchError(() => of([]))),
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const pool = this.interleave(results);
        this.articles.set(pool);

        if (pool.length === 0) {
          this.loadError.set('Could not load any articles. Please try again later.');
        } else {
          this.currentIndex.set(this.resolveStartIndex(pool.length));
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Feed failed to load. Please check your connection.');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Remove all articles from the given source and advance to the next
   * article from a different source. Useful when a source fails to
   * produce readable content at runtime.
   */
  skipSource(sourceName: string): void {
    const pool = this.articles();
    const currentIdx = this.currentIndex();

    const filtered = pool.filter((a) => a.sourceName !== sourceName);

    if (filtered.length === 0) {
      this.articles.set([]);
      this.loadError.set('No more articles available after skipping this source.');
      return;
    }

    // Find the first article after the current position that is not from the skipped source
    const nextArticle = pool.slice(currentIdx + 1).find((a) => a.sourceName !== sourceName);
    const newIndex = nextArticle
      ? filtered.indexOf(nextArticle)
      : filtered.length - 1;

    this.articles.set(filtered);
    this.currentIndex.set(Math.max(0, newIndex));
    localStorage.setItem(STORAGE_KEY, String(this.currentIndex()));
  }

  /**
   * Round-robin interleave: Cloudflare[0], Meta[0], Google[0], …,
   * Cloudflare[1], Meta[1], … so the feed never bunches one source.
   */
  private interleave(arrays: ArticleMetadata[][]): ArticleMetadata[] {
    const result: ArticleMetadata[] = [];
    const maxLen = arrays.reduce((m, a) => Math.max(m, a.length), 0);

    for (let i = 0; i < maxLen; i++) {
      for (const arr of arrays) {
        if (i < arr.length) result.push(arr[i]);
      }
    }

    return result;
  }

  /**
   * Saved index wins if it is still within range.
   * First visit or stale index → random start.
   */
  private resolveStartIndex(poolSize: number): number {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx >= 0 && idx < poolSize) return idx;
    }

    return Math.floor(Math.random() * poolSize);
  }

  /**
   * Called by the feed UI after every swipe.
   * Persists the new index to localStorage so the user can resume
   * on their next visit.
   */
  advanceTo(index: number): void {
    const pool = this.articles();
    if (index < 0 || index >= pool.length) return;
    this.currentIndex.set(index);
    localStorage.setItem(STORAGE_KEY, String(index));
  }
}
