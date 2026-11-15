import { existsSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const astroCacheDir = path.join(projectRoot, '.astro');
const viteCacheDir = path.join(projectRoot, 'node_modules', '.vite');

console.log('⚙️ Setting up development environment...');

// Wipe .astro completely so content layer and route cache are fresh every dev run
try {
  if (existsSync(astroCacheDir)) {
    console.log(`Cleaning .astro cache: ${astroCacheDir}`);
    rmSync(astroCacheDir, { recursive: true, force: true });
  }
  mkdirSync(astroCacheDir, { recursive: true });
} catch (error) {
  console.error(`Failed to clean .astro: ${error.message}`);
}

// Wipe Vite deps cache so modules are re-resolved
try {
  const viteDeps = path.join(viteCacheDir, 'deps');
  if (existsSync(viteDeps)) {
    console.log(`Cleaning Vite deps cache: ${viteDeps}`);
    rmSync(viteDeps, { recursive: true, force: true });
  }
  if (!existsSync(viteCacheDir)) {
    mkdirSync(viteCacheDir, { recursive: true });
  }
} catch (error) {
  console.error(`Failed to clean Vite cache: ${error.message}`);
}

// Clear an obsidian-git "Repository folder within the vault" that points above
// the vault. Obsidian 1.15.1 rejects any vault path containing "..", so a saved
// basePath like "../.." leaves Git "not ready" and unable to push (issue #34).
// It was never needed: with basePath empty, obsidian-git starts at the vault and
// finds the repository above it with `git rev-parse --show-cdup`. Only a value
// that resolves to a folder holding both the vault and a .git is cleared, since
// that is exactly the repository the plugin finds on its own.
try {
  const vaultDir = path.join(projectRoot, 'src', 'content');
  const gitSettings = path.join(vaultDir, '.obsidian', 'plugins', 'obsidian-git', 'data.json');
  if (existsSync(gitSettings)) {
    const raw = readFileSync(gitSettings, 'utf8');
    const basePath = JSON.parse(raw).basePath;
    if (typeof basePath === 'string' && basePath.split(/[\\/]/).includes('..')) {
      const target = path.resolve(vaultDir, basePath);
      const containsVault = !path.relative(target, vaultDir).startsWith('..');
      if (containsVault && existsSync(path.join(target, '.git'))) {
        writeFileSync(gitSettings, raw.replace(/("basePath"\s*:\s*)"[^"]*"/, '$1""'));
        console.log(`Cleared obsidian-git's repository folder ("${basePath}"): Obsidian 1.15 rejects paths with "..", and the plugin finds the repository from the vault without it.`);
      }
    }
  }
} catch (error) {
  console.error(`Failed to check obsidian-git settings: ${error.message}`);
}

console.log('✅ Development environment setup complete.');
