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
    logoUrl: '/assets/logos/cloudflare.ico',
  },
  {
    name: 'Meta Engineering',
    rssUrl: 'https://engineering.fb.com/feed/',
    logoUrl: '/assets/logos/meta.ico',
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
    logoUrl: '/assets/logos/shopify.ico',
  },
  {
    name: 'Microsoft DevBlogs',
    rssUrl: 'https://devblogs.microsoft.com/engineering-at-microsoft/feed/',
    logoUrl: '/assets/logos/microsoft.png',
  },
  {
    name: 'GitHub Blog',
    rssUrl: 'https://github.blog/feed/',
    logoUrl: 'https://github.githubassets.com/favicons/favicon.svg',
  },
  {
    name: 'Planet PostgreSQL',
    rssUrl: 'https://planet.postgresql.org/rss20.xml',
    logoUrl: '/assets/logos/planet-postgresql.ico',
  },
  {
    name: 'Redis Blog',
    rssUrl: 'https://redis.io/blog/feed/',
    logoUrl: '/assets/logos/redis.ico',
  },
  {
    name: 'ScyllaDB Blog',
    rssUrl: 'https://www.scylladb.com/feed/',
    logoUrl: '/assets/logos/scylladb.ico',
  },
  {
    name: 'Percona Blog',
    rssUrl: 'https://www.percona.com/blog/feed/',
    logoUrl: 'https://www.percona.com/favicon.ico',
  },
  {
    name: 'HashiCorp Blog',
    rssUrl: 'https://www.hashicorp.com/blog/feed.xml',
    logoUrl: '/assets/logos/hashicorp.png',
  },
];
