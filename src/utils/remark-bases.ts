import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

// Minimal fenced directive recognizer for ```base blocks.
// v1: table-only placeholder that will be resolved server-side in a future step.
// For now, we parse a few top-level keys to echo intent and prevent raw code showing.

type BaseBlockConfig = {
  source?: 'posts' | 'pages' | 'projects' | 'docs';
  select?: string[];
  limit?: number;
  view?: 'table';
  files?: boolean;
};

function parseShallowConfig(raw: string): BaseBlockConfig {
  const cfg: BaseBlockConfig = { files: true };
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // select: [title, date, image]
    if (line.startsWith('select:')) {
      const m = line.match(/select:\s*\[(.*)\]/);
      if (m && m[1]) {
        cfg.select = m[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      continue;
    }
    // source: posts
    if (line.startsWith('source:')) {
      const val = line.replace('source:', '').trim();
      if (val === 'posts' || val === 'pages' || val === 'projects' || val === 'docs') {
        cfg.source = val;
      }
      continue;
    }
    // limit: 12
    if (line.startsWith('limit:')) {
      const num = Number(line.replace('limit:', '').trim());
      if (!Number.isNaN(num) && num > 0) cfg.limit = num;
      continue;
    }
    // view: table
    if (line.startsWith('view:')) {
      const val = line.replace('view:', '').trim();
      if (val === 'table') cfg.view = 'table';
      continue;
    }
  }
  return cfg;
}

export const remarkBases: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'code', (node: any, index: number | undefined, parent: any) => {
      if (!parent || typeof index !== 'number') return;
      if (!node || node.lang !== 'base') return;

      const cfg = parseShallowConfig(String(node.value || ''));

      // Replace with an HTML placeholder to be progressively enhanced/resolved later.
      // For v1 we keep server-side only; this avoids showing raw code and prevents errors.
      const html = `
<div class="base-embed base-embed--table" data-base-config='${JSON.stringify(cfg).replace(/'/g, '&apos;')}'>
  <div class="prose w-full overflow-x-auto">
    <div class="rounded-lg border border-primary-200 dark:border-primary-600 p-4 bg-primary-50 dark:bg-primary-800 text-primary-600 dark:text-primary-300">
      <strong>Base directive</strong>: table view
      <div class="mt-2 text-sm opacity-80">Source: ${cfg.source || 'posts'} • Columns: ${(cfg.select || ['title','date']).join(', ')} • Limit: ${cfg.limit || '—'}</div>
    </div>
  </div>
</div>`;

      parent.children[index] = { type: 'html', value: html } as any;
    });
  };
};

export default remarkBases;


