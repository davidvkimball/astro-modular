#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple logging utility
const isDev = process.env.NODE_ENV !== 'production';
const log = {
  info: (...args) => isDev && console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args)
};

// Import deployment platform helper
import getDeploymentPlatform from './get-deployment-platform.js';

// Deployment platform configuration - use config if no env var is set
const DEPLOYMENT_PLATFORM = process.env.DEPLOYMENT_PLATFORM || getDeploymentPlatform();
const DRY_RUN = process.argv.includes('--dry-run');
const VALIDATE_ONLY = process.argv.includes('--validate');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define content directories to process
const CONTENT_DIRS = [
  'src/content/pages',
  'src/content/posts',
  'src/content/projects',
  'src/content/docs'
];

// Function to parse frontmatter from markdown content
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: null, content: content };
  }
  
  const frontmatterText = match[1];
  const body = match[2];
  
  // Parse YAML-like frontmatter (simple parser)
  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentValue = [];
  let inArray = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }
    
    if (trimmed.includes(':') && (!inArray || !trimmed.startsWith('  '))) {
      // Save previous key-value pair
      if (currentKey) {
        if (currentValue.length === 1) {
          frontmatter[currentKey] = currentValue[0];
        } else {
          frontmatter[currentKey] = currentValue;
        }
      }
      
      // Start new key-value pair
      const colonIndex = trimmed.indexOf(':');
      currentKey = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      
      // Reset array state when starting a new key
      inArray = false;
      
      if (value.startsWith('[')) {
        // Array value
        inArray = true;
        currentValue = [];
        if (value !== '[') {
          // Single line array
          const arrayContent = value.substring(1, value.endsWith(']') ? value.length - 1 : value.length);
          if (arrayContent.trim()) {
            currentValue = arrayContent.split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
          }
          inArray = false;
        }
      } else if (value) {
        // Single value
        currentValue = [value.replace(/^["']|["']$/g, '')];
      } else {
        // Empty value, might be start of array
        currentValue = [];
        inArray = true;
      }
    } else if (inArray && trimmed.startsWith('-')) {
      // Array item
      const item = trimmed.substring(1).trim().replace(/^["']|["']$/g, '');
      currentValue.push(item);
    } else if (inArray && trimmed === ']') {
      // End of array
      inArray = false;
    } else if (currentKey && !inArray) {
      // Continuation of single value
      currentValue = [currentValue[0] + ' ' + trimmed];
    }
  }
  
  // Save last key-value pair
  if (currentKey) {
    if (currentValue.length === 1) {
      frontmatter[currentKey] = currentValue[0];
    } else {
      frontmatter[currentKey] = currentValue;
    }
  }
  
  return { frontmatter, content: body };
}

// Function to get the final URL for a content file
function getContentUrl(filePath, isPost = false) {
  // Normalize path separators and extract the relevant part
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  if (isPost) {
    // For posts: extract path after 'src/content/posts/' and remove '.md'
    let postPath = normalizedPath.replace(/^.*src\/content\/posts\//, '').replace(/\.md$/, '');
    // Handle folder-based content: remove '/index' suffix
    if (postPath.endsWith('/index')) {
      postPath = postPath.replace('/index', '');
    }
    return `/posts/${postPath}`;
  } else if (normalizedPath.includes('src/content/projects/')) {
    // For projects: extract path after 'src/content/projects/' and remove '.md'
    let projectPath = normalizedPath.replace(/^.*src\/content\/projects\//, '').replace(/\.md$/, '');
    // Handle folder-based content: remove '/index' suffix
    if (projectPath.endsWith('/index')) {
      projectPath = projectPath.replace('/index', '');
    }
    return `/projects/${projectPath}`;
  } else if (normalizedPath.includes('src/content/docs/')) {
    // For docs: extract path after 'src/content/docs/' and remove '.md'
    let docPath = normalizedPath.replace(/^.*src\/content\/docs\//, '').replace(/\.md$/, '');
    // Handle folder-based content: remove '/index' suffix
    if (docPath.endsWith('/index')) {
      docPath = docPath.replace('/index', '');
    }
    return `/docs/${docPath}`;
  } else {
    // For pages: extract path after 'src/content/pages/' and remove '.md'
    let pagePath = normalizedPath.replace(/^.*src\/content\/pages\//, '').replace(/\.md$/, '');
    // Handle folder-based content: remove '/index' suffix
    if (pagePath.endsWith('/index')) {
      pagePath = pagePath.replace('/index', '');
    }
    if (pagePath === 'index') {
      return '/';
    }
    return `/${pagePath}`;
  }
}



// Function to process a single markdown file
async function processMarkdownFile(filePath, isPost = false) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter } = parseFrontmatter(content);
    
    if (!frontmatter || !frontmatter.aliases) {
      return []; // No redirects to process
    }
    
    // Ensure aliases is an array
    const aliasesArray = Array.isArray(frontmatter.aliases) 
      ? frontmatter.aliases 
      : [frontmatter.aliases];
    
    const targetUrl = getContentUrl(filePath, isPost);
    const redirects = [];
    
    for (const alias of aliasesArray) {
      const cleanAlias = alias.startsWith('/') ? alias.substring(1) : alias;
      
      // Normalize path separators for consistent checking
      const normalizedFilePath = filePath.replace(/\\/g, '/');
      
      // Determine redirect pattern based on content type
      let redirectFrom;
      if (isPost) {
        // Posts: /posts/alias → /posts/actual-slug
        redirectFrom = `/posts/${cleanAlias}`;
      } else if (normalizedFilePath.includes('src/content/projects/')) {
        // Projects: /projects/alias → /projects/actual-slug
        redirectFrom = `/projects/${cleanAlias}`;
      } else if (normalizedFilePath.includes('src/content/docs/')) {
        // Docs: /docs/alias → /docs/actual-slug
        redirectFrom = `/docs/${cleanAlias}`;
      } else {
        // Pages: /alias → /actual-slug
        redirectFrom = `/${cleanAlias}`;
      }
      
      // Skip self-redirects (redirecting to the same URL causes infinite loops)
      if (redirectFrom !== targetUrl) {
        redirects.push({
          from: redirectFrom,
          to: targetUrl,
          alias: cleanAlias
        });
      }
    }
    
    return redirects;
  } catch (error) {
    log.error(`❌ Error processing ${filePath}:`, error.message);
    return [];
  }
}

// Function to process all markdown files in a directory
async function processDirectory(dirPath, isPost = false) {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    let allRedirects = [];
    let processedFiles = 0;
    
    for (const file of files) {
      if (file.isDirectory()) {
        // Handle folder-based content (e.g., folder-name/index.md)
        const folderPath = path.join(dirPath, file.name);
        try {
          const indexPath = path.join(folderPath, 'index.md');
          await fs.access(indexPath);
          const redirects = await processMarkdownFile(indexPath, isPost);
          allRedirects = allRedirects.concat(redirects);
          if (redirects.length > 0) {
            processedFiles++;
          }
        } catch (error) {
          // index.md doesn't exist in this folder, skip
        }
      } else if (file.isFile() && file.name.endsWith('.md')) {
        // Handle single-file content
        const filePath = path.join(dirPath, file.name);
        const redirects = await processMarkdownFile(filePath, isPost);
        allRedirects = allRedirects.concat(redirects);
        if (redirects.length > 0) {
          processedFiles++;
        }
      }
    }
    
    return { redirects: allRedirects, processedFiles };
  } catch (error) {
    log.error(`❌ Error processing directory ${dirPath}:`, error.message);
    return { redirects: [], processedFiles: 0 };
  }
}

// Function to update astro.config.mjs with redirects (dev-only)
async function updateAstroConfig(redirects) {
  const astroConfigPath = 'astro.config.mjs';
  
  try {
    let astroContent = await fs.readFile(astroConfigPath, 'utf-8');
    
    // Create redirects object
    const redirectsObj = {};
    for (const redirect of redirects) {
      redirectsObj[redirect.from] = redirect.to;
    }
    
    // Format redirects with conditional dev-only check
    // Using process.env.NODE_ENV for reliable environment detection at config load time
    const redirectsString = JSON.stringify(redirectsObj, null, 2).replace(/"/g, "'");
    const newRedirectsSection = `redirects: (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'build') ? ${redirectsString} : {}`;
    
    // Remove ALL existing redirects entries (including any comments before them)
    // This handles multiple redirects entries that may have been duplicated
    // Match from optional comments + redirects: through the entire conditional expression
    // Pattern: redirects: (condition) ? { object } : {},
    // Use [\s\S]*? to match any characters including newlines (non-greedy)
    const redirectsRegex = /(\s*\/\/[^\n]*\n)*\s*redirects:\s*\([^)]+\)\s*\?\s*\{[\s\S]*?\}\s*:\s*\{\},\s*/g;
    
    // Remove all existing redirects entries (run multiple times to catch all duplicates)
    let previousContent = '';
    while (previousContent !== astroContent) {
      previousContent = astroContent;
      astroContent = astroContent.replace(redirectsRegex, '');
    }
    
    // Add redirects after devToolbar config
    const devToolbarRegex = /(devToolbar:\s*\{[^}]*\},)/;
    if (devToolbarRegex.test(astroContent)) {
      astroContent = astroContent.replace(devToolbarRegex, `$1\n  ${newRedirectsSection},\n`);
    } else {
      // Fallback: add after deployment config if devToolbar not found
      const deploymentRegex = /(deployment:\s*\{[^}]*\},)/;
      if (deploymentRegex.test(astroContent)) {
        astroContent = astroContent.replace(deploymentRegex, `$1\n  ${newRedirectsSection},\n`);
      } else {
        // Last resort: add after site config
        const siteRegex = /(site:\s*[^,]+),/;
        astroContent = astroContent.replace(siteRegex, `$1,\n  ${newRedirectsSection},\n`);
      }
    }
    
    await fs.writeFile(astroConfigPath, astroContent, 'utf-8');
    log.info(`📝 Updated astro.config.mjs with ${redirects.length} redirects (dev-only)`);
  } catch (error) {
    log.error(`❌ Error updating astro.config.mjs:`, error.message);
  }
}


// Platform-specific configuration generators
function generateVercelConfig(redirects) {
  // Filter out self-redirects (redirecting to the same URL causes infinite loops)
  const validRedirects = redirects.filter(redirect => redirect.from !== redirect.to);
  
  const config = {
    redirects: validRedirects.map(redirect => ({
      source: redirect.from,
      destination: redirect.to,
      permanent: (redirect.status || 301) === 301
    })),
    headers: [
      {
        source: "/_assets/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        source: "/(.*\\.(webp|jpg|jpeg|png|gif|svg))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        source: "/(.*\\.pdf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          }
        ]
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://giscus.app https://platform.twitter.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://giscus.app; frame-src 'self' https://www.youtube.com https://giscus.app https://platform.twitter.com; object-src 'none'; base-uri 'self';"
          }
        ]
      }
    ]
  };
  
  return JSON.stringify(config, null, 2);
}

