# AGENTS.md — Astro Modular (Astro + Obsidian blog theme)

Source of truth for AI agents (Claude Code, Cursor, etc.) working in this repo.
**Read this entire file before making changes.** It captures the things that are
non-obvious about how Astro Modular is structured.

If the answer to "how does X work?" isn't here and it took you more than one round of
investigation, **add it here** when you figure it out.

---

## What Astro Modular is

Astro Modular is an Astro blog theme designed for Obsidian users, by
[David V. Kimball](https://davidvkimball.com). The `src/content/` folder is a real
Obsidian vault — users write in Obsidian, commit, and publish.

**Stack:**
- Astro 5.x (fully prepared for v6). Netlify / Vercel / GitHub Pages / Cloudflare Workers friendly.
- **Obsidian vault as CMS.** `src/content/.obsidian/` is committed, with a curated plugin set.
- **Swup** for client-side page transitions (NOT Astro's ClientRouter).
- Tailwind + custom theme variables (17+ built-in color themes, switchable at runtime).
- Vanilla JS only — no React, no jQuery.
- Modular by design — almost every feature toggles via `siteConfig` in `src/config.ts`.

**Core philosophy:** Content lives in Obsidian. Standard markdown links, wikilinks,
Obsidian embeds, callouts, and tags should work *identically* in Obsidian and on the
live site. Don't take shortcuts that break Obsidian-native behavior.

---

## Cardinal rules

1. **NEVER edit files in `src/content/`** without explicit user permission. Posts,
   pages, projects, docs, frontmatter — all belong to the user. Only edit config,
   components, layouts, utilities, scripts, and plugins.
2. **Use `pnpm`, not `npm`.** Scripts: `pnpm run <script>`.
3. **Use `entry.id`, NEVER `entry.slug`.** `slug` is removed in Astro v6 and returns
   `undefined`. Folder-based entries have IDs like `'folder-name'`, NOT `'folder-name/index'`.
4. **Never disable the Astro dev toolbar** (`devToolbar.enabled: true` in
   `astro.config.mjs`). The pnpm module-loading errors in the console are cosmetic.
5. **Never disable `vite.server.fs.strict`.** Security boundary.
6. **Never use `console.log()` in production code.** Use `src/utils/logger.ts`.
7. **Never hardcode colors.** Use Tailwind classes that reference theme variables
   (`primary-*`, `highlight-*`) with `dark:` variants. The theme system has 17+ color
   themes — hardcoded colors break all of them.
8. **Never remove or rename `// [CONFIG:KEY]` comment markers** in `src/config.ts`.
   The Astro Modular Settings Obsidian plugin uses them to edit config from inside
   the vault.
9. **Never use destructive commands** (`rm -rf`, `git reset --hard`, force push)
   without explicit approval. Investigate root causes.
10. **Match existing patterns.** This codebase already solves most problems consistently.
    Search before inventing.

---

## Repo layout

```
src/
  content/
    posts/{slug}.md OR posts/{slug}/index.md      # Both forms supported
    pages/{slug}.md OR pages/{slug}/index.md      # e.g. about, contact
    projects/{slug}.md OR projects/{slug}/index.md
    docs/{slug}.md OR docs/{slug}/index.md
    special/{name}.md                             # home, 404, posts, projects, docs — fixed-URL pages
    bases/                                        # Obsidian Bases (.base) files
    .obsidian/                                    # Real vault: config + plugins, committed
  content.config.ts                               # Astro v6 location — DO NOT move back to src/content/config.ts
  config.ts                                       # siteConfig — single source of truth for theme behavior
  themes/                                         # 17+ color theme definitions
  layouts/
    BaseLayout.astro                              # Swup container, theme init, global JS re-init hooks
    PostLayout.astro                              # Hardcodes H1 from frontmatter
    PageLayout.astro                              # Hardcodes H1 from frontmatter
    ProjectLayout.astro
    DocumentationLayout.astro
  pages/
    index.astro                                   # Homepage
    posts/, projects/, docs/                      # Listings + detail routes
    [...slug].astro                               # Catch-all for pages + special
    api/                                          # JSON endpoints for command palette
    rss.xml.ts, feed.xml.ts, sitemap.xml.ts, llms.txt.ts, robots.txt.ts
  utils/
    internallinks.ts                              # Link rewriter (wikilinks + standard links + URL mapping)
    logger.ts                                     # Use instead of console.log
  components/                                     # PostCard, ImageWrapper, CommandPalette, GraphModal, LocalGraph, etc.
scripts/
  sync-images.js                                  # Copies co-located assets to public/
  process-aliases.js                              # Converts frontmatter aliases → redirects
  generate-deployment-config.js                   # Writes netlify.toml / vercel.json / wrangler.toml / _redirects
  generate-graph-data.js                          # Builds /graph/graph-data.json
  check-missing-images.js                         # `pnpm run check-images`
```

---

## `siteConfig` — the configurability layer

`src/config.ts` is the **single source of truth** for theme behavior. Key sections:

- `site`, `title`, `description`, `author`, `language`
- `theme` + `availableThemes` + `customThemeFile`
- `fonts` — `{ source: "local" | "cdn", families: { body, heading, mono }, display }`
- `layout.contentWidth`
- `tableOfContents.{enabled, depth}`
- `footer`, `scrollToTop`, `hideScrollBar`, `featureButton`
- `deployment.platform` — `"netlify" | "vercel" | "github-pages" | "cloudflare-workers"`
- `commandPalette` — shortcut, placeholder, search scope, sections, quick actions
- `profilePicture`
- `navigation` — header + mobile menu + social icons
- **`optionalContentTypes`** — `{ projects: bool, docs: bool }` toggles whole content types
- `homeOptions` — `{ featuredPost, recentPosts, projects, docs, blurb }` controls the homepage
- `postOptions` — `{ postsPerPage, showPostCardCoverImages, postCardAspectRatio, linkedMentions, graphView, comments }`
- `features` — reading time, word count, tags, commandPalette, post navigation, etc.
- `seo.defaultOgImageAlt`
- `comments` — Giscus config (`repo`, `repoId`, `categoryId`, etc.)

### Config markers

Lines like `// [CONFIG:THEME]` directly above a value are read by the
**Astro Modular Settings Obsidian plugin** (`src/content/.obsidian/plugins/astro-modular-settings/`),
letting users edit config from inside Obsidian. **Do not remove, rename, or move these
markers.** When adding a new configurable value that should be editable from Obsidian,
add a `// [CONFIG:NEW_KEY]` marker on the line above it (uppercase, underscores).

---

## Internal links — the most important section

Astro Modular supports **two linking styles** in markdown, both handled by remark
plugins in `src/utils/internallinks.ts`:

### Wikilinks — posts only

```markdown
[[Post Title]]
[[Post Title|Custom Display Text]]
![[image.jpg]]
![[audio.mp3]]
```

- Scope: **posts only.** Wikilinks to pages / projects / docs do not resolve.
- Implemented by `remarkWikilinks()`.

### Standard markdown links — all content types

```markdown
[Post](posts/some-slug)
[Page](pages/about)        →  rewritten to /about
[Project](projects/my-thing)
[Doc](docs/getting-started)
[Home](special/home)       →  rewritten to /
[404 Page](special/404)    →  rewritten to /404
[Section](#heading-slug)
```

- Scope: **all content types.**
- Implemented by `remarkStandardLinks()`. Combined with wikilink handling by
  `remarkInternalLinks()`.

### URL mapping (rendering only)

Obsidian-native paths get rewritten to web URLs during markdown compilation:

| Markdown link | Rewritten to |
|---|---|
| `/pages/about` or `pages/about` | `/about` |
| `/special/home` or `special/home` | `/` |
| `/special/404` | `/404` |
| `/special/posts` | `/posts` |
| `/pages/about#section` | `/about#section` |

The mapping logic is `mapRelativeUrlToSiteUrl()` in `internallinks.ts`. Trailing slashes,
leading slashes, and anchors are all normalized. Don't manually rewrite Obsidian-style
paths to site paths — let the rewriter do it.

### URL mapping is for RENDERING ONLY

**Linked Mentions** and the **graph view** remain posts-only — they filter via
`isPostLink` regardless of URL mapping. URL mapping does not expand the scope of
those features.

### Best practice

Prefer **standard markdown links** (`[text](url)`) for cross-content-type links.
Use wikilinks only when exclusively linking between posts and you want the
Obsidian-native feel.

---

## Aliases & redirects (renaming content)

Astro Modular supports the **`file-name-history`** Obsidian plugin (bundled). When you
rename a file in Obsidian, the old filename is stored as an `aliases:` entry in the
frontmatter. The `scripts/process-aliases.js` build step reads these and generates
redirect rules for the deployment platform.

```yaml
---
title: Vault CMS Guide
aliases:
  - obsidian-vault-guide
---
```

**Users almost never do anything manually — just rename in Obsidian and it works.**

If a link points to a slug that doesn't exist, check whether the target file has the
old slug in its `aliases:` array before assuming the link is broken. **Don't
fuzzy-match** and rewrite links to renamed content.

---

## Swup — the big footgun

All page navigation goes through **Swup**, not Astro's `<ClientRouter />`. Swup swaps
DOM content inside `#swup-container` without firing `DOMContentLoaded`, so any
JavaScript that attaches event listeners or initializes components **must re-run after
every navigation**.

### The pattern

Every component that touches the DOM should:

1. Expose an `initializeX()` function on `window`.
2. Run it on `DOMContentLoaded`.
3. Be re-run from `BaseLayout.astro` in both `swup.hooks.on('page:view', ...)` and
   `swup.hooks.on('visit:end', ...)`.
4. Clean up existing listeners before re-attaching (clone-and-replace pattern, or
   `dataset.bound = 'true'` guards).

```js
// In component
function initializeMyComponent() {
  const el = document.querySelector('.my-component');
  if (!el) return;
  // tear down any previous state, then attach fresh listeners
}
window.initializeMyComponent = initializeMyComponent;
document.addEventListener('DOMContentLoaded', initializeMyComponent);

// In BaseLayout.astro — hook into BOTH events
window.swup.hooks.on('page:view', () => window.initializeMyComponent?.());
window.swup.hooks.on('visit:end', () => window.initializeMyComponent?.());
```

Components that need this: Table of Contents, Command Palette, theme toggle,
mobile menu, Mermaid diagrams, linked mentions, graph components.

### Scroll behavior — do NOT call `handleInitialHashScroll()` from `visit:end`

It forces `window.scrollTo(0, 0)` and fights the browser's native back/forward
scroll restoration. Swup is configured with `smoothScrolling: false`,
`plugins: []`, and `skipPopStateHandling: () => true` — let the browser handle
scroll restoration.

### Accessibility

`accessibility: false` is intentionally set in the Swup config to prevent it from
adding `tabindex` attributes to the body. Do not re-enable it.

### Don't add inline `<script>` tags

A plain `<script>` in a layout or component runs once on first load and never again.
Always go through the `initializeX()` + `window` + Swup hooks pattern.

---

## Folder-based vs single-file content

**Every content type** supports both forms:

```
posts/traditional-post.md              →  /posts/traditional-post/
posts/folder-based-post/index.md       →  /posts/folder-based-post/
posts/folder-based-post/cover.jpg      →  co-located asset
posts/folder-based-post/attachments/   →  Obsidian "subfolder" setting — stripped in output URLs
```

Same for `pages/`, `projects/`, `docs/`.

### Folder-based ID detection (Astro v6)

**In Astro v6, folder-based entries have IDs like `'folder-name'`, not `'folder-name/index'`.**
The old heuristic `post.id.includes('/') && post.id.endsWith('/index')` will never
match. Detect folder-based posts by:
- Checking if `image` frontmatter points to a co-located file (not `attachments/`)
- Using a known list
- Checking the filesystem server-side

### Asset sync

`scripts/sync-images.js` copies co-located assets from `src/content/{type}/{slug}/`
to `public/{type}/{slug}/` before every dev and build. Supported:
images (jpg/png/webp/svg/…), audio (mp3/wav/…), video (mp4/webm/…), PDF.

Images in `attachments/` subfolders are flattened — `attachments/image.png` is copied
as `image.png` in the output. This prevents breakage when users toggle Obsidian's
attachment-subfolder setting.

---

## Special collection

`src/content/special/` contains fixed-URL pages handled by `[...slug].astro`:

| File | URL | Purpose |
|---|---|---|
| `special/home.md` | `/` | Homepage blurb content |
| `special/404.md` | `/404` | 404 page content |
| `special/posts.md` | `/posts` | Posts listing meta (title, description) |
| `special/projects.md` | `/projects` | Projects listing content |
| `special/docs.md` | `/docs` | Docs listing content |

Schema is simplified: `title`, `description`, `hideTOC`. URLs are determined by
filename, not frontmatter. These files are excluded from the `pages` collection.

All loading uses try/catch with fallbacks so missing files don't break the build.

---

## Image system — two completely separate pipelines

Do not confuse these:

### 1. Post card images (listings, homepage, tag pages)

- Controlled by `postOptions.showPostCardCoverImages` in `config.ts`
- Options: `"all" | "featured" | "home" | "posts" | "featured-and-posts" | "none"`
- Source: `image` frontmatter field
- **Not affected by `hideCoverImage` frontmatter**
- First card on each listing should use `eager={true}` (LCP)

### 2. Post / page / project / doc content images (inside the detail page)

- Controlled by `hideCoverImage` frontmatter field
- Always `loading="eager"` + `fetchpriority="high"` when rendered
- Rendered by `PostContent.astro` / layout components

Project and doc cards always show their cover when available (independent of
`showPostCardCoverImages`), controlled by their own `hideCoverImage` frontmatter.

### Post card aspect ratio

`postOptions.postCardAspectRatio`: `"og" | "16:9" | "4:3" | "3:2" | "square" | "golden" | "custom"`.
Only affects cards, never individual post cover images.

### Image references in markdown

```markdown
![Alt](image.jpg)              # relative — preferred
![Alt]([[image.jpg]])          # Obsidian bracket syntax — also supported
```

Image resolution:
- Relative (`image.jpg`) → `/posts/{slug}/image.jpg`
- Absolute (`/attachments/foo.jpg`) → as-is
- External URL → as-is
- Cover images auto-convert to `.webp` via the URL resolver (except SVG / existing WebP)

### Missing images

Dev mode shows placeholders and logs a warning — production builds fail. Run
`pnpm run check-images` before deploying.

---

## Remark / rehype plugin order — critical

In `astro.config.mjs`:

```
remarkPlugins: [
  remarkInternalLinks,    // 1. wikilinks + standard links + URL mapping
  remarkBreaks,           // 2.
  remarkFolderImages,     // 3. ⚠️ rewrites image URLs, adds .webp — MUST skip non-image files
  remarkObsidianEmbeds,   // 4. audio / video / PDF / YouTube / Twitter
  remarkBases,            // 5.
  remarkImageCaptions,    // 6.
  remarkMath,             // 7.
  remarkCallouts,         // 8.
  remarkImageGrids,       // 9.
  remarkMermaid,          // 10.
  remarkReadingTime,      // 11.
  remarkToc,              // 12.
]

rehypePlugins: [
  rehypeKatex,            // 1. render math — MUST run first
  rehypeMark,
  rehypeSlug,
  rehypeAutolinkHeadings,
]
```

### The embed footgun

`remarkFolderImages` runs **before** `remarkObsidianEmbeds`. It processes every
image node in the AST (Obsidian embeds use image-node syntax), and naively adding
WebP conversion breaks audio/video/PDF embeds because their extensions get rewritten.

**`remarkFolderImages` MUST skip non-image extensions** (`.mp3`, `.wav`, `.ogg`,
`.m4a`, `.flac`, `.aac`, `.mp4`, `.webm`, `.mov`, `.mkv`, `.avi`, `.pdf`) so
`remarkObsidianEmbeds` can handle them.

Before modifying any remark plugin: trace the AST flow through the whole chain, and
test audio/video/PDF/YouTube/Twitter embeds after every change.

### Math — the KaTeX duplication bug

KaTeX renders both MathML (for accessibility) and HTML (visible fallback). If both
are visible, math appears twice (`E=mc²E=mc²`). The correct CSS is:

```css
.katex-mathml { display: inline-block !important; }
.katex-html   { display: none !important; }
```

**Never invert this.** MathML is the correct, accessible output.

---

## Obsidian embeds

Handled by `remarkObsidianEmbeds` in `src/utils/remark-obsidian-embeds.ts`:

| Type | Syntax | Output |
|---|---|---|
| Audio | `![[audio.mp3]]` | HTML5 `<audio>` with controls |
| Video | `![[video.mp4]]` | HTML5 `<video>` with 16:9 aspect ratio |
| YouTube | `![](https://youtube.com/watch?v=ID)` | Responsive iframe |
| PDF | `![[doc.pdf]]` or `![[doc.pdf#page=3]]` | iframe viewer + download link (preserves `#page=N`) |
| Twitter/X | `![](https://twitter.com/u/status/ID)` | Twitter widget embed |

External URLs (YouTube, Twitter) are processed **before** attachment URLs to avoid
conflicts. Pipe syntax (`|alt`) and fragments are stripped before processing, except
for PDFs where `#page=N` is preserved.

### Platform headers for PDF + Twitter

PDF iframes need `X-Frame-Options: SAMEORIGIN`. Twitter widgets need the right
Content-Security-Policy. `scripts/generate-deployment-config.js` writes the correct
headers into `netlify.toml` / `vercel.json` / `public/_headers` based on
`deployment.platform`.

---

## Graph view

Two components, both built on D3 force simulation:

- **`GraphModal.astro`** — full-screen global graph, opened from command palette.
  Keyboard: `Esc` close, `R` reset zoom, `C` center. Reads `/graph/graph-data.json`
  (generated at build time by `scripts/generate-graph-data.js`).
- **`LocalGraph.astro`** — 280×280 sidebar graph showing only directly-connected
  posts. Filters the same data source. Has a "fullscreen" button that opens the
  modal.

Colors come from `src/utils/graph-theme-colors.ts`, which reads CSS custom properties
and converts RGB to hex. Both components listen for `themechange` events and
re-render on theme switch. Use `getGraphThemeColors()` — never hardcode graph colors.

Graph nodes are **posts only**, filtered by `isPostLink`. Don't add other content
types without thinking carefully about scope.

---

## Themes (color themes)

17+ built-in themes in `src/themes/` plus user-customizable. Theme switching is
handled in `BaseLayout.astro`:

- Default theme: `siteConfig.theme`
- Available themes: `siteConfig.availableThemes` (`"default"` = all, or an array)
- Persistence: `localStorage.selectedTheme`
- Switching fires a custom `themechange` event that graphs and other components
  listen for
- CSS variables are stored as space-separated RGB: `"255 255 255"`
- Tailwind classes reference them via `primary-*` and `highlight-*` scales

When adding a new theme:
1. Add the definition to `src/themes/`
2. Register it in `src/themes/index.ts`
3. Add it to the `ThemeName` type in `config.ts`
4. Test in the command palette theme switcher

### Custom themes

Users can set `theme: "custom"` and `customThemeFile: "my-theme"` to load
`src/themes/custom/my-theme.ts`. The theme switcher only lists `custom` when the
config has `theme: "custom"`.

---

## Command palette

`src/components/CommandPalette.astro`. Default shortcut `Ctrl+K` (configurable via
`siteConfig.commandPalette.shortcut`). Sections:

- **Quick actions** — toggle dark mode, open graph, change theme
- **Pages / Posts / Projects / Docs** — fuzzy search (scope controlled by
  `commandPalette.search.*`)
- **Social links**

API endpoints in `src/pages/api/` feed the search. They must use `entry.id`, never
`entry.slug`. Theme switching goes through `window.changeTheme()` defined in
`BaseLayout.astro`.

---

## Comments (Giscus)

`features.comments: true` enables Giscus comments via GitHub Discussions. Config
lives under `siteConfig.comments`. Setup: enable Discussions on the repo → create a
category → get repo ID + category ID from [giscus.app](https://giscus.app) → fill in
`comments.repo`, `comments.repoId`, `comments.categoryId`.

Comments use `mapping: "pathname"` + `strict: "0"`, which auto-creates a
discussion on first comment. No manual setup per post needed.

---

## Deployment

Set `siteConfig.deployment.platform` once and `pnpm run build` writes the right
config files:

| Platform | Generates |
|---|---|
| `"netlify"` | `netlify.toml` |
| `"vercel"` | `vercel.json` (merges with existing — preserves custom settings) |
| `"github-pages"` | `public/_redirects`, `public/_headers` (gitignored) |
| `"cloudflare-workers"` | `wrangler.toml` (Workers-format, using `assets.directory`), `_redirects`, `_headers` |

Switching platforms cleans up the files for the old platform but **never touches**
`netlify.toml` / `vercel.json` / `wrangler.toml` (may contain custom bindings).
`_redirects` and `_headers` in `public/` are considered build artifacts and get
cleaned / regenerated.

No environment variables needed. The legacy `DEPLOYMENT_PLATFORM=...` env var still
works but isn't recommended.

---

## H1 titles

**Both posts and pages hardcode the H1 from frontmatter `title`** in their layouts.
Content markdown should **never start with `# Title`** — start with `##`. Same goes
for projects and docs.

---

## Table of contents

- **Posts** respect the global `tableOfContents.enabled` in config. Individual posts
  can opt out with `hideTOC: true` in frontmatter. They can't opt in when global is
  off.
- **Pages, projects, docs** have independent per-file TOC — default shown, hidden
  via `hideTOC: true`. Not affected by the global setting.

---

## Common scripts

| Command | What it does |
|---|---|
| `pnpm run dev` | Sync images + aliases + deploy config + graph data + `astro dev` (port 5000) |
| `pnpm run build` | Same pre-steps, production, + `astro build` |
| `pnpm run check-images` | Report missing image references |
| `pnpm run sync-images` | Manual asset sync |
| `pnpm run process-aliases` | Manual alias → redirect processing |
| `pnpm run generate-graph-data` | Rebuild `/graph/graph-data.json` |
| `pnpm run version` | Print current theme version |

---

## Bundled Obsidian plugins

Located in `src/content/.obsidian/plugins/`. The important ones for AI agents:

| Plugin | Role |
|---|---|
| `vault-cms` | The CMS / publishing pipeline itself |
| `astro-modular-settings` | Edits `siteConfig` from Obsidian, reads `[CONFIG:KEY]` markers |
| `astro-composer` | Creates new posts/pages with correct frontmatter, kebab-case rename |
| `file-name-history` | Auto-populates `aliases:` frontmatter when renaming files |
| `nested-properties` | Nested YAML frontmatter support |
| `property-over-file-name` | Use `title` frontmatter as primary identifier |
| `bases-cms`, `home-base` | Obsidian Bases integration + homepage |
| `image-manager` | Image insertion + optimization |
| `tag-wrangler` | Renames tags across the vault |
| `obsidian-git` | Commit + push from inside Obsidian |
| `seo`, `omnisearch` | SEO checks, better search |

If you change anything that touches frontmatter conventions, image paths, link
rewriting, or `[CONFIG:KEY]` markers, **double-check the corresponding plugin still
works**.

---

## Frontmatter reference

### Posts

```yaml
---
title: "My Post"
description: "One-sentence summary"
date: 2025-01-15
tags: [productivity]
image: "cover.jpg"          # optional, cover image
imageAlt: ""
imageOG: false              # use cover as OG image instead of generating
hideCoverImage: false
hideTOC: false
targetKeyword: ""           # Search Engine Optimization plugin
draft: false
aliases:                    # populated by file-name-history
  - old-slug
---
```

### Pages

```yaml
---
title: "About"
description: ""
hideCoverImage: false
hideTOC: false
noIndex: false
draft: false
---
```

### Projects

```yaml
---
title: "Cool Thing"
description: ""
date: 2025-01-15
categories: ["Web Development"]
repositoryUrl: "https://github.com/..."
demoUrl: "https://..."
status: "completed"         # any string — "completed", "in-progress", "On Hold", etc.
image: "cover.jpg"
imageAlt: ""
hideCoverImage: false
hideTOC: false
draft: false
featured: true              # show on homepage if homeOptions.projects.enabled
---
```

### Docs

```yaml
---
title: "Getting Started"
description: ""
category: "Setup"           # optional — missing categories fall into "Unsorted"
order: 1                    # sort order within category
lastModified: 2025-01-15
version: "1.0.0"
image: "hero.jpg"
hideCoverImage: false
hideTOC: false
draft: false
featured: true
---
```

---

## When in doubt

- **Read the existing pattern first.** Search the codebase before inventing.
- **Consult this file before guessing.** If something isn't documented here, that's
  a bug in this file — fix it after you figure it out.
- **Ask before doing anything destructive or large-scale.**
- **Test after Swup navigation.** Initial load is not enough. Navigate to a page,
  then to another, then back — confirm the feature still works.
- **Don't break the Obsidian-native experience.** Wikilinks, standard links,
  embeds, callouts, and tags must look and behave the same in Obsidian and on the
  live site.
- **Prefer configurability over hardcoding.** Astro Modular is a template — users
  customize everything.
