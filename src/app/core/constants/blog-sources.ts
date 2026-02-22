import { BlogSource } from '../models/blog-source.model';

/**
 * All RSS sources for DevStream.
 * Order defines the round-robin interleaving used by FeedService:
 *   Netflix[0] → Meta[0] → Google[0] → Uber[0] → Airbnb[0]
 *   → Microsoft[0] → GitHub[0] → Netflix[1] → ...
 */
export const BLOG_SOURCES: BlogSource[] = [
  {
    name: 'Netflix Tech Blog',
    rssUrl: 'https://netflixtechblog.com/feed',
    logoUrl: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.png',
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
    name: 'Uber Engineering',
    rssUrl: 'https://www.uber.com/en-US/blog/engineering/rss/',
    logoUrl: 'https://d3i4yxtzktqr9n.cloudfront.net/web-static/img/favicon.png',
  },
  {
    name: 'Airbnb Engineering',
    rssUrl: 'https://medium.com/feed/airbnb-engineering',
    logoUrl: 'https://a0.muscache.com/airbnb/static/icons/apple-touch-icon-180x180-bcbe0ce8b57f11b5f64a89efe2a3dc0c.png',
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
];
