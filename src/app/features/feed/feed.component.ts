import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { CdkDrag, CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';

import { FeedService } from '../../core/services/feed.service';
import { SummarizerService } from '../../core/services/summarizer.service';
import { ArticleCardComponent } from '../../shared/components/article-card/article-card.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';
import { SettingsPanelComponent } from '../../shared/components/settings-panel/settings-panel.component';
import { ArticleMetadata } from '../../core/models/article.model';

type SlideState = 'idle' | 'exit-up' | 'exit-down';

const SWIPE_HINT_KEY = 'devstream_hint_dismissed';
const SWIPE_THRESHOLD = 72;

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CdkDrag, ArticleCardComponent, SkeletonCardComponent, SettingsPanelComponent],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss',
})
export class FeedComponent {
  private readonly feedService = inject(FeedService);
  private readonly summarizerService = inject(SummarizerService);

  // ── Feed state (from service) ──────────────────────────────────────────
  readonly isLoading = this.feedService.isLoading;
  readonly loadError = this.feedService.loadError;
  readonly articles = this.feedService.articles;
  readonly currentIndex = this.feedService.currentIndex;

  readonly currentArticle = computed<ArticleMetadata | null>(() => {
    const pool = this.articles();
    const idx = this.currentIndex();
    return pool[idx] ?? null;
  });

  // ── Component UI state ─────────────────────────────────────────────────
  /** Non-null once the summary is ready; null → show skeleton */
  readonly currentSummary = signal<string | null>(null);

  /** CSS exit-animation class */
  readonly slideState = signal<SlideState>('idle');

  /** Live Y offset while the user is dragging (for real-time card follow) */
  readonly dragOffsetY = signal(0);
  readonly isDragging = signal(false);

  /** Settings panel visibility */
  readonly showSettings = signal(false);

  /** Swipe hint — hidden once the user swipes at least once */
  readonly hintVisible = signal(!localStorage.getItem(SWIPE_HINT_KEY));

  constructor() {
    effect(() => {
      const article = this.currentArticle();
      if (!article) return;
      this.loadSummaryFor(article);
      this.preSummarizeAhead();
    });
  }

  // ── Keyboard navigation (desktop) ────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.showSettings()) return;
    if (event.key === 'ArrowUp' || event.key === 'k') this.navigate(1);
    if (event.key === 'ArrowDown' || event.key === 'j') this.navigate(-1);
  }

  // ── CDK drag — real-time card follow ─────────────────────────────────
  onDragStarted(): void {
    this.isDragging.set(true);
  }

  onDragMoved(event: CdkDragMove): void {
    this.dragOffsetY.set(event.distance.y);
  }

  onDragEnded(event: CdkDragEnd): void {
    const dy = event.distance.y;
    this.isDragging.set(false);
    this.dragOffsetY.set(0);

    // Reset CDK's internal position tracking.
    // The element's visual position is now managed entirely by our signals/CSS.
    event.source.reset();

    if (dy < -SWIPE_THRESHOLD) {
      this.dismissHint();
      this.navigate(1);
    } else if (dy > SWIPE_THRESHOLD) {
      this.dismissHint();
      this.navigate(-1);
    }
    // else: card snaps back via cdk-drag-animating transition (CSS handles it)
  }

  // Called by (transitionend) on the card wrapper
  onTransitionEnd(): void {
    if (this.slideState() === 'idle') return;
    this.slideState.set('idle');
  }

  // ── Navigation ────────────────────────────────────────────────────────
  navigate(delta: number): void {
    const target = this.currentIndex() + delta;
    const pool = this.articles();
    if (target < 0 || target >= pool.length) return;

    const dir: SlideState = delta > 0 ? 'exit-up' : 'exit-down';
    this.slideState.set(dir);

    setTimeout(() => {
      this.currentSummary.set(null);
      this.feedService.advanceTo(target);
      this.slideState.set('idle');
    }, 280);
  }

  // ── Settings ──────────────────────────────────────────────────────────
  openSettings(): void {
    this.showSettings.set(true);
  }

  closeSettings(): void {
    this.showSettings.set(false);
  }

  // ── Summary loading ───────────────────────────────────────────────────
  private loadSummaryFor(article: ArticleMetadata): void {
    const cached = this.summarizerService.getCached(article.url);
    if (cached !== undefined) {
      this.currentSummary.set(cached);
      return;
    }
    this.currentSummary.set(null);
    this.summarizerService.summarize(article).subscribe({
      next: (s) => this.currentSummary.set(s),
    });
  }

  private preSummarizeAhead(): void {
    const pool = this.articles();
    const idx = this.currentIndex();
    for (let offset = 1; offset <= 2; offset++) {
      const next = pool[idx + offset];
      if (next && this.summarizerService.getCached(next.url) === undefined) {
        this.summarizerService.summarize(next).subscribe();
      }
    }
  }

  private dismissHint(): void {
    if (!this.hintVisible()) return;
    this.hintVisible.set(false);
    localStorage.setItem(SWIPE_HINT_KEY, '1');
  }
}
