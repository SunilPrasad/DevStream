import { BlogSource } from '../models/blog-source.model';

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
    logoUrl: 'https://www.gstatic.com/devrel-devsite/prod/v870e399c64f6d325c1f390d2d89f0ecc5de7b3248b49b5cf4b8bb0e73b8e4b47/developers/images/favicon-new.png',
  },
  {
    name: 'Uber Engineering',
    rssUrl: 'https://www.uber.com/en-US/blog/engineering/rss/',
    logoUrl: 'https://d1a3f4spazzht1.cloudfront.net/i/a90b736cd858ebab0f4e6dbe8c6ebdfa.png',
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
