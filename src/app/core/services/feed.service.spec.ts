import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { FeedService } from './feed.service';
import { RssService } from './rss.service';
import { ArticleMetadata } from '../models/article.model';
import { BlogSource } from '../models/blog-source.model';

const makeArticle = (n: number, source = 'Blog'): ArticleMetadata => ({
  url: `https://example.com/${n}`,
  title: `Article ${n}`,
  imageUrl: null,
  publishedDate: '2025-01-01',
  sourceName: source,
  sourceLogoUrl: 'https://example.com/logo.png',
});

// Round-robin source order from BLOG_SOURCES
const SOURCE_NAMES = [
  'Cloudflare Blog', 'Meta Engineering', 'Google Developers',
  'Discord Engineering', 'Shopify Engineering', 'Microsoft DevBlogs', 'GitHub Blog',
  'Planet PostgreSQL', 'Redis Blog', 'ScyllaDB Blog', 'Percona Blog', 'HashiCorp Blog',
];

describe('FeedService', () => {
  const fetchArticlesMock = vi.fn<(src: BlogSource) => ReturnType<RssService['fetchArticles']>>();

  function buildService(): FeedService {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: RssService, useValue: { fetchArticles: fetchArticlesMock } },
      ],
    });
    return TestBed.inject(FeedService);
  }

  beforeEach(() => {
    localStorage.clear();
    fetchArticlesMock.mockReset();
    // TestBed must be reset between tests because FeedService is a singleton
    TestBed.resetTestingModule();
  });

  it('interleaves articles round-robin across sources', () => {
    fetchArticlesMock.mockImplementation((src: BlogSource) => {
      const idx = SOURCE_NAMES.indexOf(src.name);
      return of([makeArticle(idx * 10, src.name), makeArticle(idx * 10 + 1, src.name)]);
    });

    const service = buildService();
    const pool = service.articles();

    // 12 sources × 2 articles each
    expect(pool.length).toBe(SOURCE_NAMES.length * 2);

    // First 12 slots: one article per source in order
    expect(pool[0].sourceName).toBe('Cloudflare Blog');
    expect(pool[1].sourceName).toBe('Meta Engineering');
    expect(pool[6].sourceName).toBe('GitHub Blog');

    // Slot 7 is the 8th source in the first round
    expect(pool[7].sourceName).toBe('Planet PostgreSQL');

    // Second round starts at index 12
    expect(pool[12].sourceName).toBe('Cloudflare Blog');
  });

  it('skips sources that fail and still builds a pool', () => {
    fetchArticlesMock.mockImplementation((src: BlogSource) => {
      if (src.name === 'Meta Engineering') return throwError(() => new Error('network'));
      return of([makeArticle(1, src.name)]);
    });

    const service = buildService();

    expect(service.articles().length).toBe(SOURCE_NAMES.length - 1);
    expect(service.isLoading()).toBe(false);
    expect(service.loadError()).toBeNull();
  });

  it('sets loadError when all sources fail', () => {
    fetchArticlesMock.mockReturnValue(throwError(() => new Error('fail')));

    const service = buildService();

    expect(service.articles().length).toBe(0);
    expect(service.loadError()).toBeTruthy();
    expect(service.isLoading()).toBe(false);
  });

  it('restores a saved index from localStorage', () => {
    localStorage.setItem('devstream_last_index', '3');
    fetchArticlesMock.mockReturnValue(
      of([0, 1, 2, 3, 4].map((n) => makeArticle(n))),
    );

    const service = buildService();
    // Pool has 7 sources × 5 articles = 35 items; index 3 is in range
    expect(service.currentIndex()).toBe(3);
  });

  it('picks a random index when localStorage has no saved value', () => {
    fetchArticlesMock.mockReturnValue(of([makeArticle(1), makeArticle(2)]));

    const service = buildService();
    const idx = service.currentIndex();

    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(service.articles().length);
  });

  it('ignores a saved index that is out of range', () => {
    localStorage.setItem('devstream_last_index', '9999');
    fetchArticlesMock.mockReturnValue(of([makeArticle(1)]));

    const service = buildService();
    const idx = service.currentIndex();

    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(service.articles().length);
  });

  it('advanceTo updates currentIndex and persists to localStorage', () => {
    fetchArticlesMock.mockReturnValue(
      of([makeArticle(0), makeArticle(1), makeArticle(2)]),
    );

    const service = buildService();
    service.advanceTo(2);

    expect(service.currentIndex()).toBe(2);
    expect(localStorage.getItem('devstream_last_index')).toBe('2');
  });

  it('advanceTo ignores out-of-range indices', () => {
    fetchArticlesMock.mockReturnValue(of([makeArticle(0)]));

    const service = buildService();
    const before = service.currentIndex();
    service.advanceTo(999);

    expect(service.currentIndex()).toBe(before);
    expect(service.currentIndex()).not.toBe(999);
  });

});