function generateGitHubPagesConfig(redirects) {
  // Filter out self-redirects (redirecting to the same URL causes infinite loops)
  const validRedirects = redirects.filter(redirect => redirect.from !== redirect.to);
  
  // Note: Removed '!' suffix to avoid interstitial page - direct redirects like Netlify
  const redirectLines = validRedirects.map(redirect => 
    `${redirect.from}    ${redirect.to}    ${redirect.status || 301}`
  );
  
  return redirectLines.join('\n') + '\n';
}

function generateNetlifyConfig(redirects) {
  const redirectLines = [];
  
  // Filter out self-redirects (redirecting to the same URL causes infinite loops)
  const validRedirects = redirects.filter(redirect => redirect.from !== redirect.to);
  
  for (const redirect of validRedirects) {
    redirectLines.push('[[redirects]]');
    redirectLines.push(`  from = "${redirect.from}"`);
    redirectLines.push(`  to = "${redirect.to}"`);
    redirectLines.push(`  status = ${redirect.status || 301}`);
    redirectLines.push('  force = true');
    redirectLines.push('');
  }
  
  // Always add the catch-all 404 redirect at the end
  redirectLines.push('[[redirects]]');
  redirectLines.push('  from = "/*"');
  redirectLines.push('  to = "/404"');
  redirectLines.push('  status = 404');
  
  return redirectLines.join('\n');
}

