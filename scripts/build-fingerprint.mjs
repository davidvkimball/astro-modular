// Build-output fingerprint: a reliable, quick, consistent way to confirm a
// change did not alter (or break) the rendered site.
//
// Flow:
//   pnpm build && node scripts/build-fingerprint.mjs --save .fp.json   # before the change
//   <make the change>
//   pnpm build && node scripts/build-fingerprint.mjs --compare .fp.json # after
//
// It walks dist/ for every rendered .html page, normalizes away the things
// that legitimately change every build (hashed asset filenames, build
// timestamps) so the diff shows only real content/structure changes, and
// reports each page that moved. Exit code 1 if anything changed, 0 if clean,
// so it doubles as a CI gate.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const DIST = 'dist';

function walkHtml(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkHtml(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

// Strip per-build noise so identical content fingerprints identically.
function normalize(html) {
  return html
    .replace(/\r\n/g, '\n')
    // hashed asset filenames: /_astro/name.<hash>.ext -> /_astro/name.HASH.ext
    .replace(/(\/_astro\/[\w.-]+?)\.[A-Za-z0-9_-]{8,}\.(\w+)/g, '$1.HASH.$2')
    // generic cache-busting querystrings
    .replace(/\?v=[\w.-]+/g, '?v=HASH')
    // build timestamps (ISO datetime) used in RSS/OG/meta
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g, 'TIMESTAMP');
}

function fingerprint() {
  if (!existsSync(DIST)) {
    console.error(`No ${DIST}/ found. Run \`pnpm build\` first.`);
    process.exit(2);
  }
  const fp = {};
  for (const f of walkHtml(DIST).sort()) {
    const rel = relative(DIST, f).replace(/\\/g, '/');
    fp[rel] = createHash('sha256').update(normalize(readFileSync(f, 'utf8'))).digest('hex').slice(0, 16);
  }
  return fp;
}

const [, , mode, file] = process.argv;
const fp = fingerprint();

if (mode === '--save') {
  if (!file) { console.error('Usage: --save <file>'); process.exit(2); }
  writeFileSync(file, JSON.stringify(fp, null, 2));
  console.log(`Saved fingerprint of ${Object.keys(fp).length} pages -> ${file}`);
} else if (mode === '--compare') {
  if (!file || !existsSync(file)) { console.error(`Baseline ${file} not found. Run --save first.`); process.exit(2); }
  const base = JSON.parse(readFileSync(file, 'utf8'));
  const baseKeys = Object.keys(base);
  const nowKeys = Object.keys(fp);
  const changed = nowKeys.filter((k) => k in base && base[k] !== fp[k]);
  const added = nowKeys.filter((k) => !(k in base));
  const removed = baseKeys.filter((k) => !(k in fp));
  console.log(`Pages now: ${nowKeys.length} (baseline ${baseKeys.length})`);
  console.log(`Changed: ${changed.length}  Added: ${added.length}  Removed: ${removed.length}`);
  for (const k of changed) console.log(`  ~ ${k}`);
  for (const k of added) console.log(`  + ${k}`);
  for (const k of removed) console.log(`  - ${k}`);
  if (changed.length || added.length || removed.length) {
    console.log('\nOutput changed. Inspect the pages above; if the change was intended, this is expected.');
    process.exit(1);
  }
  console.log('\nNo rendered-output changes. The change was safe.');
} else {
  console.log('Usage:\n  node scripts/build-fingerprint.mjs --save <file>\n  node scripts/build-fingerprint.mjs --compare <file>');
  process.exit(2);
}
