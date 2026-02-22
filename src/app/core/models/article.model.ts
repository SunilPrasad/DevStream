export interface ArticleMetadata {
  /** Original article URL — also used as the stable cache key for summaries */
  url: string;
  title: string;
  /** Image extracted from RSS thumbnail/enclosure; null if not present */
  imageUrl: string | null;
  /** ISO-8601 or RSS date string from pubDate */
  publishedDate: string;
  /** Human-readable blog name, e.g. "Netflix Tech Blog" */
  sourceName: string;
  /** Logo URL for the source blog shown in the card header */
  sourceLogoUrl: string;
}
