import { BlogSource } from '../models/blog-source.model';

/**
 * All RSS sources for DevStream.
 * Order defines the round-robin interleaving used by FeedService:
 *   Cloudflare[0] → Meta[0] → Google[0] → Discord[0] → Shopify[0]
 *   → Microsoft[0] → GitHub[0] → Planet PostgreSQL[0] → Redis[0]
 *   → ScyllaDB[0] → Percona[0] → HashiCorp[0] → Cloudflare[1] → ...
 */
export const BLOG_SOURCES: BlogSource[] = [
  {
    name: 'Cloudflare Blog',
    rssUrl: 'https://blog.cloudflare.com/rss/',
    logoUrl: 'https://www.cloudflare.com/favicon-32x32.png',
  },
  {
    name: 'Meta Engineering',
    rssUrl: 'https://engineering.fb.com/feed/',
    logoUrl: 'https://engineering.fb.com/wp-content/uploads/2021/09/meta-engineering-logo.png',
  },
  {
    name: 'Google Developers',
    rssUrl: 'https://developers.googleblog.com/feeds/posts/default',
    // Stable Google brand icon from their public gstatic CDN
    logoUrl: 'https://www.gstatic.com/images/branding/googleg/2x/googleg_standard_color_128dp.png',
  },
  {
    name: 'Discord Engineering',
    rssUrl: 'https://discord.com/blog/rss',
    logoUrl: 'https://discord.com/assets/favicon.ico',
  },
  {
    name: 'Shopify Engineering',
    rssUrl: 'https://shopify.engineering/index.xml',
    logoUrl: 'https://shopify.dev/favicons/favicon-32x32.png',
  },
  {
    name: 'Microsoft DevBlogs',
    rssUrl: 'https://devblogs.microsoft.com/engineering-at-microsoft/feed/',
    logoUrl: 'https://devblogs.microsoft.com/wp-content/uploads/sites/34/2019/02/cropped-microsoft_logo_element.png',
  },
  {
    name: 'GitHub Blog',
    rssUrl: 'https://github.blog/feed/',
    logoUrl: 'https://github.githubassets.com/favicons/favicon.svg',
  },
  {
    name: 'Planet PostgreSQL',
    rssUrl: 'https://planet.postgresql.org/rss20.xml',
    logoUrl: 'https://planet.postgresql.org/favicon.ico',
  },
  {
    name: 'Redis Blog',
    rssUrl: 'https://redis.io/blog/feed/',
    logoUrl: 'https://redis.io/images/favicons/favicon-32x32.png',
  },
  {
    name: 'ScyllaDB Blog',
    rssUrl: 'https://www.scylladb.com/feed/',
    logoUrl: 'https://www.scylladb.com/wp-content/uploads/favicon.png',
  },
  {
    name: 'Percona Blog',
    rssUrl: 'https://www.percona.com/blog/feed/',
    logoUrl: 'https://www.percona.com/favicon.ico',
  },
  {
    name: 'HashiCorp Blog',
    rssUrl: 'https://www.hashicorp.com/blog/feed.xml',
    logoUrl: 'https://www.hashicorp.com/favicon.ico',
  },
];
