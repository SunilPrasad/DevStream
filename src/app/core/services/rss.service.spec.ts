import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { RssService } from './rss.service';
import { BlogSource } from '../models/blog-source.model';
import { Rss2JsonResponse } from '../models/rss2json.model';

const mockSource: BlogSource = {
  name: 'Test Blog',
  rssUrl: 'https://example.com/feed',
  logoUrl: 'https://example.com/logo.png',
};

const mockResponse: Rss2JsonResponse = {
  status: 'ok',
  feed: { url: '', title: '', link: '', author: '', description: '', image: '' },
  items: [
    {
      title: 'Article One',
      pubDate: '2025-01-12 10:00:00',
      link: 'https://example.com/article-1',
      guid: 'guid-1',
      author: 'Author',
      thumbnail: 'https://example.com/img.jpg',
      description: 'desc',
      content: 'content',
      enclosure: {},
      categories: [],
    },
    {
      title: 'Article Two',
      pubDate: '2025-01-11 10:00:00',
      link: 'https://example.com/article-2',
      guid: 'guid-2',
      author: 'Author',
      thumbnail: '',
      description: 'desc',
      content: 'content',
      enclosure: { link: 'https://example.com/enc.jpg', type: 'image/jpeg' },
      categories: [],
    },
  ],
};

describe('RssService', () => {
  let service: RssService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RssService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('maps rss2json items to ArticleMetadata', () => {
    let result: ReturnType<typeof service.fetchArticles> extends import('rxjs').Observable<infer T> ? T : never = [];

    service.fetchArticles(mockSource).subscribe((articles) => (result = articles));

    const req = httpMock.expectOne((r) => r.url.includes('rss2json.com'));
    req.flush(mockResponse);

    expect(result.length).toBe(2);

    expect(result[0]).toMatchObject({
      url: 'https://example.com/article-1',
      title: 'Article One',
      imageUrl: 'https://example.com/img.jpg',
      sourceName: 'Test Blog',
      sourceLogoUrl: 'https://example.com/logo.png',
    });
  });

  it('falls back to enclosure link when thumbnail is absent', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [];

    service.fetchArticles(mockSource).subscribe((a) => (result = a));
    httpMock.expectOne((r) => r.url.includes('rss2json.com')).flush(mockResponse);

    expect(result[1].imageUrl).toBe('https://example.com/enc.jpg');
  });

  it('returns empty array when rss2json status is error', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [{ url: 'x', title: 'x', imageUrl: null, publishedDate: '', sourceName: '', sourceLogoUrl: '' }];

    service.fetchArticles(mockSource).subscribe((a) => (result = a));
    httpMock
      .expectOne((r) => r.url.includes('rss2json.com'))
      .flush({ status: 'error', message: 'bad url' });

    expect(result).toEqual([]);
  });

  it('returns empty array on HTTP error', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [{ url: 'x', title: 'x', imageUrl: null, publishedDate: '', sourceName: '', sourceLogoUrl: '' }];

    service.fetchArticles(mockSource).subscribe((a) => (result = a));
    httpMock
      .expectOne((r) => r.url.includes('rss2json.com'))
      .flush('', { status: 500, statusText: 'Server Error' });

    expect(result).toEqual([]);
  });
});
