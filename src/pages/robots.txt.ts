import type { APIRoute } from "astro";
import { siteConfig } from "../config";

export const GET: APIRoute = async () => {
  const siteUrl = import.meta.env.SITE || siteConfig.site;

  const robotsTxt = `# Content Signals (https://contentsignals.org/, IETF draft-romm-aipref-contentsignals)
# declare AI usage preferences. Recognized by AI/agent crawlers and Cloudflare;
# Semrush's strict RFC 9309 audit flags it as "invalid format", a known false
# positive, the directive is intentionally non-standard.
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /

# Sitemaps
Sitemap: ${siteUrl}sitemap.xml

# RSS Feed
# ${siteUrl}rss.xml

# Disallow common non-content paths
Disallow: /api/
Disallow: /_astro/
Disallow: /_image/
Disallow: /admin/
Disallow: /.well-known/

# Allow search engines to crawl images
Allow: /posts/attachments/
Allow: /pages/attachments/

# Crawl delay (optional)
# Crawl-delay: 1
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
};