function generateCloudflareWorkersConfig(projectName) {
  // Get current date for compatibility_date
  const today = new Date();
  const compatibilityDate = today.toISOString().split('T')[0];
  
  // Generate Workers-compatible config (recommended by Cloudflare)
  // Workers uses assets.directory instead of pages_build_output_dir
  // See: https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
  const configLines = [];
  configLines.push(`name = "${projectName}"`);
  configLines.push(`compatibility_date = "${compatibilityDate}"`);
  configLines.push(``);
  configLines.push(`[assets]`);
  configLines.push(`  directory = "./dist"`);
  configLines.push(`  not_found_handling = "404-page"  # Serve custom 404 page from src/pages/404.astro`);
  
  return configLines.join('\n') + '\n';
}

// Clean up platform-specific files that don't match the selected platform
async function cleanupOtherPlatformFiles(currentPlatform) {
  const projectRoot = path.join(__dirname, '..');
  
  // Clean up GitHub Pages/Cloudflare Workers files if not using those platforms
  // (Both platforms use the same _redirects and _headers format)
  // These files should ONLY exist for github-pages and cloudflare-workers
  if (currentPlatform !== 'github-pages' && currentPlatform !== 'cloudflare-workers') {
    const sharedFiles = [
      path.join(projectRoot, 'public', '_redirects'),
      path.join(projectRoot, 'public', '_headers')
    ];
    
    for (const file of sharedFiles) {
      try {
        await fs.access(file);
        await fs.unlink(file);
        log.info(`🧹 Removed ${path.basename(file)} (not needed for ${currentPlatform})`);
      } catch (error) {
        // File doesn't exist, nothing to clean up
      }
    }
  }
  
  // Note: We don't remove vercel.json, netlify.toml, or wrangler.toml as they may contain
  // custom configuration (serverless functions, environment variables, bindings, etc.)
  // Only _redirects and _headers are platform-specific and should be cleaned up
}

