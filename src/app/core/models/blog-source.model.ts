export interface BlogSource {
  /** Human-readable display name shown on cards */
  name: string;
  /** Raw RSS feed URL — passed to rss2json.com as rss_url query param */
  rssUrl: string;
  /** Logo shown on article cards sourced from this blog */
  logoUrl: string;
}
