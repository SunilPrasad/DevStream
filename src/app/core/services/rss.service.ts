import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ArticleMetadata } from '../models/article.model';
import { BlogSource } from '../models/blog-source.model';
import { Rss2JsonItem, Rss2JsonResponse } from '../models/rss2json.model';

/**
 * XML proxy chain used for direct RSS/Atom parsing.
 * codetabs is first because it currently works better from static hosting
 * origins where some public proxies return 403.
 */
const XML_CORS_PROXIES: Array<(url: string) => string> = [
  (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
];

const RSS2JSON_ENDPOINT = 'https://api.rss2json.com/v1/api.json';
const MAX_ITEMS = 20;

// Yahoo Media RSS namespace URI
const MEDIA_NS = 'http://search.yahoo.com/mrss/';

@Injectable({ providedIn: 'root' })
export class RssService {
  private readonly http = inject(HttpClient);

  /**
   * Fetch one feed client-side with fallbacks:
   * 1) XML via proxy chain
   * 2) rss2json as final fallback
   */
  fetchArticles(source: BlogSource): Observable<ArticleMetadata[]> {
    return this.tryXmlProxy(source, 0);
  }

  private tryXmlProxy(source: BlogSource, index: number): Observable<ArticleMetadata[]> {
    if (index >= XML_CORS_PROXIES.length) {
      return this.fetchViaRss2Json(source).pipe(catchError(() => of([])));
    }

    return this.http.get(XML_CORS_PROXIES[index](source.rssUrl), { responseType: 'text' }).pipe(
      map((xml) => {
        const parsed = this.parseXml(xml, source);
        if (parsed === null) throw new Error('Proxy returned non-XML content');
        return parsed;
      }),
      catchError(() => this.tryXmlProxy(source, index + 1)),
    );
  }

  private fetchViaRss2Json(source: BlogSource): Observable<ArticleMetadata[]> {
    const url = `${RSS2JSON_ENDPOINT}?rss_url=${encodeURIComponent(source.rssUrl)}`;

    return this.http.get<Rss2JsonResponse>(url).pipe(
      map((response) => {
        if (response.status !== 'ok') {
          throw new Error(response.message ?? 'rss2json error');
        }

        return this.mapRss2JsonItems(response.items, source);
      }),
    );
  }

  private mapRss2JsonItems(items: Rss2JsonItem[], source: BlogSource): ArticleMetadata[] {
    return items.slice(0, MAX_ITEMS).map((item) => ({
      url: item.link?.trim() ?? '',
      title: item.title?.trim() ?? '',
      imageUrl: this.imageRss2Json(item),
      publishedDate: item.pubDate ?? '',
      sourceName: source.name,
      sourceLogoUrl: source.logoUrl,
      rawContent: item.content || item.description,
    }));
  }

  private parseXml(xml: string, source: BlogSource): ArticleMetadata[] | null {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    // DOMParser signals parse errors with <parsererror>
    if (doc.querySelector('parsererror')) return null;

    // Atom feeds use <feed>; RSS 2.0 feeds use <rss>
    if (!['feed', 'rss'].includes(doc.documentElement.localName)) return null;

    return doc.documentElement.localName === 'feed'
      ? this.parseAtom(doc, source)
      : this.parseRss2(doc, source);
  }

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
        rawContent: this.text(item, 'content:encoded') || this.text(item, 'description'),
      }));
  }

  private rssLink(item: Element): string {
    const text = item.getElementsByTagName('link')[0]?.textContent?.trim();
    if (text) return text;

    return (
      item.getElementsByTagName('link')[0]?.getAttribute('href') ??
      item.getElementsByTagName('guid')[0]?.textContent?.trim() ??
      ''
    );
  }

  private parseAtom(doc: Document, source: BlogSource): ArticleMetadata[] {
    return Array.from(doc.getElementsByTagName('entry'))
      .slice(0, MAX_ITEMS)
      .map((entry) => ({
        url: this.atomLink(entry),
        title: this.text(entry, 'title'),
        imageUrl: this.imageAtom(entry),
        publishedDate: this.text(entry, 'published') || this.text(entry, 'updated'),
        sourceName: source.name,
        sourceLogoUrl: source.logoUrl,
        rawContent: this.text(entry, 'content') || this.text(entry, 'summary'),
      }));
  }

  private atomLink(entry: Element): string {
    const links = Array.from(entry.getElementsByTagName('link'));
    const alt = links.find((l) => l.getAttribute('rel') === 'alternate');

    return (alt ?? links.find((l) => l.hasAttribute('href')))?.getAttribute('href') ?? '';
  }

  private imageRss(item: Element): string | null {
    const mediaContent = item.getElementsByTagNameNS(MEDIA_NS, 'content')[0];
    if (mediaContent?.getAttribute('url')) return mediaContent.getAttribute('url');

    const mediaThumbnail = item.getElementsByTagNameNS(MEDIA_NS, 'thumbnail')[0];
    if (mediaThumbnail?.getAttribute('url')) return mediaThumbnail.getAttribute('url');

    const enclosure = item.getElementsByTagName('enclosure')[0];
    if (enclosure?.getAttribute('type')?.startsWith('image/')) {
      return enclosure.getAttribute('url');
    }

    const html = this.text(item, 'content:encoded') || this.text(item, 'description');
    return this.firstImgSrc(html);
  }

  private imageAtom(entry: Element): string | null {
    const mediaContent = entry.getElementsByTagNameNS(MEDIA_NS, 'content')[0];
    if (mediaContent?.getAttribute('url')) return mediaContent.getAttribute('url');

    const mediaThumbnail = entry.getElementsByTagNameNS(MEDIA_NS, 'thumbnail')[0];
    if (mediaThumbnail?.getAttribute('url')) return mediaThumbnail.getAttribute('url');

    const html = this.text(entry, 'content') || this.text(entry, 'summary');
    return this.firstImgSrc(html);
  }

  private imageRss2Json(item: Rss2JsonItem): string | null {
    if (item.thumbnail) return item.thumbnail;

    const enclosure = item.enclosure?.link;
    if (enclosure && this.looksLikeImageUrl(enclosure)) return enclosure;

    return this.firstImgSrc(item.content || item.description);
  }

  private text(el: Element, tagName: string): string {
    return el.getElementsByTagName(tagName)[0]?.textContent?.trim() ?? '';
  }

  private firstImgSrc(html: string): string | null {
    if (!html) return null;

    const div = document.createElement('div');
    div.innerHTML = html;
    return div.querySelector('img')?.getAttribute('src') ?? null;
  }

  private looksLikeImageUrl(url: string): boolean {
    return /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(url);
  }
}
