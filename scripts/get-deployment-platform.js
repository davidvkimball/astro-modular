#!/usr/bin/env node

/**
 * Get deployment platform from config
 * This script reads the deployment platform from src/config.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

const PLATFORMS = ['netlify', 'vercel', 'github-pages', 'cloudflare-workers'];

// Pull the platform out of config.ts source.
//
// Prefer the [CONFIG:DEPLOYMENT_PLATFORM] marker, accepting the value on the
// marker's own line or the next one, since the settings plugin may write either.
// The fallback skips union types: the SiteConfig interface declares
// `platform: "netlify" | "vercel" | ...` earlier in the file, and matching the
// first `platform:` used to return "netlify" for every site whatever it set.
export function parseDeploymentPlatform(configContent) {
  const lines = configContent.split(/\r?\n/);
  const valueOf = (line) => line.match(/platform:\s*["']([^"']+)["'](?!\s*\|)/)?.[1];

  const markerIndex = lines.findIndex((line) => line.includes('[CONFIG:DEPLOYMENT_PLATFORM]'));
  if (markerIndex !== -1) {
    const value = valueOf(lines[markerIndex]) ?? valueOf(lines[markerIndex + 1] ?? '');
    if (value) return value;
  }

  for (const line of lines) {
    if (/platform:\s*["'][^"']+["']\s*\|/.test(line)) continue; // type declaration
    const value = valueOf(line);
    if (value) return value;
  }

  return null;
}

function getDeploymentPlatform() {
  const fallback = process.env.DEPLOYMENT_PLATFORM || 'netlify';
  try {
    const configPath = join(process.cwd(), 'src', 'config.ts');
    const platform = parseDeploymentPlatform(readFileSync(configPath, 'utf8'));

    if (!platform) return fallback;
    if (!PLATFORMS.includes(platform)) {
      console.warn(`Unknown deployment platform "${platform}" in src/config.ts; using ${fallback}. Expected one of: ${PLATFORMS.join(', ')}.`);
      return fallback;
    }
    return platform;
  } catch (error) {
    console.error('Error reading config:', error.message);
    return fallback;
  }
}

// Export for use in other scripts
export default getDeploymentPlatform;

// If run directly, output the platform. Compare as file URLs: a bare
// `file://${argv[1]}` never matches on Windows, where argv uses backslashes.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(getDeploymentPlatform());
}
