import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ArticleMetadata } from '../models/article.model';
import { BlogSource } from '../models/blog-source.model';

/**
 * CORS proxy — wraps any HTTP URL so the browser can fetch cross-origin RSS.
 * No API key required; corsproxy.io is open-source and free.
 */
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const MAX_ITEMS = 20;

// Yahoo Media RSS namespace URI (used by many blogs for images)
const MEDIA_NS = 'http://search.yahoo.com/mrss/';

@Injectable({ providedIn: 'root' })
export class RssService {
  private readonly http = inject(HttpClient);

  /**
   * Fetch and parse one RSS/Atom feed via the CORS proxy.
   * Returns [] on any network or parse error so the session always continues.
   */
  fetchArticles(source: BlogSource): Observable<ArticleMetadata[]> {
    const url = CORS_PROXY + encodeURIComponent(source.rssUrl);

    return this.http.get(url, { responseType: 'text' }).pipe(
      map((xml) => this.parseXml(xml, source)),
      catchError(() => of([])),
    );
  }

  // ── XML dispatch ────────────────────────────────────────────────────────

  private parseXml(xml: string, source: BlogSource): ArticleMetadata[] {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    // DOMParser signals a parse failure with a <parsererror> element
    if (doc.querySelector('parsererror')) return [];

    // Atom feeds have a <feed> root; RSS 2.0 has <rss><channel>
    return doc.documentElement.localName === 'feed'
      ? this.parseAtom(doc, source)
      : this.parseRss2(doc, source);
  }

  // ── RSS 2.0 ─────────────────────────────────────────────────────────────

  private parseRss2(doc: Document, source: BlogSource): ArticleMetadata[] {
    return Array.from(doc.getElementsByTagName('item'))
      .slice(0, MAX_ITEMS)
      .map((item) => ({
        url: this.rssLink(item),
        title: this.text(item, 'title'),
        imageUrl: this.imageRss(item),
        publishedDate: this.text(item, 'pubDate') || this.text(item, 'dc:date'),
        sourceName: source.name,
        sourceLogoUrl: source.logoUrl,
        rawContent:
          this.text(item, 'content:encoded') || this.text(item, 'description'),
      }));
  }

  /**
   * RSS 2.0 <link> is a text node between tags — it cannot be an attribute.
   * Some feeds also use an Atom-style <link href="..."/> inside RSS, so we
   * check both.
   */
  private rssLink(item: Element): string {
    const text = item.getElementsByTagName('link')[0]?.textContent?.trim();
    if (text) return text;
    return (
      item.getElementsByTagName('link')[0]?.getAttribute('href') ??
      item.getElementsByTagName('guid')[0]?.textContent?.trim() ??
      ''
    );
  }

  // ── Atom ────────────────────────────────────────────────────────────────

  private parseAtom(doc: Document, source: BlogSource): ArticleMetadata[] {
    return Array.from(doc.getElementsByTagName('entry'))
      .slice(0, MAX_ITEMS)
      .map((entry) => ({
        url: this.atomLink(entry),
        title: this.text(entry, 'title'),
        imageUrl: this.imageAtom(entry),
        publishedDate:
          this.text(entry, 'published') || this.text(entry, 'updated'),
        sourceName: source.name,
        sourceLogoUrl: source.logoUrl,
        rawContent:
          this.text(entry, 'content') || this.text(entry, 'summary'),
      }));
  }

  private atomLink(entry: Element): string {
    // Prefer rel="alternate", then first <link> with href
    const links = Array.from(entry.getElementsByTagName('link'));
    const alt = links.find((l) => l.getAttribute('rel') === 'alternate');
    return (
      (alt ?? links.find((l) => l.hasAttribute('href')))?.getAttribute(
        'href',
      ) ?? ''
    );
  }

  // ── Image extraction ────────────────────────────────────────────────────

  private imageRss(item: Element): string | null {
    // 1. media:content (Yahoo Media RSS — most common)
    const mc = item.getElementsByTagNameNS(MEDIA_NS, 'content')[0];
    if (mc?.getAttribute('url')) return mc.getAttribute('url');

    // 2. media:thumbnail
    const mt = item.getElementsByTagNameNS(MEDIA_NS, 'thumbnail')[0];
    if (mt?.getAttribute('url')) return mt.getAttribute('url');

    // 3. <enclosure> with image MIME type
    const enc = item.getElementsByTagName('enclosure')[0];
    if (enc?.getAttribute('type')?.startsWith('image/'))
      return enc.getAttribute('url');

    // 4. First <img> inside content:encoded or description HTML
    const html =
      this.text(item, 'content:encoded') || this.text(item, 'description');
    return this.firstImgSrc(html);
  }

  private imageAtom(entry: Element): string | null {
    const mc = entry.getElementsByTagNameNS(MEDIA_NS, 'content')[0];
    if (mc?.getAttribute('url')) return mc.getAttribute('url');

    const mt = entry.getElementsByTagNameNS(MEDIA_NS, 'thumbnail')[0];
    if (mt?.getAttribute('url')) return mt.getAttribute('url');

    const html = this.text(entry, 'content') || this.text(entry, 'summary');
    return this.firstImgSrc(html);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Safe text extraction — returns '' when element is absent. */
  private text(el: Element, tagName: string): string {
    return el.getElementsByTagName(tagName)[0]?.textContent?.trim() ?? '';
  }

  /** Extract the src of the first <img> found in an HTML string. */
  private firstImgSrc(html: string): string | null {
    if (!html) return null;
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.querySelector('img')?.getAttribute('src') ?? null;
  }
}