// Platform-specific file writers
async function writeVercelConfig(redirects) {
  const projectRoot = path.join(__dirname, '..');
  const vercelJsonPath = path.join(projectRoot, 'vercel.json');
  
  if (DRY_RUN) {
    log.info('📝 [DRY RUN] Would generate vercel.json:');
    console.log(generateVercelConfig(redirects));
    return;
  }
  
  try {
    // Read existing vercel.json to preserve custom settings
    let existingConfig = {};
    try {
      const existingContent = await fs.readFile(vercelJsonPath, 'utf-8');
      existingConfig = JSON.parse(existingContent);
    } catch (error) {
      // File doesn't exist or is invalid JSON, create new one
    }
    
    // Generate new redirects and headers
    const newConfig = JSON.parse(generateVercelConfig(redirects));
    
    // Merge configs - new redirects/headers override existing ones
    const mergedConfig = {
      ...existingConfig,
      redirects: newConfig.redirects,
      headers: newConfig.headers
    };
    
    await fs.writeFile(vercelJsonPath, JSON.stringify(mergedConfig, null, 2), 'utf-8');
    log.info(`📝 Updated vercel.json with ${redirects.length} redirects`);
  } catch (error) {
    log.error(`❌ Error updating vercel.json:`, error.message);
  }
}

