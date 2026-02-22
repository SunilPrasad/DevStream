import { Injectable, signal } from '@angular/core';
import { ArticleMetadata } from '../models/article.model';

// Placeholder — full implementation in Step 3
@Injectable({ providedIn: 'root' })
export class FeedService {
  readonly articles = signal<ArticleMetadata[]>([]);
  readonly currentIndex = signal<number>(0);
}
