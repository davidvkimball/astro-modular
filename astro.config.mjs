import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { remarkInternalLinks, remarkFolderImages, remarkImageCaptions } from './src/utils/internallinks.ts';
import remarkCallouts from './src/utils/remark-callouts.ts';
import remarkImageGrids from './src/utils/remark-image-grids.ts';
import remarkMermaid from './src/utils/remark-mermaid.ts';
import { remarkObsidianEmbeds } from './src/utils/remark-obsidian-embeds.ts';
import remarkBases from './src/utils/remark-bases.ts';
import remarkInlineTags from './src/utils/remark-inline-tags.ts';
import { remarkObsidianComments } from './src/utils/remark-obsidian-comments.ts';
import remarkObsidianImageSize from './src/utils/remark-obsidian-image-size.ts';
import remarkMath from 'remark-math';
import remarkReadingTime from 'remark-reading-time';
import remarkToc from 'remark-toc';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import rehypeMark from './src/utils/rehype-mark.ts';
import rehypeImageAttributes from './src/utils/rehype-image-attributes.ts';
import { rehypeNormalizeAnchors } from './src/utils/rehype-normalize-anchors.ts';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { siteConfig } from './src/config.ts';
import swup from '@swup/astro';
import { fileURLToPath } from 'url';

// Deployment platform configuration
const DEPLOYMENT_PLATFORM = process.env.DEPLOYMENT_PLATFORM || 'netlify';

export default defineConfig({
  site: siteConfig.site,
  deployment: {
    platform: DEPLOYMENT_PLATFORM
  },
  csp: {
    scriptDirective: {
      resources: [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://giscus.app",
        "https://platform.twitter.com"
      ]
    },
    styleDirective: {
      resources: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ]
    },
    fontDirective: {
      resources: [
        "'self'",
        "data:",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ]
    },
    imgDirective: {
      resources: ["'self'", "data:", "https:"]
    },
    connectDirective: {
      resources: ["'self'", "https://giscus.app"]
    },
    frameDirective: {
      resources: [
        "'self'",
        "https://www.youtube.com",
        "https://giscus.app",
        "https://platform.twitter.com"
      ]
    }
  },
  devToolbar: {
    enabled: true
  },
  redirects: (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'build') ? {
  '/about-me': '/about',
  '/about-us': '/about',
  '/contact-me': '/contact',
  '/contact-us': '/contact',
  '/privacy': '/privacy-policy',
  '/posts/mermaid-test': '/posts/obsidian-embeds-demo',
  '/posts/mermaid-diagram-test': '/posts/obsidian-embeds-demo',
  '/posts/mermaid-diagrams': '/posts/obsidian-embeds-demo',
  '/posts/astro-suite-vault-modular-guide': '/posts/vault-cms-guide',
  '/posts/astro-suite-obsidian-vault-guide-astro-modular': '/posts/vault-cms-guide',
  '/posts/obsidian-vault-guide': '/posts/vault-cms-guide',
  '/projects/obsidian-astro-composer': '/projects/astro-composer',
  '/projects/obsidian-astro-suite': '/projects/vault-cms',
  '/docs/api-reference': '/docs/api',
  '/docs/astro-modular-configuration': '/docs/configuration',
  '/docs/sourcetree-and-git': '/docs/sourcetree-and-git-setup'
} : {},
image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      }
    },
    remotePatterns: [{
      protocol: 'https'
    }]
  },
  integrations: [
    tailwind(),
    sitemap(),
    mdx(),
    swup({
      theme: false,
      animationClass: 'transition-swup-',
      containers: ['#swup-container'],
      smoothScrolling: false,
      cache: true,
      preload: true,
      accessibility: false,
      updateHead: true,
      updateBodyClass: false,
      globalInstance: true,
      plugins: [], // Disable all plugins including scroll
      skipPopStateHandling: (event) => {
        // ALWAYS skip Swup handling for back/forward navigation
        // Let the browser handle it naturally
        return true;
      },
      // Simplified link selector for better compatibility
      linkSelector: 'a[href]:not([data-no-swup]):not([href^="mailto:"]):not([href^="tel:"])'
    })
  ],
  markdown: {
      remarkPlugins: [
      remarkObsidianImageSize, // Parse Obsidian image size syntax first
      remarkInternalLinks,
      remarkInlineTags,
      remarkObsidianComments, // Remove Obsidian comments (%%...%%) early in processing
      remarkFolderImages,
      remarkObsidianEmbeds,
      // Bases directive (table-only v1)
      remarkBases,
      remarkImageCaptions,
      remarkMath,
      remarkCallouts,
      remarkBreaks,
      remarkImageGrids,
      remarkMermaid,
      [remarkReadingTime, {}],
      [remarkToc, {
        tight: true,
        ordered: false,
        maxDepth: 3,
        heading: 'contents|table[ -]of[ -]contents?|toc'
      }],
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeMark,
      rehypeImageAttributes,
      [rehypeSlug, {
        test: (node) => node.tagName !== 'h1'
      }],
      [rehypeAutolinkHeadings, {
        behavior: 'wrap',
        test: (node) => node.tagName !== 'h1',
        properties: {
          className: ['anchor-link'],
          ariaLabel: 'Link to this section'
        }
      }],
      rehypeNormalizeAnchors, // Run LAST to ensure className and href fixes aren't overridden
    ],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
    assetsInclude: ['**/*.base', '**/*.home', '**/*.base'],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@/layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
        '@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@/types': fileURLToPath(new URL('./src/types.ts', import.meta.url)),
        '@/config': fileURLToPath(new URL('./src/config.ts', import.meta.url))
      }
    },
    server: {
      host: 'localhost',
      port: 5000,
      strictPort: false, // Allow fallback to 5001 if 5000 is occupied (e.g., AirPlay on macOS)
      allowedHosts: [],
      middlewareMode: false,
      hmr: true,
      watch: {
      ignored: ['**/.obsidian/**', '**/_bases/**', '**/bases/**'],
        usePolling: process.platform === 'win32', // Use polling on Windows for better file watching
        interval: 1000
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
        // CSP headers are handled by src/middleware.ts for all routes
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.ASTRO_CONTENT_COLLECTION_CACHE': 'false'
    },
    optimizeDeps: {
      exclude: ['astro:content']
    },
    exclude: ['**/_redirects']
  },
  build: {
    assets: '_assets'
  }
});