async function writeGitHubPagesConfig(redirects) {
  const projectRoot = path.join(__dirname, '..');
  const redirectsPath = path.join(projectRoot, 'public', '_redirects');
  const headersPath = path.join(projectRoot, 'public', '_headers');
  
  if (DRY_RUN) {
    log.info('📝 [DRY RUN] Would generate public/_redirects:');
    console.log(generateGitHubPagesConfig(redirects));
    return;
  }
  
  try {
    // Write redirects file
    const config = generateGitHubPagesConfig(redirects);
    await fs.writeFile(redirectsPath, config, 'utf-8');
    log.info(`📝 Updated public/_redirects with ${redirects.length} redirects`);
    
    // Write headers file (for GitHub Pages and Cloudflare Pages)
    // Note: Custom headers require GitHub Pages on a paid plan or GitHub Enterprise
    // Cloudflare Pages supports custom headers on all plans (including free tier)
    const headersContent = `# Custom Headers for GitHub Pages / Cloudflare Pages
# Note: GitHub Pages requires paid plan for custom headers
# Cloudflare Pages supports custom headers on all plans

# HTML files
# Must always revalidate: content-hashed assets are pruned each deploy, so
# cached HTML would reference filenames that no longer exist and 404.
/*.html
  Cache-Control: public, max-age=0, must-revalidate

# CSS files
/*.css
  Cache-Control: public, max-age=31536000, immutable

# JavaScript files
/*.js
  Cache-Control: public, max-age=31536000, immutable

# JSON files
/*.json
  Cache-Control: public, max-age=3600

# XML files
/*.xml
  Cache-Control: public, max-age=3600

# Text files
/*.txt
  Cache-Control: public, max-age=3600

# Pre-compressed files
/*.gz
  Content-Encoding: gzip
  Cache-Control: public, max-age=31536000, immutable

/*.br
  Content-Encoding: br
  Cache-Control: public, max-age=31536000, immutable

# Static assets with long-term caching
/_assets/*
  Cache-Control: public, max-age=31536000, immutable

# WebP images
/*.webp
  Cache-Control: public, max-age=31536000, immutable

# Font files
/*.woff2
  Cache-Control: public, max-age=31536000, immutable

/*.woff
  Cache-Control: public, max-age=31536000, immutable

/*.ttf
  Cache-Control: public, max-age=31536000, immutable

/*.eot
  Cache-Control: public, max-age=31536000, immutable

# Image files
/*.jpg
  Cache-Control: public, max-age=31536000, immutable

/*.jpeg
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=31536000, immutable

/*.gif
  Cache-Control: public, max-age=31536000, immutable

/*.svg
  Cache-Control: public, max-age=31536000, immutable

/*.ico
  Cache-Control: public, max-age=31536000, immutable

# Favicon files
/favicon*
  Cache-Control: public, max-age=31536000, immutable

# All pages - Security headers and Content Security Policy
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cross-Origin-Embedder-Policy: unsafe-none
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://giscus.app https://platform.twitter.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://giscus.app; frame-src 'self' https://www.youtube.com https://giscus.app https://platform.twitter.com; object-src 'none'; base-uri 'self';

# PDF files - allow iframe embedding (override X-Frame-Options for PDFs)
/*.pdf
  Cache-Control: public, max-age=3600
  X-Frame-Options: SAMEORIGIN
`;
    await fs.writeFile(headersPath, headersContent, 'utf-8');
    log.info(`📝 Created public/_headers for GitHub Pages / Cloudflare Pages`);
  } catch (error) {
    log.error(`❌ Error updating GitHub Pages config:`, error.message);
  }
}

