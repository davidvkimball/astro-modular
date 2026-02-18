import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Image, Link } from 'mdast';
import fs from 'node:fs';
import path from 'node:path';
function parseViewsFromBase(content: string) {
  const lines = content.split(/\r?\n/);
  const views: any[] = [];
  // parse properties display names
  const displayNames: Record<string,string> = {};
  let inViews = false;
  let current: any | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // properties block capture
    if (!inViews) {
      if (/^properties:\s*$/.test(line.trim())) {
        // read until next top-level key
        let j = i + 1;
        let currentKey: string | null = null;
        while (j < lines.length) {
          const l = lines[j];
          if (l.trim() === '') { j++; continue; }
          if (!/^\s+/.test(l)) break; // next top-level section
          const propKeyMatch = l.match(/^\s{2,}([\w\.]+):\s*$/);
          if (propKeyMatch) {
            currentKey = propKeyMatch[1];
            j++;
            continue;
          }
          const dnMatch = l.match(/^\s{4,}displayName:\s*(.+)$/);
          if (dnMatch && currentKey) {
            displayNames[currentKey] = dnMatch[1].trim().replace(/^"|"$/g, '');
          }
          j++;
        }
        i = j - 1;
        continue;
      }
      if (/^views:\s*$/.test(line.trim())) {
        inViews = true;
      }
      continue;
    }
    if (inViews && line.trim() !== '' && !/^\s+/.test(line)) break;
    if (/^\s*-\s*type:\s*/.test(line)) {
      if (current) views.push(current);
      current = { name: '', folder: '', order: [], sort: null as any, limit: undefined as number | undefined };
      continue;
    }
    if (!current) continue;
    const nameMatch = line.match(/^\s*name:\s*(.+)$/);
    if (nameMatch) { current.name = nameMatch[1].trim().replace(/^"|"$/g, ''); continue; }
    const limitMatch = line.match(/^\s*limit:\s*(\d+)/);
    if (limitMatch) { current.limit = Number(limitMatch[1]); continue; }
    const folderMatch = line.match(/file\.folder\.startsWith\(\"([^\"]+)\"\)/);
    if (folderMatch) { current.folder = folderMatch[1]; continue; }
    if (/^\s*order:\s*$/.test(line)) {
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j];
        if (/^\s*-\s+/.test(l)) { current.order.push(l.replace(/^\s*-\s+/, '').trim()); j++; continue; }
        if (/^\s*(sort|name|type|filters|image|cardSize|imageAspectRatio|columnSize):/.test(l) || /^\s*-\s*type:/.test(l) || (l.trim() !== '' && !/^\s+/.test(l))) { break; }
        j++;
      }
      i = j - 1;
      continue;
    }
    if (/^\s*sort:\s*$/.test(line)) {
      const propLine = lines[i + 1] || '';
      const dirLine = lines[i + 2] || '';
      const propMatch = propLine.match(/property:\s*([^\r\n]+)/);
      const dirMatch = dirLine.match(/direction:\s*([^\r\n]+)/);
      if (propMatch && dirMatch) { current.sort = { property: propMatch[1].trim(), direction: dirMatch[1].trim().toUpperCase() === 'DESC' ? 'DESC' : 'ASC' }; }
      continue;
    }
  }
  if (current) views.push(current);
  // return both views and display names map
  (views as any).displayNames = displayNames;
  return views;
}

// Audio file extensions (matches astro-loader-obsidian)
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.3gp', '.flac', '.aac'];

// Video file extensions (matches astro-loader-obsidian)
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogv', '.mov', '.mkv', '.avi'];

// PDF file extensions
const PDF_EXTENSIONS = ['.pdf'];

