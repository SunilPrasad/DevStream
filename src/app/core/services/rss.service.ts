import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ArticleMetadata } from '../models/article.model';
import { BlogSource } from '../models/blog-source.model';

// Placeholder — full implementation in Step 3
@Injectable({ providedIn: 'root' })
export class RssService {
  private readonly http = inject(HttpClient);

  fetchArticles(_source: BlogSource): Observable<ArticleMetadata[]> {
    // TODO: implement rss2json fetch
    return new Observable((obs) => obs.next([]));
  }
}
