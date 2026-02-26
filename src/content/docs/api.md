---
title: API
description: Complete API reference for the Astro Modular theme
category: Astro Modular
order: 2
version: 0.8.1
lastModified: 2026-02-22
image:
imageAlt:
hideCoverImage: false
hideTOC: false
draft: false
featured: true
aliases:
  - api-reference
---
This document provides a complete reference for the Astro Modular theme APIs, utilities, and configuration options. 

## Content Collections

### Posts Collection
```typescript
interface PostData {
  title: string;
  description: string;
  date: Date;
  tags?: string[];
  draft?: boolean;
  image?: string;
  imageAlt?: string;
  imageOG?: boolean;
  hideCoverImage?: boolean;
  hideTOC?: boolean;
  targetKeyword?: string;
  noIndex?: boolean;
}
```

### Pages Collection
```typescript
interface PageData {
  title: string;
  description: string;
  draft?: boolean;
  lastModified?: Date;
  image?: string;
  imageAlt?: string;
  hideCoverImage?: boolean;
  hideTOC?: boolean;
  noIndex?: boolean;
}
```

### Projects Collection
```typescript
interface ProjectData {
  title: string;
  description: string;
  date: Date;
  categories?: string[];
  repositoryUrl?: string;
  demoUrl?: string;
  status?: string; // Any string value - "completed", "in-progress", "On Hold", etc.
  image?: string;
  imageAlt?: string;
  hideCoverImage?: boolean;
  hideTOC?: boolean;
  draft?: boolean;
  noIndex?: boolean;
  featured?: boolean;
}
```

### Documentation Collection
```typescript
interface DocumentationData {
  title: string;
  description: string;
  category: string;
  order: number;
  lastModified?: Date;
  version?: string;
  image?: string;
  imageAlt?: string;
  hideCoverImage?: boolean;
  hideTOC?: boolean;
  draft?: boolean;
  noIndex?: boolean;
  showTOC?: boolean;
  featured?: boolean;
}
```

### Special Collection
```typescript
interface SpecialData {
  title: string;
  description: string;
  hideTOC?: boolean;
}
```

**Special Pages:**
- `home.md` - Homepage blurb content
- `404.md` - 404 error page content
- `posts.md` - Posts index page (title, description only)
- `projects.md` - Projects index page content
- `docs.md` - Documentation index page content

## Configuration API

### Site Configuration Interface
```typescript
interface SiteConfig {
  // Site Information
  site: string;
  title: string;
  description: string;
  author: string;
  language: string;
  faviconThemeAdaptive: boolean;
  defaultOgImageAlt: string;
  
  // Global Settings
  theme: "minimal" | "oxygen" | "atom" | "ayu" | "catppuccin" | "charcoal" | "dracula" | "everforest" | "flexoki" | "gruvbox" | "macos" | "nord" | "obsidian" | "rose-pine" | "sky" | "solarized" | "things" | "custom";
  customThemeFile?: string;
  availableThemes: "default" | Array<string>;
  fonts: {
    source: "local" | "cdn";
    families: {
      body: string;
      heading: string;
      mono: string;
    };
    display: "swap" | "fallback" | "optional";
  };
  layout: {
    contentWidth: string;
  };
  tableOfContents: {
    enabled: boolean;
    depth: number;
  };
  footer: {
    enabled: boolean;
    content: string;
    showSocialIconsInFooter: boolean;
  };
  hideScrollBar: boolean;
  scrollToTop: boolean;
  featureButton: "mode" | "graph" | "theme" | "none";
  deployment: {
    platform: "netlify" | "vercel" | "github-pages" | "cloudflare-workers";
  };
  
  // Command Palette
  commandPalette: {
    enabled: boolean;
    shortcut: string;
    placeholder: string;
    search: {
      posts: boolean;
      pages: boolean;
      projects: boolean;
      docs: boolean;
    };
    sections: {
      quickActions: boolean;
      pages: boolean;
      social: boolean;
    };
    quickActions: {
      enabled: boolean;
      toggleMode: boolean;
      graphView: boolean;
      changeTheme: boolean;
    };
  };
  
  // Profile Picture
  profilePicture: {
    enabled: boolean;
    image: string;
    alt: string;
    size: "sm" | "md" | "lg";
    url?: string;
    placement: "footer" | "header";
    style: "circle" | "square" | "none";
  };
  
  // Navigation
  navigation: {
    showNavigation: boolean;
    style: "minimal" | "traditional";
    showMobileMenu: boolean;
    pages: NavigationItem[];
    social: Array<{ title: string; url: string; icon: string }>;
  };
  
  // Home Options
  homeOptions: {
    featuredPost: {
      enabled: boolean;
      type: "latest" | "featured";
      slug?: string;
    };
    recentPosts: {
      enabled: boolean;
      count: number;
    };
    projects: {
      enabled: boolean;
      count: number;
    };
    docs: {
      enabled: boolean;
      count: number;
    };
    blurb: {
      placement: "above" | "below" | "none";
    };
  };
  
  // Post Options
  postOptions: {
    postsPerPage: number;
    readingTime: boolean;
    wordCount: boolean;
    tags: boolean;
    linkedMentions: {
      enabled: boolean;
      linkedMentionsCompact: boolean;
    };
    graphView: {
      enabled: boolean;
      showInSidebar: boolean;
      maxNodes: number;
      showOrphanedPosts: boolean;
    };
    postNavigation: boolean;
    showPostCardCoverImages: "all" | "featured" | "home" | "posts" | "featured-and-posts" | "none";
    postCardAspectRatio: AspectRatio;
    customPostCardAspectRatio?: string;
    comments: {
      enabled: boolean;
      provider: string;
      repo: string;
      repoId: string;
      category: string;
      categoryId: string;
      mapping: string;
      strict: string;
      reactions: string;
      metadata: string;
      inputPosition: string;
      theme: string;
      lang: string;
      loading: string;
    };
  };
  
  // Optional Content Types
  optionalContentTypes: {
    projects: boolean;
    docs: boolean;
  };
}
```

