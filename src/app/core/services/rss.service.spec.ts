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

const RSS2_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
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
      <description><![CDATA[<p><img src="https://example.com/desc-img.jpg"/></p>]]></description>
    </item>
  </channel>
</rss>`;

const ATOM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Atom Article</title>
    <link rel="alternate" href="https://example.com/atom-1"/>
    <published>2025-01-12T10:00:00Z</published>
    <content type="html"><![CDATA[<p>Atom content.</p>]]></content>
  </entry>
</feed>`;

const RSS2JSON_OK = {
  status: 'ok',
  feed: {
    url: 'https://example.com/feed',
    title: 'Example Feed',
    link: 'https://example.com',
    author: 'Example',
    description: 'Example feed',
    image: 'https://example.com/feed.png',
  },
  items: [
    {
      title: 'JSON Article',
      pubDate: '2025-01-12 10:00:00',
      link: 'https://example.com/json-article',
      guid: 'json-1',
      author: 'Author',
      thumbnail: 'https://example.com/json-thumb.jpg',
      description: '<p>JSON excerpt</p>',
      content: '<p>JSON content</p>',
      enclosure: {},
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

  it('requests codetabs proxy first', () => {
    service.fetchArticles(mockSource).subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('api.codetabs.com'));
    expect(req.request.url).toContain(encodeURIComponent(mockSource.rssUrl));
    req.flush(RSS2_XML);
  });

  it('parses RSS 2.0 items from proxy XML', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [];
    service.fetchArticles(mockSource).subscribe((a) => (result = a));

    httpMock.expectOne((r) => r.url.includes('api.codetabs.com')).flush(RSS2_XML);

    expect(result.length).toBe(2);
    expect(result[0]).toMatchObject({
      url: 'https://example.com/article-1',
      title: 'Article One',
      imageUrl: 'https://example.com/img.jpg',
      sourceName: 'Test Blog',
      sourceLogoUrl: 'https://example.com/logo.png',
    });
    expect(result[0].rawContent).toContain('Full content here.');
    expect(result[1].imageUrl).toBe('https://example.com/desc-img.jpg');
  });

  it('parses Atom feeds from proxy XML', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [];
    service.fetchArticles(mockSource).subscribe((a) => (result = a));

    httpMock.expectOne((r) => r.url.includes('api.codetabs.com')).flush(ATOM_XML);

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      url: 'https://example.com/atom-1',
      title: 'Atom Article',
      publishedDate: '2025-01-12T10:00:00Z',
    });
  });

  it('falls back to rss2json when codetabs fails', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [];
    service.fetchArticles(mockSource).subscribe((a) => (result = a));

    httpMock
      .expectOne((r) => r.url.includes('api.codetabs.com'))
      .flush('', { status: 500, statusText: 'Server Error' });

    httpMock.expectOne((r) => r.url.includes('api.rss2json.com')).flush(RSS2JSON_OK);

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      url: 'https://example.com/json-article',
      title: 'JSON Article',
      imageUrl: 'https://example.com/json-thumb.jpg',
    });
  });

  it('returns [] when all sources fail', () => {
    let result: import('../models/article.model').ArticleMetadata[] = [
      { url: 'x', title: 'x', imageUrl: null, publishedDate: '', sourceName: '', sourceLogoUrl: '' },
    ];

    service.fetchArticles(mockSource).subscribe((a) => (result = a));

    httpMock
      .expectOne((r) => r.url.includes('api.codetabs.com'))
      .flush('', { status: 500, statusText: 'Server Error' });

    httpMock
      .expectOne((r) => r.url.includes('api.rss2json.com'))
      .flush({ status: 'error', message: 'bad feed' }, { status: 200, statusText: 'OK' });

    expect(result).toEqual([]);
  });
});
