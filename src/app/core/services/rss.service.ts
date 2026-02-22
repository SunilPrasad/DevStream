import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ArticleMetadata } from '../models/article.model';
import { BlogSource } from '../models/blog-source.model';
import { Rss2JsonItem, Rss2JsonResponse } from '../models/rss2json.model';

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json';
const ARTICLES_PER_SOURCE = 20;

@Injectable({ providedIn: 'root' })
export class RssService {
  private readonly http = inject(HttpClient);

  /**
   * Fetch articles for one RSS source via rss2json.com.
   * Never throws — returns an empty array on any error so the feed
   * keeps loading even when individual sources are unavailable.
   */
  fetchArticles(source: BlogSource): Observable<ArticleMetadata[]> {
    const apiUrl =
      `${RSS2JSON_BASE}` +
      `?rss_url=${encodeURIComponent(source.rssUrl)}` +
      `&count=${ARTICLES_PER_SOURCE}`;

    return this.http.get<Rss2JsonResponse>(apiUrl).pipe(
      map((response) => {
        if (response.status !== 'ok' || !Array.isArray(response.items)) {
          return [];
        }
        return response.items.map((item) => this.toMetadata(item, source));
      }),
      catchError(() => of([])),
    );
  }

  private toMetadata(item: Rss2JsonItem, source: BlogSource): ArticleMetadata {
    return {
      url: item.link,
      title: item.title,
      imageUrl: this.extractImage(item),
      publishedDate: item.pubDate,
      sourceName: source.name,
      sourceLogoUrl: source.logoUrl,
    };
  }

  /**
   * Image priority: thumbnail field → enclosure link (image/* type)
   * → null (card falls back to source logo)
   */
  private extractImage(item: Rss2JsonItem): string | null {
    if (item.thumbnail) return item.thumbnail;

    const enc = item.enclosure;
    if (enc?.link && enc?.type?.startsWith('image/')) {
      return enc.link;
    }

    return null;
  }
}
