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

  readonly next = output<void>();
  readonly skipSource = output<void>();

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.article().sourceLogoUrl;
  }
}
