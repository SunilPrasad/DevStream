import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { RssService } from './rss.service';
import { BlogSource } from '../models/blog-source.model';

const mockSource: BlogSource = {
  name: 'Test Blog',
  rssUrl: 'https://example.com/feed',
  logoUrl: 'https://example.com/logo.png',
};

// ── RSS 2.0 fixture ──────────────────────────────────────────────────────────
const RSS2_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Test Blog</title>
    <item>
      <title>Article One</title>
      <link>https://example.com/article-1</link>
      <pubDate>Sun, 12 Jan 2025 10:00:00 +0000</pubDate>
      <media:content url="https://example.com/img.jpg" medium="image"/>
      <description>Short excerpt</description>
      <content:encoded><![CDATA[<p>Full content here.</p>]]></content:encoded>
    </item>
    <item>
      <title>Article Two</title>
      <link>https://example.com/article-2</link>
      <pubDate>Sat, 11 Jan 2025 10:00:00 +0000</pubDate>
      <enclosure url="https://example.com/enc.jpg" type="image/jpeg" length="0"/>
      <description>Another excerpt</description>
    </item>
    <item>
      <title>Article Three</title>
      <link>https://example.com/article-3</link>
      <pubDate>Fri, 10 Jan 2025 10:00:00 +0000</pubDate>
      <description><![CDATA[<p><img src="https://example.com/desc-img.jpg"/></p>]]></description>
    </item>
  </channel>
</rss>`;

// ── Atom fixture ─────────────────────────────────────────────────────────────
const ATOM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Atom Blog</title>
  <entry>
    <title>Atom Article</title>
    <link rel="alternate" href="https://example.com/atom-1"/>
    <published>2025-01-12T10:00:00Z</published>
    <content type="html"><![CDATA[<p>Atom content.</p>]]></content>
  </entry>
</feed>`;

// ── Broken XML ───────────────────────────────────────────────────────────────
const BAD_XML = `not xml at all <<< broken`;

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

  // ── URL ───────────────────────────────────────────────────────────────────

  it('routes requests through allorigins.win', () => {
    service.fetchArticles(mockSource).subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('allorigins.win'));
    expect(req.request.url).toContain(encodeURIComponent(mockSource.rssUrl));
    req.flush(RSS2_XML);
  });

  // ── RSS 2.0 parsing ───────────────────────────────────────────────────────

  it('parses RSS 2.0 items into ArticleMetadata', () => {
    let result: ReturnType<typeof service.fetchArticles> extends import('rxjs').Observable<infer T> ? T : never = [];
    service.fetchArticles(mockSource).subscribe((a) => (result = a));
    httpMock.expectOne((r) => r.url.includes('allorigins.win')).flush(RSS2_XML);

    expect(result.length).toBe(3);
    expect(result[0]).toMatchObject({
      url: 'https://example.com/article-1',
      title: 'Article One',
      imageUrl: 'https://example.com/img.jpg',
      sourceName: 'Test Blog',
      sourceLogoUrl: 'https://example.com/logo.png',
    });
  });

  it('falls back to enclosure image when media:content is absent', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [];
    service.fetchArticles(mockSource).subscribe((a) => (result = a));
    httpMock.expectOne((r) => r.url.includes('allorigins.win')).flush(RSS2_XML);

    expect(result[1].imageUrl).toBe('https://example.com/enc.jpg');
  });

  it('falls back to first <img> in description when no media elements exist', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [];
    service.fetchArticles(mockSource).subscribe((a) => (result = a));
    httpMock.expectOne((r) => r.url.includes('allorigins.win')).flush(RSS2_XML);

    expect(result[2].imageUrl).toBe('https://example.com/desc-img.jpg');
  });

  it('stores content:encoded in rawContent', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [];
    service.fetchArticles(mockSource).subscribe((a) => (result = a));
    httpMock.expectOne((r) => r.url.includes('allorigins.win')).flush(RSS2_XML);

    expect(result[0].rawContent).toContain('Full content here.');
  });

  // ── Atom parsing ──────────────────────────────────────────────────────────

  it('parses Atom feeds', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [];
    service.fetchArticles(mockSource).subscribe((a) => (result = a));
    httpMock.expectOne((r) => r.url.includes('allorigins.win')).flush(ATOM_XML);

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      url: 'https://example.com/atom-1',
      title: 'Atom Article',
      publishedDate: '2025-01-12T10:00:00Z',
    });
  });

  // ── Error cases ───────────────────────────────────────────────────────────

  it('returns [] on malformed XML', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [{ url: 'x', title: 'x', imageUrl: null, publishedDate: '', sourceName: '', sourceLogoUrl: '' }];
    service.fetchArticles(mockSource).subscribe((a) => (result = a));
    httpMock.expectOne((r) => r.url.includes('allorigins.win')).flush(BAD_XML);

    expect(result).toEqual([]);
  });

  it('returns [] on HTTP error', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [{ url: 'x', title: 'x', imageUrl: null, publishedDate: '', sourceName: '', sourceLogoUrl: '' }];
    service.fetchArticles(mockSource).subscribe((a) => (result = a));
    httpMock
      .expectOne((r) => r.url.includes('allorigins.win'))
      .flush('', { status: 500, statusText: 'Server Error' });

    expect(result).toEqual([]);
  });
});
