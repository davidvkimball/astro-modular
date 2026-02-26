type BaseConfig = {
  source?: 'posts' | 'pages' | 'projects' | 'docs';
  select?: string[];
  limit?: number;
  view?: 'table';
  viewName?: string; // optional name from .base
  sort?: { property: string; direction: 'ASC' | 'DESC' };
  files?: boolean; // directive V1: enumerate files
  headerLabels?: string[]; // from .base properties displayName
};

function getApiUrlForSource(source: string): string | null {
  switch (source) {
    case 'posts':
      return '/api/posts.json';
    case 'pages':
      return '/api/pages.json';
    case 'projects':
      return '/api/projects.json';
    case 'docs':
      return '/api/docs.json';
    default:
      return null;
  }
}

function buildTableHTML(columns: string[], rows: Record<string, any>[], headerLabels?: string[]): string {
  const headers = (headerLabels && headerLabels.length === columns.length) ? headerLabels : columns;
  const thead = `<thead><tr class="border-b border-primary-200 dark:border-primary-600">${columns
    .map((_, idx) => `<th class=\"py-2 pr-4 text-primary-600 dark:text-primary-300 whitespace-nowrap\">${headers[idx]}</th>`)
    .join('')}</tr></thead>`;

  const tbody = `<tbody>${rows
    .map((row) => {
      const tds = columns
        .map((c) => `<td class=\"py-2 pr-4 text-primary-900 dark:text-primary-100 whitespace-nowrap\">${row[c] ?? ''}</td>`)
        .join('');
      return `<tr class=\"border-b border-primary-200/60 dark:border-primary-600/60 last:border-0\">${tds}</tr>`;
    })
    .join('')}</tbody>`;

  // Return styled wrapper so tables always keep rounded/bordered look
  return `<div class=\"table-wrapper\"><div class=\"overflow-x-auto\"><table class=\"w-full text-left border-collapse\">${thead}${tbody}</table></div></div>`;
}

async function renderBaseEmbeds() {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('.base-embed[data-base-config]'));
  if (!elements.length) return;

  await Promise.all(
    elements.map(async (el, idx) => {
      // Prevent duplicate concurrent renders on Swup hooks
      if (el.getAttribute('data-base-processing') === 'true') return;
      el.setAttribute('data-base-processing', 'true');
      try {
        const raw = el.getAttribute('data-base-config') || '{}';
        // Decode common HTML entities that may appear after Swup-cached HTML rehydration
        const decoded = raw
          .replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&');
        const cfg: BaseConfig = JSON.parse(decoded);
        const source = cfg.source; // optional

        // Fetch from one or multiple sources
        async function fetchSource(s: string) {
          const api = getApiUrlForSource(s);
          if (!api) return [] as any[];
          const res = await fetch(api, { cache: 'no-store' });
          if (!res.ok) return [] as any[];
          return (await res.json()) as any[];
        }

        let items: any[] = [];
        if (!source && cfg.files) {
          // V1: enumerate files (all types) for file name list parity with Bases
          const res = await fetch('/api/files.json', { cache: 'no-store' });
          if (!res.ok) { throw new Error(`Failed to fetch files.json: ${res.status} ${res.statusText}`); }
          const names: string[] = await res.json();
          // Sort alphabetically and limit to 36 to match Obsidian default
          const sorted = names.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).slice(0, 36);
          // Render as single column "file name"
          const columns = ['file name'];
          const rows = sorted.map((name) => ({ 'file name': name }));
          el.innerHTML = buildTableHTML(columns, rows);
          return;
        } else if (!source) {
          // Fallback aggregation when explicitly not in files mode
          const [a, b, c, d] = await Promise.all([
            fetchSource('posts'),
            fetchSource('pages'),
            fetchSource('projects'),
            fetchSource('docs'),
          ]);
          items = [...a, ...b, ...c, ...d];
        } else {
          items = await fetchSource(source);
        }

        // Apply sort (from .base view) if provided
        if (cfg.sort && cfg.sort.property) {
          const prop = cfg.sort.property;
          const dir = cfg.sort.direction === 'DESC' ? -1 : 1;
          items.sort((a: any, b: any) => {
            const av = a[prop];
            const bv = b[prop];
            if (prop.toLowerCase() === 'date' || /date/i.test(prop)) {
              const ad = new Date(av).getTime() || 0;
              const bd = new Date(bv).getTime() || 0;
              return (ad - bd) * dir;
            }
            if (typeof av === 'string' && typeof bv === 'string') {
              return av.localeCompare(bv) * dir;
            }
            return ((av ?? 0) > (bv ?? 0) ? 1 : (av ?? 0) < (bv ?? 0) ? -1 : 0) * dir;
          });
        }

        // Default columns: show file name only unless select is provided (V1)
        // In V2 (when cfg.select is provided from .base), use that exact order
        const defaultColumns = ['file name'];
        const columns = (cfg.select && cfg.select.length ? cfg.select : defaultColumns).filter(Boolean);
        const limit = cfg.limit && cfg.limit > 0 ? cfg.limit : undefined;

        const sliced = (Array.isArray(items) ? items : []).slice(0, limit);
        const rows = sliced.map((item: any) => {
          const row: Record<string, any> = {};
          columns.forEach((c) => {
            if (c.toLowerCase() === 'file name') {
              // Prefer id last segment; fallback to URL basename
              let name = '';
              if (typeof item.id === 'string') {
                const parts = item.id.split('/');
                name = parts[parts.length - 1];
              } else if (typeof item.url === 'string') {
                const u = new URL(item.url, window.location.origin);
                const p = u.pathname.split('/');
                name = (p[p.length - 1] || '').replace(/\/$/, '');
              }
              row[c] = name;
            } else if (c.toLowerCase() === 'path') {
              // Use URL path if available
              if (typeof item.url === 'string') {
                const u = new URL(item.url, window.location.origin);
                row[c] = u.pathname;
              } else {
                row[c] = '';
              }
            } else if (c.toLowerCase() === 'date' && item.date) {
              // Normalize date string
              const d = new Date(item.date);
              if (isNaN(d.getTime())) {
                row[c] = '';
              } else {
                // If the date is at midnight UTC, handle it like formatDate utility
                if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
                  const localDate = new Date(
                    d.getUTCFullYear(),
                    d.getUTCMonth(),
                    d.getUTCDate()
                  );
                  row[c] = localDate.toLocaleDateString();
                } else {
                  row[c] = d.toLocaleDateString();
                }
              }
            } else {
              // Print raw value if present, no injected transforms
              row[c] = item[c];
            }
          });
          return row;
        });

        el.innerHTML = buildTableHTML(columns, rows, (cfg as any).headerLabels);
      } catch (err) {
        // Replace loading state with a minimal, styled error to avoid perpetual hanging UI
        el.innerHTML = `<div class="table-wrapper"><div class="overflow-x-auto"><div class="py-3 px-4 text-sm text-primary-600 dark:text-primary-300">Failed to load base.</div></div></div>`;
      } finally {
        el.removeAttribute('data-base-processing');
      }
    })
  );
}

function initializeBaseEmbeds() {
  // Simply (re)render; function is idempotent and replaces innerHTML
  renderBaseEmbeds();
}

// Expose globally and init on DOM ready
(window as any).initializeBaseEmbeds = initializeBaseEmbeds;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBaseEmbeds);
} else {
  initializeBaseEmbeds();
}


export {};
