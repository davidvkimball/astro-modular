#!/usr/bin/env node

/**
 * Astro Modular Update Script
 *
 * Downloads the latest release from GitHub, replaces framework files,
 * and preserves user content and assets. After updating, open Obsidian
 * and click "Apply all settings" in the Astro Modular Settings plugin
 * to rewrite your config.ts with your saved settings.
 *
 * Usage: pnpm run update
 */

import { execSync } from 'child_process';
import { createWriteStream, existsSync, mkdirSync, cpSync, rmSync, readFileSync, readdirSync, statSync, renameSync, writeFileSync } from 'fs';
import { join, resolve, basename } from 'path';
import { tmpdir } from 'os';
import { get as httpsGet } from 'https';
import { pipeline } from 'stream/promises';

const ROOT = resolve(import.meta.dirname, '..');
const REPO = 'davidvkimball/astro-modular';

// Files and directories that belong to the USER and must be preserved
const USER_PATHS = [
  'src/content',       // All user content + .obsidian vault (plugin data.json files)
  'public/profile.jpg',
  'public/profile.png',
  'public/profile.webp',
  'public/favicon.png',
  'public/favicon-dark.png',
  'public/favicon-light.png',
  'public/open-graph.png',
  '.env',
  '.env.local',
  '.env.production',
];

// Directories that should never be touched
const SKIP_PATHS = [
  'node_modules',
  '.git',
  '.astro',
  '.netlify',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) { console.log(`  ${msg}`); }
function logStep(msg) { console.log(`\n> ${msg}`); }
function logError(msg) { console.error(`\n  ERROR: ${msg}`); }