async function writeNetlifyConfig(redirects) {
  const projectRoot = path.join(__dirname, '..');
  const netlifyTomlPath = path.join(projectRoot, 'netlify.toml');
  
  if (DRY_RUN) {
    log.info('📝 [DRY RUN] Would generate netlify.toml:');
    console.log(generateNetlifyConfig(redirects));
    return;
  }
  
  try {
    // Read existing netlify.toml to preserve other settings
    let existingContent = '';
    try {
      existingContent = await fs.readFile(netlifyTomlPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, create new one
    }
    
    // Split content at redirects section
    const configLines = existingContent.split('[[redirects]]')[0].trim();
    const redirectConfig = generateNetlifyConfig(redirects);
    
    const newContent = configLines + '\n\n' + redirectConfig;
    await fs.writeFile(netlifyTomlPath, newContent, 'utf-8');
    
    log.info(`📝 Updated netlify.toml with ${redirects.length} redirects`);
  } catch (error) {
    log.error(`❌ Error updating netlify.toml:`, error.message);
  }
}

async function copyAssetsIgnoreFile() {
  const projectRoot = path.join(__dirname, '..');
  const templatePath = path.join(projectRoot, '.assetsignore.template');
  const distPath = path.join(projectRoot, 'dist');
  const assetsIgnorePath = path.join(distPath, '.assetsignore');
  
  if (DRY_RUN) {
    log.info('📝 [DRY RUN] Would copy .assetsignore.template to dist/.assetsignore');
    return;
  }
  
  try {
    // Check if template exists
    try {
      await fs.access(templatePath);
    } catch (error) {
      // Template doesn't exist, that's okay - skip copying (optional file)
      return;
    }
    
    // Check if dist directory exists
    // Note: This script runs before Astro build, so dist may not exist yet
    // That's okay - the file will be copied if dist exists, or can be added manually
    try {
      await fs.access(distPath);
      
      // dist exists, copy the file
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      await fs.writeFile(assetsIgnorePath, templateContent, 'utf-8');
      log.info('📝 Copied .assetsignore to dist/');
    } catch (error) {
      // dist doesn't exist yet - that's fine, it will be created during Astro build
      // The .assetsignore file is optional and mainly for safety
      // Users can manually copy it to dist/ if needed, or it will be there on subsequent builds
    }
  } catch (error) {
    // Non-critical error - just log it
    log.warn(`⚠️  Could not copy .assetsignore file: ${error.message}`);
  }
}

async function writeCloudflareWorkersConfig(projectName) {
  const projectRoot = path.join(__dirname, '..');
  const wranglerTomlPath = path.join(projectRoot, 'wrangler.toml');
  
  if (DRY_RUN) {
    log.info('📝 [DRY RUN] Would generate wrangler.toml:');
    console.log(generateCloudflareWorkersConfig(projectName));
    return;
  }
  
  try {
    // Read existing wrangler.toml to preserve custom settings
    let existingContent = '';
    try {
      existingContent = await fs.readFile(wranglerTomlPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, create new one
    }
    
    // Generate new config with managed fields (Workers format)
    const newConfig = generateCloudflareWorkersConfig(projectName);
    
    if (existingContent) {
      // Update only the fields we manage while preserving everything else
      // Migrate from Pages format (pages_build_output_dir) to Workers format (assets.directory)
      let updatedContent = existingContent;
      
      // Update name field
      updatedContent = updatedContent.replace(/^name\s*=\s*["'][^"']*["']/m, `name = "${projectName}"`);
      if (!updatedContent.match(/^name\s*=/m)) {
        // name doesn't exist, add it at the beginning
        updatedContent = `name = "${projectName}"\n${updatedContent}`;
      }
      
      // Migrate from Pages format to Workers format
      // Remove old pages_build_output_dir if it exists
      updatedContent = updatedContent.replace(/^pages_build_output_dir\s*=\s*["'][^"']*["']\s*\n?/m, '');
      
      // Update or add assets.directory (Workers format)
      if (updatedContent.match(/^\[assets\]/m)) {
        // [assets] section exists, update directory
        updatedContent = updatedContent.replace(/^(\[assets\]\s*\n\s*)directory\s*=\s*["'][^"']*["']/m, `$1directory = "./dist"`);
        if (!updatedContent.match(/^\[assets\]\s*\n\s*directory\s*=/m)) {
          // directory doesn't exist in [assets], add it
          updatedContent = updatedContent.replace(/^(\[assets\]\s*\n)/m, `$1  directory = "./dist"\n`);
        }
        // Ensure not_found_handling is set
        if (!updatedContent.match(/not_found_handling\s*=/m)) {
          updatedContent = updatedContent.replace(/^(\[assets\]\s*\n\s*directory\s*=[^\n]+)/m, `$1\n  not_found_handling = "404-page"  # Serve custom 404 page from src/pages/404.astro`);
        }
      } else {
        // [assets] section doesn't exist, add it after compatibility_date
        const today = new Date();
        const compatibilityDate = today.toISOString().split('T')[0];
        updatedContent = updatedContent.replace(/^compatibility_date\s*=\s*["'][^"']*["']/m, `compatibility_date = "${compatibilityDate}"`);
        if (!updatedContent.match(/^compatibility_date\s*=/m)) {
          // compatibility_date doesn't exist, add both
          updatedContent = updatedContent.replace(/^(name\s*=[^\n]+)/m, `$1\ncompatibility_date = "${compatibilityDate}"`);
        }
        // Add [assets] section
        updatedContent = updatedContent.replace(/^(compatibility_date\s*=[^\n]+)/m, `$1\n\n[assets]\n  directory = "./dist"\n  not_found_handling = "404-page"  # Serve custom 404 page from src/pages/404.astro`);
      }
      
      // Update compatibility_date field
      const today = new Date();
      const compatibilityDate = today.toISOString().split('T')[0];
      updatedContent = updatedContent.replace(/^compatibility_date\s*=\s*["'][^"']*["']/m, `compatibility_date = "${compatibilityDate}"`);
      
      // Remove old [build] section if it exists (not needed for Workers)
      updatedContent = updatedContent.replace(/\n*\[build\]\s*\n\s*command\s*=\s*["'][^"']*["']\s*\n*/g, '\n');
      
      await fs.writeFile(wranglerTomlPath, updatedContent, 'utf-8');
      log.info(`📝 Updated wrangler.toml (Workers format, preserved custom settings)`);
    } else {
      // File doesn't exist, create new one with Workers format
      await fs.writeFile(wranglerTomlPath, newConfig, 'utf-8');
      log.info(`📝 Created wrangler.toml (Workers format)`);
    }
  } catch (error) {
    log.error(`❌ Error updating wrangler.toml:`, error.message);
  }
}

// Validation functions
function validateVercelConfig(redirects) {
  const config = JSON.parse(generateVercelConfig(redirects));
  
  // Validate redirects
  for (const redirect of config.redirects) {
    if (!redirect.source || !redirect.destination) {
      throw new Error(`Invalid Vercel redirect: ${JSON.stringify(redirect)}`);
    }
  }
  
  log.info('✅ Vercel configuration is valid');
  return true;
}

function validateGitHubPagesConfig(redirects) {
  const config = generateGitHubPagesConfig(redirects);
  
  // Basic validation - check format (no '!' suffix - direct redirects)
  const lines = config.trim().split('\n');
  for (const line of lines) {
    if (line.trim() && !line.match(/^[^\s]+\s+[^\s]+\s+\d+$/)) {
      throw new Error(`Invalid GitHub Pages redirect format: ${line}`);
    }
  }
  
  log.info('✅ GitHub Pages configuration is valid');
  return true;
}

function validateNetlifyConfig(redirects) {
  const config = generateNetlifyConfig(redirects);
  
  // Basic validation - check TOML-like format
  if (!config.includes('[[redirects]]')) {
    throw new Error('Invalid Netlify configuration format');
  }
  
  log.info('✅ Netlify configuration is valid');
  return true;
}

// Main function
async function generateRedirects() {
  log.info(`🔄 Generating redirects from content aliases for ${DEPLOYMENT_PLATFORM}...`);
  
  if (VALIDATE_ONLY) {
    log.info('🔍 Validation mode - checking all platform configurations...');
  }
  
  // Get project name from package.json for Cloudflare Workers
  const projectRoot = path.join(__dirname, '..');
  let projectName = 'astro-modular';
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    projectName = packageJson.name || 'astro-modular';
  } catch (error) {
    // Use default if package.json can't be read
  }
  
  let allRedirects = [];
  let totalProcessedFiles = 0;
  
  // Process pages
  const pagesPath = path.join(projectRoot, 'src/content/pages');
  try {
    await fs.access(pagesPath);
    const pageResult = await processDirectory(pagesPath, false);
    allRedirects = allRedirects.concat(pageResult.redirects);
    totalProcessedFiles += pageResult.processedFiles;
  } catch (error) {
    // Pages directory doesn't exist, skipping
  }
  
  // Process posts
  const postsPath = path.join(projectRoot, 'src/content/posts');
  try {
    await fs.access(postsPath);
    const postResult = await processDirectory(postsPath, true);
    allRedirects = allRedirects.concat(postResult.redirects);
    totalProcessedFiles += postResult.processedFiles;
  } catch (error) {
    // Posts directory doesn't exist, skipping
  }
  
  // Process projects
  const projectsPath = path.join(projectRoot, 'src/content/projects');
  try {
    await fs.access(projectsPath);
    const projectResult = await processDirectory(projectsPath, false);
    allRedirects = allRedirects.concat(projectResult.redirects);
    totalProcessedFiles += projectResult.processedFiles;
  } catch (error) {
    // Projects directory doesn't exist, skipping
  }
  
  // Process docs
  const docsPath = path.join(projectRoot, 'src/content/docs');
  try {
    await fs.access(docsPath);
    const docResult = await processDirectory(docsPath, false);
    allRedirects = allRedirects.concat(docResult.redirects);
    totalProcessedFiles += docResult.processedFiles;
  } catch (error) {
    // Docs directory doesn't exist, skipping
  }
  
  if (allRedirects.length > 0) {
    log.info(`📁 Processing pages directory...`);
    log.info(`📁 Processing posts directory...`);
    log.info(`📁 Processing projects directory...`);
    log.info(`📁 Processing docs directory...`);
    log.info(`   Processed ${totalProcessedFiles} files with redirects`);
    
    // Update Astro config with redirects (only used in dev mode - instant HTTP redirects)
    // In production builds, redirects are set to {} to prevent HTML meta refresh files
    await updateAstroConfig(allRedirects);
    
    // Generate platform-specific configs
    if (VALIDATE_ONLY) {
      // Validate all platforms
      validateVercelConfig(allRedirects);
      validateGitHubPagesConfig(allRedirects);
      validateNetlifyConfig(allRedirects);
      log.info('🎉 All platform configurations are valid!');
      return;
    }
    
    // Clean up files from other platforms before generating new config
    // This ensures we only have config files for the selected platform
    await cleanupOtherPlatformFiles(DEPLOYMENT_PLATFORM);
    
    // Write platform-specific config - only generate files needed for the selected platform
    // IMPORTANT: We use platform-specific redirect files (HTTP redirects) for production
    // Astro config redirects are only active in dev mode (instant HTTP redirects)
    // In production builds, Astro redirects are set to {} to prevent HTML meta refresh files
    switch (DEPLOYMENT_PLATFORM) {
      case 'vercel':
        // Vercel: Uses vercel.json for instant HTTP redirects
        // No Astro config needed - Vercel handles redirects at edge level
        await writeVercelConfig(allRedirects);
        break;
      case 'github-pages':
        // GitHub Pages: Uses _redirects file for instant HTTP redirects
        // No Astro config needed - would create slow meta refresh HTML files
        await writeGitHubPagesConfig(allRedirects);
        break;
      case 'cloudflare-workers':
        // Cloudflare Workers: Uses _redirects file for instant HTTP redirects
        // See migration guide: https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
        // No Astro config needed - would create slow meta refresh HTML files
        // Generate Workers-compatible wrangler.toml (uses assets.directory instead of pages_build_output_dir)
        await writeGitHubPagesConfig(allRedirects); // Uses same _redirects/_headers format
        await writeCloudflareWorkersConfig(projectName); // Generate Workers-compatible config
        await copyAssetsIgnoreFile(); // Copy .assetsignore to dist/ for Workers
        break;
      case 'netlify':
      default:
        // Netlify: Uses netlify.toml for instant HTTP redirects
        // No Astro config needed - Netlify handles redirects at edge level
        await writeNetlifyConfig(allRedirects);
        break;
    }
  }
  
  if (DRY_RUN) {
    log.info('🎉 [DRY RUN] Redirect generation complete! No files were modified.');
  } else {
    log.info(`🎉 Redirect generation complete! Created ${allRedirects.length} redirects for ${DEPLOYMENT_PLATFORM}.`);
  }
}

// Run the script
generateRedirects();
