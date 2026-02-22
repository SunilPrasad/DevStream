import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ArticleMetadata } from '../../../core/models/article.model';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.scss',
})
export class ArticleCardComponent {
  readonly article = input.required<ArticleMetadata>();
  readonly summary = input.required<string>();
  private readonly fallbackLogoUrl = '/favicon.ico';

  readonly next = output<void>();

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.article().sourceLogoUrl;
  }

  protected onSourceLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.endsWith(this.fallbackLogoUrl)) return;
    img.src = this.fallbackLogoUrl;
  }
}
