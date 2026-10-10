#!/usr/bin/env node

/**
 * Script to check for missing images and other media in content
 * Run with: node scripts/check-missing-images.js
 *
 * References resolve the way the site resolves them: body images and embeds
 * follow resolveContentFileUrl (src/utils/internallinks.ts), and the `image`
 * frontmatter field follows resolveCoverImage (src/utils/images.ts). The
 * resulting URL is traced back to the vault file that scripts/sync-images.js
 * publishes there, so the result doesn't depend on a previous sync, the OS, or
 * line endings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const contentRoot = path.join(projectRoot, 'src', 'content');

// Collections the site builds (src/content.config.ts). Other vault folders,
// such as .trash and bases, are never published.
const COLLECTIONS = ['posts', 'pages', 'projects', 'docs', 'special'];

// Same delimiters Astro accepts (@astrojs/internal-helpers/frontmatter)
const FRONTMATTER = /^(?:\s*\n)?---([\s\S]*?\n)---/;

// ![alt](destination "title"), following CommonMark's rules for destinations
const MARKDOWN_IMAGE = /(?<!\\)!\[(?:\\.|[^\\[\]]|\[(?:\\.|[^\\[\]])*\])*\]\(\s*(<[^<>\n]*>|(?:\\.|[^\s()\\]|\((?:\\.|[^\s()\\])*\))*)(?:\s+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^()\\])*\)))?\s*\)/g;

// ![[target]], with an optional |alias, #heading or #page=N
const WIKILINK_EMBED = /!\[\[([^\]\n]+)\]\]/g;

// HTML comments and inline code spans never render as images
const INLINE_NON_RENDERED = /<!--[\s\S]*?-->|(?<![`\\])(`+)(?!`)(?:(?!\n[ \t]*\n)[\s\S])*?(?<!`)\1(?!`)/g;

// Get all markdown files in a collection, as its '**/*.{md,mdx}' glob does
function getContentFiles(dir) {
  const files = [];
  // Sorted so the report lists files in the same order on every OS
  const items = fs.readdirSync(dir).sort();

  for (const item of items) {
    if (item.startsWith('.')) continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getContentFiles(fullPath));
    } else if (/\.mdx?$/.test(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Collection, folder-based slug, and entry ID of a content file
function describeContentFile(filePath) {
  const parts = path.relative(contentRoot, filePath).split(path.sep);
  const isFolderBased = parts.length > 2 && parts[parts.length - 1] === 'index.md';
  return {
    collection: parts[0],
    // remarkFolderImages keys folder-based content by the first folder
    folderSlug: isFolderBased ? parts[1] : null,
    // The cover image components use the entry ID as the folder name
    id: parts.slice(1).join('/').replace(/\.mdx?$/, '').replace(/\/index$/, ''),
  };
}

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

// Value of a single-line YAML scalar, without quotes or a trailing comment
function parseYamlScalar(text) {
  const value = text.trim();
  const doubleQuoted = value.match(/^"((?:[^"\\]|\\.)*)"/);
  if (doubleQuoted) return doubleQuoted[1].replace(/\\(.)/g, '$1');
  const singleQuoted = value.match(/^'((?:[^']|'')*)'/);
  if (singleQuoted) return singleQuoted[1].replace(/''/g, "'");
  const plain = value.replace(/(^|\s)#.*$/, '').trim();
  return /^(~|null)?$/i.test(plain) ? '' : plain;
}