### Aspect Ratio Types
```typescript
type AspectRatio = 
  | "16:9" 
  | "4:3"
  | "3:2"
  | "og"
  | "square"
  | "golden"
  | "custom";
```

## Utility Functions

### SEO Generation
```typescript
// Generate SEO data for posts
generatePostSEO(post: Post, url: string): SEOData

// Generate SEO data for projects
generateProjectSEO(project: Project, url: string): SEOData

// Generate SEO data for documentation
generateDocumentationSEO(doc: Docs, url: string): SEOData

// Generate SEO data for pages
generatePageSEO(page: Page, url: string): SEOData
```

### Markdown Processing
```typescript
// Process markdown content and extract data
processMarkdown(content: string): {
  excerpt: string;
  wordCount: number;
  hasMore: boolean;
}

// Calculate reading time
calculateReadingTime(content: string): ReadingTime

// Extract reading time from remark plugin or calculate manually
getReadingTime(remarkData: any, content?: string): ReadingTime | null

// Generate table of contents (async)
generateTOC(headings: Heading[]): Promise<Heading[]>

// Process content data for display (posts, projects, docs, etc.)
processPost(post: any): Promise<any>
```

### Image Optimization
```typescript
// Optimize image path specifically for posts
optimizePostImagePath(imagePath: string, postSlug?: string, postId?: string): string

// Generic image optimization function for all content types
optimizeContentImagePath(imagePath: string, contentType: string, contentSlug?: string, contentId?: string): string

// Strip Obsidian double bracket syntax from image paths
stripObsidianBrackets(imagePath: string): string

// Get fallback OG image
getDefaultOGImage(): OpenGraphImage
```

### Internal Links Processing
The theme uses custom remark plugins to handle internal links and embeds.

```typescript
// Remark wikilinks processing
remarkInternalLinks()

// Obsidian embeds processing
remarkObsidianEmbeds()
```

### Theme Management
```typescript
// Get theme colors for graph view
getGraphThemeColors(): GraphThemeColors

// Update theme CSS variables
updateThemeCSSVariables(theme: string): Promise<void>
```

## Component Props

### PostCard Component
```typescript
interface PostCardProps {
  post: Post | Project | Docs;
  eager?: boolean;
  showCoverImage?: boolean;
  aspectRatio?: string;
}
```

### TableOfContents Component
```typescript
interface TableOfContentsProps {
  headings: Heading[];
  maxDepth?: number;
}
```

### GiscusComments Component
```typescript
interface GiscusCommentsProps {
  enabled: boolean;
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: string;
  strict: string;
  reactions: string;
  metadata: string;
  inputPosition: string;
  theme: string;
  lang: string;
  loading: string;
}
```

## Type Definitions

### Core Types
```typescript
interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface ReadingTime {
  text: string;
  minutes: number;
  time: number;
  words: number;
}

interface SEOData {
  title: string;
  description: string;
  canonical: string;
  ogImage?: OpenGraphImage;
  ogType: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  noIndex?: boolean;
}

interface OpenGraphImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}
```

## Build Process

### Asset Sync
The theme automatically synchronizes assets from content folders to the public directory during build and development.

### Deployment Platforms
- **Netlify**: Full support for redirects and forms
- **Vercel**: Full support for redirects and caching
- **Cloudflare Workers**: Compatible deployment configuration
- **GitHub Pages**: Static site deployment support

## Development Tools

### Scripts
```bash
# Development
pnpm run dev              # Start development server
pnpm run build            # Build for production
pnpm run sync-images      # Sync images from content to public
pnpm run process-aliases  # Process content aliases
pnpm run check-images     # Check for missing images
pnpm run version          # Get theme version
```

This API reference provides comprehensive documentation for all aspects of the Astro Modular theme, from content collections to utility functions and component interfaces.