function getCurrentVersion() {
  const versionFile = join(ROOT, 'VERSION');
  if (existsSync(versionFile)) {
    return readFileSync(versionFile, 'utf-8').trim();
  }
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  return pkg.version;
}

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { 'User-Agent': 'astro-modular-updater' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve, reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Invalid JSON from ${url}`)); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { 'User-Agent': 'astro-modular-updater' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
      }
      const ws = createWriteStream(dest);
      pipeline(res, ws).then(resolve, reject);
    }).on('error', reject);
  });
}

function copyIfExists(src, dest) {
  if (!existsSync(src)) return false;
  const stat = statSync(src);
  if (stat.isDirectory()) {
    cpSync(src, dest, { recursive: true });
  } else {
    const dir = join(dest, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cpSync(src, dest);
  }
  return true;
}

// ── Main ────────────────────────────────────────────────────────────────────

/**
 * Compare two dot-separated version strings.
 * Returns >0 if a is newer, <0 if b is newer, 0 if equal.
 * Non-numeric segments (pre-release suffixes) are compared as 0 so that
 * a malformed tag never reads as newer than a real one.
 */
function compareVersions(a, b) {
  const parse = (v) => String(v).split('.').map((n) => parseInt(n, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function main() {
  console.log('\nAstro Modular Updater');
  console.log('====================');

  // 1. Get current version
  const currentVersion = getCurrentVersion();
  log(`Current version: ${currentVersion}`);

  // 2. Check latest release
  logStep('Checking for updates...');
  let release;
  try {
    release = await fetchJSON(`https://api.github.com/repos/${REPO}/releases/latest`);
  } catch (err) {
    logError(`Could not reach GitHub: ${err.message}`);
    process.exit(1);
  }

  const latestVersion = release.tag_name.replace(/^v/, '');
  log(`Latest version:  ${latestVersion}`);

  if (currentVersion === latestVersion) {
    log('Already up to date!');
    process.exit(0);
  }

  // Never move backwards. Anyone who forked from master is on a version newer
  // than the most recent published release, and the only previous guard was a
  // string equality check, so this script would happily overwrite their newer
  // files with an older release.
  const comparison = compareVersions(currentVersion, latestVersion);
  if (comparison > 0) {
    log(`You are on ${currentVersion}, which is newer than the latest release (${latestVersion}).`);
    log('Nothing to do. Use --force to overwrite with the older release anyway.');
    if (!process.argv.includes('--force')) {
      process.exit(0);
    }
    log('--force given, continuing with the downgrade.');
  }

  // 3. Download release archive
  logStep(`Downloading v${latestVersion}...`);
  const isWindows = process.platform === 'win32';
  const archiveUrl = isWindows ? release.zipball_url : release.tarball_url;
  const tempDir = join(tmpdir(), `astro-modular-update-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  const archivePath = join(tempDir, isWindows ? 'release.zip' : 'release.tar.gz');

  try {
    await downloadFile(archiveUrl, archivePath);
  } catch (err) {
    logError(`Download failed: ${err.message}`);
    rmSync(tempDir, { recursive: true, force: true });
    process.exit(1);
  }
  log(`Downloaded to temp directory.`);

  // 4. Extract archive
  logStep('Extracting...');
  const extractDir = join(tempDir, 'extracted');
  mkdirSync(extractDir, { recursive: true });
  try {
    if (isWindows) {
      execSync(`powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${extractDir}' -Force"`, { stdio: 'pipe' });
    } else {
      execSync(`tar -xzf "${archivePath}" -C "${extractDir}"`, { stdio: 'pipe' });
    }
  } catch (err) {
    logError(`Extraction failed: ${err.message}`);
    rmSync(tempDir, { recursive: true, force: true });
    process.exit(1);
  }

  // GitHub tarballs extract into a directory like "owner-repo-hash/"
  const extractedContents = readdirSync(extractDir);
  if (extractedContents.length !== 1) {
    logError('Unexpected archive structure.');
    rmSync(tempDir, { recursive: true, force: true });
    process.exit(1);
  }
  const sourceDir = join(extractDir, extractedContents[0]);
  log('Extracted successfully.');

  // 5. Back up user files
  logStep('Backing up user content...');
  const backupDir = join(tempDir, 'backup');
  mkdirSync(backupDir, { recursive: true });

  let backedUp = 0;
  for (const userPath of USER_PATHS) {
    const src = join(ROOT, userPath);
    const dest = join(backupDir, userPath);
    if (copyIfExists(src, dest)) {
      log(`  Backed up: ${userPath}`);
      backedUp++;
    }
  }

  // Also back up any user-added public/ files not in the new release
  const publicDir = join(ROOT, 'public');
  const newPublicDir = join(sourceDir, 'public');
  if (existsSync(publicDir)) {
    for (const file of readdirSync(publicDir)) {
      const fullPath = join(publicDir, file);
      if (statSync(fullPath).isFile()) {
        const alreadyBacked = USER_PATHS.some(p => p === `public/${file}`);
        if (!alreadyBacked) {
          // Check if this file does NOT exist in the new release (user-added)
          if (!existsSync(join(newPublicDir, file))) {
            const dest = join(backupDir, 'public', file);
            mkdirSync(join(backupDir, 'public'), { recursive: true });
            cpSync(fullPath, dest);
            log(`  Backed up (user asset): public/${file}`);
            backedUp++;
          }
        }
      }
    }
  }

  log(`${backedUp} item(s) backed up.`);

  // 6. Replace framework files
  logStep('Updating framework files...');

  // Get list of all paths in the new release (excluding user/skip paths)
  function listPaths(dir, base = '') {
    const results = [];
    for (const entry of readdirSync(dir)) {
      const rel = base ? `${base}/${entry}` : entry;
      const full = join(dir, entry);

      // Skip paths we should never touch
      if (SKIP_PATHS.includes(rel)) continue;
      // Skip user content paths (we'll restore from backup)
      if (USER_PATHS.includes(rel)) continue;

      if (statSync(full).isDirectory()) {
        // If it's a user directory root, skip recursing
        if (USER_PATHS.some(p => p.startsWith(rel + '/'))) {
          // Only skip exact user-path prefixes like src/content
          if (USER_PATHS.includes(rel)) continue;
          results.push(...listPaths(full, rel));
        } else {
          results.push(...listPaths(full, rel));
        }
      } else {
        results.push(rel);
      }
    }
    return results;
  }

  const newFiles = listPaths(sourceDir);
  let updated = 0;

  for (const relPath of newFiles) {
    const src = join(sourceDir, relPath);
    const dest = join(ROOT, relPath);
    const destDir = join(dest, '..');

    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    cpSync(src, dest);
    updated++;
  }
  log(`${updated} framework file(s) updated.`);

  // 7. Restore user files from backup
  logStep('Restoring user content...');
  let restored = 0;

  for (const userPath of USER_PATHS) {
    const src = join(backupDir, userPath);
    const dest = join(ROOT, userPath);
    if (copyIfExists(src, dest)) {
      log(`  Restored: ${userPath}`);
      restored++;
    }
  }

  // Restore user-added public/ files
  const backupPublicDir = join(backupDir, 'public');
  if (existsSync(backupPublicDir)) {
    for (const file of readdirSync(backupPublicDir)) {
      const alreadyRestored = USER_PATHS.some(p => p === `public/${file}`);
      if (!alreadyRestored) {
        cpSync(join(backupPublicDir, file), join(ROOT, 'public', file));
        log(`  Restored (user asset): public/${file}`);
        restored++;
      }
    }
  }

  log(`${restored} item(s) restored.`);

  // 8. Install dependencies
  logStep('Installing dependencies...');
  try {
    execSync('pnpm install', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    logError('pnpm install failed. You may need to run it manually.');
  }

  // 9. Clean up temp directory
  rmSync(tempDir, { recursive: true, force: true });

  // 10. Done
  console.log('\n====================================');
  console.log(`  Updated to v${latestVersion}!`);
  console.log('====================================');
  console.log('\n  Next steps:');
  console.log('  1. Open your vault in Obsidian');
  console.log('  2. Go to Astro Modular Settings > Advanced tab');
  console.log('  3. Click "Apply to config.ts" under "Apply all settings"');
  console.log('     to write your saved settings to the new config.ts');
  console.log('  4. Run `pnpm dev` to verify everything works');
  console.log('');
}

main().catch(err => {
  logError(err.message);
  process.exit(1);
});