// SVG file extensions
const SVG_EXTENSIONS = ['.svg'];

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
  /^https?:\/\/youtu\.be\/([^&\n?#]+)/,
  /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/
];


// Twitter/X URL patterns
const TWITTER_PATTERNS = [
  /^https?:\/\/(?:www\.)?twitter\.com\/\w+\/status\/(\d+)/,
  /^https?:\/\/(?:www\.)?x\.com\/\w+\/status\/(\d+)/
];

// Helper function to get file extension
function getFileExtension(url: string): string {
  const pathname = new URL(url, 'http://example.com').pathname;
  const lastDot = pathname.lastIndexOf('.');
  return lastDot !== -1 ? pathname.substring(lastDot).toLowerCase() : '';
}

// Helper function to check if URL is external
function isExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'http://example.com');
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}


// Helper function to extract Twitter/X post ID
function extractTwitterPostId(url: string): string | null {
  for (const pattern of TWITTER_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Helper function to create HTML node
function createHtmlNode(html: string): any {
  return {
    type: 'html',
    value: html
  };
}

export const remarkObsidianEmbeds: Plugin<[], Root> = () => {
  return async (tree, file: any) => {
    // Visit image nodes (covers ![[file]] syntax)
    visit(tree, 'image', (node: Image, index, parent) => {
      if (!node.url || !parent || typeof index !== 'number') return;

      // Clean up URL - remove pipe syntax (alt text) and fragments if present
      let url = node.url;
      const pipeIndex = url.indexOf('|');
      if (pipeIndex !== -1) {
        url = url.slice(0, pipeIndex);
      }
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        url = url.slice(0, hashIndex);
      }

      const alt = node.alt || '';
      const extension = getFileExtension(url);

      // Handle web embeds (YouTube, Twitter/X) FIRST - before attachment processing
      if (isExternalUrl(url)) {
        // Check for Twitter/X
        const twitterPostId = extractTwitterPostId(url);
        if (twitterPostId) {
          const title = alt || 'Twitter post';
          const html = `<blockquote class="twitter-tweet" data-twitter-embed data-theme="preferred_color_scheme" data-conversation="none" title="${title}"><a href="https://twitter.com/user/status/${twitterPostId}"></a></blockquote>`;
          parent.children[index] = createHtmlNode(html);
          return;
        }

        // Check for YouTube
        const youtubeVideoId = extractYouTubeVideoId(url);
        if (youtubeVideoId) {
          const html = `
<div class="youtube-embed aspect-video overflow-hidden rounded-xl my-8">
  <iframe
    src="https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1"
    title="${alt || 'YouTube video player'}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    loading="lazy"
    class="w-full h-full"
  ></iframe>
</div>`;
          parent.children[index] = createHtmlNode(html);
          return;
        }
      }

      // Handle Obsidian Bases files (.base)
      if (extension === '.base' || url.endsWith('.base') || url.includes('.base|')) {
        // Extract optional alias params (e.g., source=posts;select=title,date;limit=10;view=Posts)
        let raw = url;
        const pipeIndex = raw.indexOf('|');
        let params = '';
        if (pipeIndex !== -1) {
          params = raw.slice(pipeIndex + 1);
          raw = raw.slice(0, pipeIndex);
        }

        const cfg: any = { view: 'table' };
        // Parse simple key=value;key2=value2 list
        if (params) {
          params.split(';').forEach((pair) => {
            const [k, v] = pair.split('=').map((s) => s && s.trim());
            if (!k || !v) return;
            if (k.toLowerCase() === 'source') {
              if (['posts', 'pages', 'projects', 'docs'].includes(v)) cfg.source = v;
            } else if (k.toLowerCase() === 'limit') {
              const n = Number(v);
              if (!Number.isNaN(n) && n > 0) cfg.limit = n;
            } else if (k.toLowerCase() === 'select') {
              // select=title,date -> ["title","date"]
              cfg.select = v.split(',').map((s) => s.trim()).filter(Boolean);
            } else if (k.toLowerCase() === 'view') {
              cfg.viewName = v; // name of view inside the .base file
            }
          });
        }

        // Read the .base file and map a single view to config (no try/catch to satisfy older parser)
        const baseName = raw.split('/').pop()?.replace(/\.base$/i, '') || 'home';
        const basePath = path.join(process.cwd(), 'src', 'content', 'bases', `${baseName}.base`);
        if (fs.existsSync(basePath)) {
          const text = fs.readFileSync(basePath, 'utf8');
          // Global filter hint: detect file.ext == "md" to require md
          const requireMd = /file\.ext\s*==\s*\"md\"/.test(text);
          if (requireMd) {
            (cfg as any).requireMd = true;
          }

          // Very small parser for the subset we need:
          // - capture view blocks under "views:" starting with "- type:" lines
          // - read `name:`, and first filter like file.folder.startsWith("X")
          // - read `order:` list for columns
          const parsed = parseViewsFromBase(text);
          const displayNamesMap: Record<string,string> = (parsed as any).displayNames || {};

          // Strict: use first view unless view= was provided; prefer a view literally named "Posts"
          let chosen: any = null;
          const targetName = (cfg.viewName || '').toLowerCase();
          if (targetName) {
            chosen = parsed.find(v => (v.name || '').toLowerCase() === targetName) || parsed[0];
          } else {
            chosen = parsed.find(v => (v.name || '').toLowerCase() === 'posts') || parsed[0];
          }
          if (chosen) {
            // map folder → source
            if (!cfg.source) {
              if (['posts','pages','projects','docs','special'].some(p => (chosen.folder || '').startsWith(p))) {
                cfg.source = (chosen.folder || '').split('/')[0] as any;
              }
            }
            // Force posts if the chosen folder indicates posts
            if ((chosen.folder || '').toLowerCase().startsWith('posts')) {
              cfg.source = 'posts';
            }
            // columns from order
            if (!cfg.select && chosen.order && chosen.order.length) {
              cfg.select = chosen.order.map((o: string) => {
                if (o.toLowerCase() === 'formula.slug') return 'path';
                if (o.toLowerCase() === 'note.pubdate') return 'date';
                if (o.toLowerCase() === 'note.date') return 'date';
                if (o.toLowerCase() === 'note.title' || o.toLowerCase() === 'title') return 'title';
                return o;
              });
            }
            // header labels from properties.displayName mapping
            if (Array.isArray(cfg.select) && cfg.select.length) {
              const labels: string[] = [];
              for (const key of cfg.select) {
                // map back to base property keys where possible
                let srcKey = key;
                if (key === 'path') srcKey = 'formula.Slug';
                if (key === 'date') srcKey = 'note.date';
                if (key === 'title') srcKey = 'note.title';
                labels.push(displayNamesMap[srcKey] || key);
              }
              (cfg as any).headerLabels = labels;
            }
            if (chosen.sort && !cfg.sort) {
              cfg.sort = chosen.sort;
            }
            if (typeof chosen.limit === 'number' && chosen.limit > 0 && !cfg.limit) {
              cfg.limit = chosen.limit;
            }
          }
        }

        // Insert client-side placeholder; client will resolve to rows via APIs
        const html = `
<div class="base-embed base-embed--table" data-base-config='${JSON.stringify(cfg).replace(/'/g, '&apos;')}'>
  <div class="prose w-full overflow-x-auto">
    <div class="rounded-lg border border-primary-200 dark:border-primary-600 p-4 bg-primary-50 dark:bg-primary-800 text-primary-600 dark:text-primary-300">
      <strong>Loading base…</strong>
    </div>
  </div>
</div>`;
        parent.children[index] = createHtmlNode(html);
        return;
      }

        // Detect collection and slug from file path (same logic as remarkFolderImages)
        let resolvedUrl = url;

        // Handle URLs that have already been converted by remarkFolderImages (absolute paths)
        // or relative URLs that need conversion
        if ((url.startsWith('attachments/') || url.includes('/attachments/')) && file.path) {
          // If URL is already absolute (converted by remarkFolderImages), use it as-is
          if (url.startsWith('/')) {
            resolvedUrl = url;
          } else {
            // URL is relative, need to convert it
            const isFolderPost = file.path.includes('/posts/') && file.path.endsWith('/index.md');
            const isFolderPage = file.path.includes('/pages/') && file.path.endsWith('/index.md');
            const isFolderProject = file.path.includes('/projects/') && file.path.endsWith('/index.md');
            const isFolderDoc = file.path.includes('/docs/') && file.path.endsWith('/index.md');

            if (isFolderPost || isFolderPage || isFolderProject || isFolderDoc) {
              // Folder-based content: /collection/slug/attachments/file
              const pathParts = file.path.split('/');
              let collection = 'posts';
              let contentIndex = pathParts.indexOf('posts');

              if (isFolderPage) {
                collection = 'pages';
                contentIndex = pathParts.indexOf('pages');
              } else if (isFolderProject) {
                collection = 'projects';
                contentIndex = pathParts.indexOf('projects');
              } else if (isFolderDoc) {
                collection = 'docs';
                contentIndex = pathParts.indexOf('docs');
              }

              const contentSlug = pathParts[contentIndex + 1];
              resolvedUrl = `/${collection}/${contentSlug}/${url}`;
            } else {
              // File-based content: /collection/attachments/file (shared attachments folder)
              let collection = 'posts';
              if (file.path.includes('/pages/')) collection = 'pages';
              else if (file.path.includes('/projects/')) collection = 'projects';
              else if (file.path.includes('/docs/')) collection = 'docs';

              resolvedUrl = `/${collection}/${url}`;
            }
          }
        }
        // Handle files directly in folder-based content (no attachments/ prefix)
        else if (file.path && !url.startsWith('/') && !url.startsWith('http')) {
          const isFolderPost = file.path.includes('/posts/') && file.path.endsWith('/index.md');
          const isFolderPage = file.path.includes('/pages/') && file.path.endsWith('/index.md');
          const isFolderProject = file.path.includes('/projects/') && file.path.endsWith('/index.md');
          const isFolderDoc = file.path.includes('/docs/') && file.path.endsWith('/index.md');

          if (isFolderPost || isFolderPage || isFolderProject || isFolderDoc) {
            const pathParts = file.path.split('/');
            let collection = 'posts';
            let contentIndex = pathParts.indexOf('posts');

            if (isFolderPage) {
              collection = 'pages';
              contentIndex = pathParts.indexOf('pages');
            } else if (isFolderProject) {
              collection = 'projects';
              contentIndex = pathParts.indexOf('projects');
            } else if (isFolderDoc) {
              collection = 'docs';
              contentIndex = pathParts.indexOf('docs');
            }

            const contentSlug = pathParts[contentIndex + 1];
            resolvedUrl = `/${collection}/${contentSlug}/${url}`;
          }
        }

      // Handle audio files
      if (AUDIO_EXTENSIONS.includes(extension)) {
        const title = alt || url.split('/').pop() || 'Audio file';
        const html = `<div class="audio-embed">
  <audio class="audio-player" controls src="${resolvedUrl}" title="${title}"></audio>
</div>`;
        parent.children[index] = createHtmlNode(html);
        return;
      }

      // Handle video files
      if (VIDEO_EXTENSIONS.includes(extension)) {
        const title = alt || url.split('/').pop() || 'Video file';
        const html = `<div class="video-embed">
  <video class="video-player" controls src="${resolvedUrl}" title="${title}"></video>
</div>`;
        parent.children[index] = createHtmlNode(html);
        return;
      }

      // Handle PDF files
      if (PDF_EXTENSIONS.includes(extension)) {
        // Preserve hash fragment for PDF page linking
        const originalUrl = node.url;
        const hashIndex = originalUrl.indexOf('#');
        const fragment = hashIndex !== -1 ? originalUrl.slice(hashIndex) : '';

        const filename = url.split('/').pop() || 'document.pdf';
        const title = alt || filename; // Use alt text if available, fallback to filename
        const pdfUrl = resolvedUrl + fragment; // Add fragment back to resolved URL
        const html = `<div class="pdf-embed">
  <iframe class="pdf-viewer" src="${pdfUrl}" title="${title}"></iframe>
  <div class="pdf-info">
    <span class="pdf-filename">${filename}</span>
    <a href="${pdfUrl}" download class="pdf-download-link" target="_blank" rel="noopener noreferrer">Download PDF</a>
  </div>
</div>`;
        parent.children[index] = createHtmlNode(html);
        return;
      }

      // Handle SVG files (embedded as responsive images)
      if (SVG_EXTENSIONS.includes(extension)) {
        const html = `<div class="svg-embed">
  <img src="${resolvedUrl}" alt="${alt}" class="svg-image" />
</div>`;
        parent.children[index] = createHtmlNode(html);
        return;
      }
    });

    // Visit code blocks for directive-based Bases (```base ... ```)
    visit(tree, 'code', (node: any, index: number | undefined, parent: any) => {
      if (!parent || typeof index !== 'number') return;
      const lang = (node.lang || '').toLowerCase();
      if (lang !== 'base') return;

      const text: string = node.value || '';
      const cfg: any = { view: 'table' };

      // Detect md-only filter
      if (/file\.ext\s*==\s*"md"/.test(text)) {
        cfg.requireMd = true;
      }

      // Parse base content similar to .base file
      const parsed = parseViewsFromBase(text);
      const displayNamesMap: Record<string,string> = (parsed as any).displayNames || {};

      // Choose view: prefer a view named "Posts", else first
      let chosen: any = null;
      chosen = parsed.find((v: any) => (v.name || '').toLowerCase() === 'posts') || parsed[0];
      if (chosen) {
        // map folder → source
        if (!cfg.source) {
          if (['posts','pages','projects','docs','special'].some(p => (chosen.folder || '').startsWith(p))) {
            cfg.source = (chosen.folder || '').split('/')[0];
          }
        }
        if ((chosen.folder || '').toLowerCase().startsWith('posts')) {
          cfg.source = 'posts';
        }
        // columns from order
        if (!cfg.select && chosen.order && chosen.order.length) {
          cfg.select = chosen.order.map((o: string) => {
            const lower = o.toLowerCase();
            if (lower === 'formula.slug') return 'path';
            if (lower === 'note.pubdate' || lower === 'note.date' || lower === 'date') return 'date';
            if (lower === 'note.title' || lower === 'title') return 'title';
            return o;
          });
        }
        if (chosen.sort && !cfg.sort) {
          cfg.sort = chosen.sort;
        }
        if (typeof chosen.limit === 'number' && chosen.limit > 0 && !cfg.limit) {
          cfg.limit = chosen.limit;
        }
        // header labels from properties.displayName mapping
        if (Array.isArray(cfg.select) && cfg.select.length) {
          const labels: string[] = [];
          for (const key of cfg.select) {
            let srcKey = key;
            if (key === 'path') srcKey = 'formula.Slug';
            if (key === 'date') srcKey = 'note.date';
            if (key === 'title') srcKey = 'note.title';
            labels.push(displayNamesMap[srcKey] || key);
          }
          cfg.headerLabels = labels;
        }
      }

      const html = `
<div class="base-embed base-embed--table" data-base-config='${JSON.stringify(cfg).replace(/'/g, '&apos;')}'>
  <div class="prose w-full overflow-x-auto">
    <div class="rounded-lg border border-primary-200 dark:border-primary-600 p-4 bg-primary-50 dark:bg-primary-800 text-primary-600 dark:text-primary-300">
      <strong>Loading base…</strong>
    </div>
  </div>
</div>`;
      parent.children[index] = createHtmlNode(html);
    });

    // Visit link nodes (covers ![](url) syntax for web embeds)
    visit(tree, 'link', (node: Link, index, parent) => {
      if (!node.url || !parent || typeof index !== 'number') return;

      const url = node.url;
      const title = node.title || '';


      // Handle YouTube embeds
      const youtubeVideoId = extractYouTubeVideoId(url);
      if (youtubeVideoId) {
        const html = `
<div class="youtube-embed aspect-video overflow-hidden rounded-xl my-8">
  <iframe
    src="https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1"
    title="${title || 'YouTube video player'}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    loading="lazy"
    class="w-full h-full"
  ></iframe>
</div>`;
        parent.children[index] = createHtmlNode(html);
        return;
      }


    });
  };
};