// The content schema uses the first item of a list such as ["[[cover.png]]"]
function firstListItem(value) {
  const list = value.match(/^\[(?!\[)(.*)\]$/);
  if (!list) return value;
  const item = list[1].match(/^\s*("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^,]*)/);
  return parseYamlScalar(item[1]);
}

// The `image` field's value and line index within the frontmatter, if it has one
function findFrontmatterImage(frontmatter) {
  const lines = frontmatter.split('\n');
  const index = lines.findIndex((line) => /^image[ \t]*:/.test(line));
  if (index === -1) return null;

  const inline = lines[index].replace(/^image[ \t]*:/, '');
  if (inline.trim()) {
    const value = firstListItem(parseYamlScalar(inline));
    return value ? { value, line: index } : null;
  }

  // A list property puts the value on the next line, and the schema uses the
  // first item. Anything else, such as the next key, means the field is empty.
  const offset = lines.slice(index + 1).findIndex((line) => line.trim());
  const item = offset === -1 ? null : lines[index + 1 + offset].match(/^[ \t]*-[ \t]+(.*)$/);
  const value = item ? parseYamlScalar(item[1]) : '';
  return value ? { value, line: index + 1 + offset } : null;
}

// Blank out fenced code blocks, keeping every line so line numbers still match.
// Fences inside callouts and other blockquotes sit behind "> " markers.
function blankFencedCode(text) {
  let fence = null;
  return text.split('\n').map((line) => {
    const quote = line.match(/^(?:[ \t]*>)*/)[0];
    const depth = quote.split('>').length - 1;
    const rest = line.slice(quote.length);

    if (fence && depth >= fence.depth) {
      const close = rest.match(/^[ \t]*(`{3,}|~{3,})[ \t]*$/);
      if (close && close[1][0] === fence.marker[0] && close[1].length >= fence.marker.length) {
        fence = null;
      }
      return '';
    }

    // A code block inside a blockquote ends where the blockquote ends
    fence = null;
    const open = rest.match(/^[ \t]*(`{3,}|~{3,})(.*)$/);
    if (open && !(open[1][0] === '`' && open[2].includes('`'))) {
      fence = { marker: open[1], depth };
      return '';
    }
    return line;
  }).join('\n');
}

// Path in a markdown image destination. Destinations are URLs, so drop the
// query and fragment and decode escapes such as %20.
function cleanMarkdownDestination(destination) {
  let ref = destination.trim();
  if (ref.startsWith('<') && ref.endsWith('>')) ref = ref.slice(1, -1);
  ref = ref.replace(/\\([!-/:-@[-`{-~])/g, '$1').split(/[?#]/)[0];
  try {
    return decodeURIComponent(ref);
  } catch {
    return ref;
  }
}

// Path in a wikilink embed, without the |alias and the #heading or #page=N
function cleanWikilinkTarget(target) {
  return target.split('|')[0].split('#')[0].trim();
}

// The site renders every local embed as a file, except Obsidian Bases embeds.
// Web URLs, including YouTube and X embeds, aren't checked.
function isLocalFile(ref) {
  return Boolean(ref) && !/^([a-z][a-z\d+.-]*:|\/\/)/i.test(ref) && !/\.base$/i.test(ref);
}

// URL a body image or embed resolves to (mirrors resolveContentFileUrl)
function bodyReferenceUrl(ref, file) {
  if (ref.startsWith('/')) return ref;
  // Special pages use the pages collection's paths
  const collection = file.collection === 'special' ? 'pages' : file.collection;
  let rel = ref.startsWith('./') ? ref.slice(2) : ref;

  if (file.folderSlug) {
    const ownPrefix = `${collection}/${file.folderSlug}/`;
    rel = rel.startsWith(ownPrefix) ? rel.slice(ownPrefix.length) : rel.replace(/^(images|attachments)\//, '');
    return `/${collection}/${file.folderSlug}/${rel}`;
  }

  return `/${collection}/attachments/${rel.replace(/^attachments\//, '')}`;
}

// URL the `image` frontmatter field resolves to (mirrors resolveCoverImage).
// A path that starts with attachments/ means the entry's own attachments/
// folder when the file is there, and the collection's otherwise. ownFile is the
// file the site looked for first when it fell back to the collection's folder.
function frontmatterImageUrl(ref, file) {
  const rel = path.posix.normalize(ref);
  if (rel.startsWith('/')) return { url: rel };

  if (rel.startsWith('attachments/')) {
    const name = rel.slice('attachments/'.length);
    const ownFile = path.join(contentRoot, file.collection, ...file.id.split('/'), 'attachments', ...name.split('/'));
    if (!findFile(ownFile)) return { url: `/${file.collection}/attachments/${name}`, ownFile };
    // Sync flattens the attachments/ folder of a top-level entry folder only
    const ownDir = file.id.includes('/') ? `${file.id}/attachments` : file.id;
    return { url: `/${file.collection}/${ownDir}/${name}` };
  }

  return { url: path.posix.normalize(`/${file.collection}/${file.id}/${rel.replace(/^images\//, '')}`) };
}

// Vault files that scripts/sync-images.js publishes at a URL, most likely first.
// public/<collection>/ is generated, so only files elsewhere in public/ count.
function sourcesForUrl(url) {
  // Browsers treat backslashes in URLs as slashes
  const parts = path.posix.normalize(url.replace(/\\/g, '/')).split('/').filter(Boolean);
  if (!COLLECTIONS.includes(parts[0])) {
    return [path.join(projectRoot, 'public', ...parts)];
  }
  if (parts.length < 3) return [];

  // Sync copies <collection>/<folder>/ to the same path, minus one attachments/ level
  const [collection, folder, ...rest] = parts;
  const folderDir = path.join(contentRoot, collection, folder);
  const sources = [path.join(folderDir, 'attachments', ...rest)];
  if (rest[0] !== 'attachments') sources.unshift(path.join(folderDir, ...rest));
  return sources;
}

function extractReferences(filePath) {
  const file = describeContentFile(filePath);
  const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const references = [];
  const add = (type, src, ref, line, url) => {
    if (isLocalFile(ref)) references.push({ type, src, line, url: url(ref, file) });
  };

  let body = content;
  const frontmatter = content.match(FRONTMATTER);
  if (frontmatter) {
    // Keep the frontmatter's lines so body line numbers stay right
    body = frontmatter[0].replace(/[^\n]/g, '') + content.slice(frontmatter[0].length);

    // Special pages have no image field, so the site ignores one
    const image = file.collection === 'special' ? null : findFrontmatterImage(frontmatter[1]);
    if (image) {
      const firstLine = lineAt(content, frontmatter[0].length - frontmatter[1].length - 3);
      const value = image.value.trim();
      const ref = (value.startsWith('[[') && value.endsWith(']]') ? value.slice(2, -2) : value).trim();
      if (isLocalFile(ref)) {
        references.push({ type: 'frontmatter', src: image.value, line: firstLine + image.line, ...frontmatterImageUrl(ref, file) });
      }
    }
  }

  // Skip code and comments, which never render as images
  body = blankFencedCode(body).replace(INLINE_NON_RENDERED, (match) => match.replace(/[^\n]/g, ' '));

  for (const match of body.matchAll(MARKDOWN_IMAGE)) {
    add('markdown', match[1], cleanMarkdownDestination(match[1]), lineAt(body, match.index), bodyReferenceUrl);
  }
  for (const match of body.matchAll(WIKILINK_EMBED)) {
    add('wikilink', match[1], cleanWikilinkTarget(match[1]), lineAt(body, match.index), bodyReferenceUrl);
  }

  return references.sort((a, b) => a.line - b.line);
}

const directoryListings = new Map();

function listDirectory(dir) {
  if (!directoryListings.has(dir)) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      // Missing or unreadable directories have no entries
    }
    directoryListings.set(dir, entries);
  }
  return directoryListings.get(dir);
}

// Find a file one path segment at a time. fs.existsSync() ignores case on
// Windows and macOS, but deployed sites match paths exactly.
function findFile(filePath, ignoreCase = false) {
  let current = projectRoot;
  for (const name of path.relative(projectRoot, filePath).split(path.sep)) {
    const entry = listDirectory(current).find((candidate) =>
      ignoreCase ? candidate.toLowerCase() === name.toLowerCase() : candidate === name
    );
    if (!entry) return null;
    current = path.join(current, entry);
  }
  return fs.statSync(current, { throwIfNoEntry: false })?.isFile() ? current : null;
}

function displayPath(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

// Main function
function main() {
  console.log('🔍 Checking for missing images...\n');

  let totalImages = 0;
  const missingImageDetails = [];

  for (const collection of COLLECTIONS) {
    const collectionDir = path.join(contentRoot, collection);
    if (!fs.existsSync(collectionDir)) continue;

    for (const filePath of getContentFiles(collectionDir)) {
      for (const reference of extractReferences(filePath)) {
        totalImages++;
        const sources = sourcesForUrl(reference.url);
        if (sources.some((source) => findFile(source))) continue;

        // A cover that fell back to the collection's folder can live in either folder
        const candidates = [reference.ownFile, ...sources].filter(Boolean);
        const expectedPaths = [reference.ownFile, sources[0]].filter(Boolean).map(displayPath);
        const caseMismatch = candidates.map((source) => findFile(source, true)).find(Boolean);
        missingImageDetails.push({
          ...reference,
          file: displayPath(filePath),
          expectedPaths: expectedPaths.length ? expectedPaths : [`nothing is published at ${reference.url}`],
          caseMismatch: caseMismatch && displayPath(caseMismatch),
        });
      }
    }
  }

  const missingImages = missingImageDetails.length;

  // Report results
  console.log(`📊 Summary:`);
  console.log(`   Total images: ${totalImages}`);
  console.log(`   Missing images: ${missingImages}`);
  console.log(`   Found images: ${totalImages - missingImages}\n`);

  if (missingImages > 0) {
    console.log('❌ Missing images:');
    for (const detail of missingImageDetails) {
      console.log(`   ${detail.file}:${detail.line} (${detail.type})`);
      console.log(`     ${detail.src}`);
      console.log(`     Expected: ${detail.expectedPaths.join('\n           or: ')}`);
      if (detail.caseMismatch) {
        console.log(`     Found with different capitalization: ${detail.caseMismatch}`);
      }
      console.log('');
    }

    console.log('💡 Tips:');
    console.log('   - Single-file content uses its collection\'s attachments/ folder, such as src/content/posts/attachments/');
    console.log('   - Folder-based content uses the folder of its index.md and that folder\'s attachments/ subfolder');
    console.log('   - A frontmatter image that starts with attachments/ uses the entry\'s own attachments/ folder when the file is there, and the collection\'s otherwise');
    console.log('   - Paths are case-sensitive on the deployed site, even when they are not on your computer');
  } else {
    console.log('✅ All images found!');
  }
}

main();
