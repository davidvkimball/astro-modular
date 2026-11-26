#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

// Simple logging utility
const isDev = process.env.NODE_ENV !== 'production';
const log = {
  info: (...args) => isDev && console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args)
};

// Define source and target directories for posts, pages, projects, docs, and special
const IMAGE_SYNC_CONFIGS = [
  {
    source: 'src/content/posts/attachments',
    target: 'public/posts/attachments',
    name: 'posts'
  },
  {
    source: 'src/content/pages/attachments',
    target: 'public/pages/attachments',
    name: 'pages'
  },
  {
    source: 'src/content/projects/attachments',
    target: 'public/projects/attachments',
    name: 'projects'
  },
  {
    source: 'src/content/docs/attachments',
    target: 'public/docs/attachments',
    name: 'docs'
  },
  {
    source: 'src/content/special/attachments',
    target: 'public/special/attachments',
    name: 'special'
  }
];

// Every file a note can embed or link to that gets published beside it. Images become WebP; everything else, including downloads, is copied as is.
const SYNCED_FILE = /\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|tiff|tif|ico|mp3|wav|ogg|m4a|3gp|flac|aac|opus|mp4|m4v|webm|ogv|mov|mkv|avi|vtt|srt|pdf|zip|7z|rar|tar|gz|tgz|txt|csv|tsv|json|xml|ics|rtf|doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp|epub|mobi|key|numbers|pages)$/i;

// Recursively find all media files in a directory (images, audio, video, PDF)
async function findImageFiles(dir, relativePath = '') {
  const imageFiles = [];
  
  try {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const itemRelativePath = path.join(relativePath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Recursively search subdirectories
        const subImages = await findImageFiles(itemPath, itemRelativePath);
        imageFiles.push(...subImages);
      } else if (SYNCED_FILE.test(item)) {
        // Skip WebP files if we already have the original (to avoid duplicate processing)
        // We'll generate WebP from originals
        if (item.toLowerCase().endsWith('.webp')) {
          const originalName = item.replace(/\.webp$/i, '');
          const hasOriginal = items.some(i => {
            const nameWithoutExt = i.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '');
            return nameWithoutExt === originalName && /\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(i);
          });
          if (hasOriginal) {
            // Skip WebP if we have the original - we'll generate it
            continue;
          }
        }
        imageFiles.push({
          sourcePath: itemPath,
          relativePath: itemRelativePath
        });
      }
    }
  } catch (error) {
    // Directory might not exist or be readable, continue
    if (error.code !== 'ENOENT') {
      log.warn(`Warning: Could not read directory ${dir}:`, error.message);
    }
  }
  
  return imageFiles;
}

// Function to find folder-based content and sync their images
async function syncFolderBasedImages(contentType) {
  const contentDir = `src/content/${contentType}`;
  const publicContentDir = `public/${contentType}`;
  
  try {
    const items = await fs.readdir(contentDir);
    let totalSynced = 0;
    let totalSkipped = 0;
    
    for (const item of items) {
      const itemPath = path.join(contentDir, item);
      const stat = await fs.stat(itemPath);
      
      // Check if it's a directory (folder-based content)
      if (stat.isDirectory()) {
        const targetDir = path.join(publicContentDir, item);
        
        // Find all media files recursively
        const imageFiles = await findImageFiles(itemPath);
        
        for (const imageFile of imageFiles) {
          // Handle attachments subfolder within folder-based content
          // Convert src/content/posts/post-name/attachments/image.png -> public/posts/post-name/image.png
          let targetRelativePath = imageFile.relativePath;
          // Handle both forward and backward slashes for cross-platform compatibility
          if (targetRelativePath.startsWith('attachments/') || targetRelativePath.startsWith('attachments\\')) {
            targetRelativePath = targetRelativePath.replace(/^attachments[/\\]/, '');
          }
          
          const targetPath = path.join(targetDir, targetRelativePath);
          const targetDirForFile = path.dirname(targetPath);
          
          // Ensure target directory exists
          await ensureDir(targetDirForFile);
          
          // Check if file needs updating - check both original and WebP versions
          let needsUpdate = true;
          
          // Check if this is an image that would be converted to WebP
          if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(imageFile.relativePath)) {
            const webpPath = path.join(targetDir, targetRelativePath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp'));
            try {
              const sourceStats = await fs.stat(imageFile.sourcePath);
              const webpStats = await fs.stat(webpPath);
              // Only update if source is newer than WebP
              needsUpdate = sourceStats.mtime > webpStats.mtime;
            } catch {
              // WebP doesn't exist, needs update
              needsUpdate = true;
            }
          } else {
            try {
              const sourceStats = await fs.stat(imageFile.sourcePath);
              const targetStats = await fs.stat(targetPath);
              // Only update if source is newer or different size
              needsUpdate = sourceStats.mtime > targetStats.mtime || sourceStats.size !== targetStats.size;
            } catch {
              // Target doesn't exist, definitely needs update
              needsUpdate = true;
            }
          }
          
          if (needsUpdate) {
            // Optimize image if it's an image format (not audio, video, or PDF)
            if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(imageFile.relativePath)) {
              try {
                // Convert to WebP and optimize
                const webpPath = targetPath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
                await sharp(imageFile.sourcePath)
                  .webp({ quality: 85 })
                  .toFile(webpPath);
                totalSynced++;
              } catch (error) {
                // If Sharp fails, fall back to copying original
                log.warn(`⚠️  Could not optimize ${imageFile.relativePath}, copying original:`, error.message);
                await fs.copyFile(imageFile.sourcePath, targetPath);
                totalSynced++;
              }
            } else {
              // Non-image files (audio, video, PDF) - just copy as-is
              await fs.copyFile(imageFile.sourcePath, targetPath);
              totalSynced++;
            }
          } else {
            totalSkipped++;
          }
        }
      }
    }
    
    if (totalSynced > 0 || totalSkipped > 0) {
      log.info(`📁 Syncing folder-based ${contentType} images...`);
      if (totalSynced > 0) log.info(`   Synced ${totalSynced} files`);
      if (totalSkipped > 0) log.info(`   Skipped ${totalSkipped} files that were unchanged`);
    }
    
    return { synced: totalSynced, skipped: totalSkipped };
  } catch (error) {
    log.error(`❌ Error syncing folder-based ${contentType} images:`, error);
    return { synced: 0, skipped: 0 };
  }
}

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function syncImagesForConfig(config) {
  // Ensure target directory exists
  await ensureDir(config.target);

  try {
    // Check if source directory exists
    let sourceFiles = [];
    try {
      sourceFiles = await fs.readdir(config.source);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { synced: 0, skipped: 0, removed: 0 };
      }
      throw error;
    }

    // Find all image files recursively (including subdirectories)
    const imageFiles = await findImageFiles(config.source);
    
    let synced = 0;
    let skipped = 0;

    for (const imageFile of imageFiles) {
      const targetPath = path.join(config.target, imageFile.relativePath);
      const targetDirForFile = path.dirname(targetPath);
      
      // Ensure target directory exists (including subdirectories)
      await ensureDir(targetDirForFile);

      // Check if file needs updating - check both original and WebP versions
      let needsUpdate = true;
      
      // Check if this is an image that would be converted to WebP
      if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(imageFile.relativePath)) {
        const webpPath = targetPath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
        try {
          const sourceStats = await fs.stat(imageFile.sourcePath);
          const webpStats = await fs.stat(webpPath);
          // Only update if source is newer than WebP
          needsUpdate = sourceStats.mtime > webpStats.mtime;
        } catch {
          // WebP doesn't exist, needs update
          needsUpdate = true;
        }
      } else {
        try {
          const sourceStats = await fs.stat(imageFile.sourcePath);
          const targetStats = await fs.stat(targetPath);
          // Only update if source is newer or different size
          needsUpdate = sourceStats.mtime > targetStats.mtime || sourceStats.size !== targetStats.size;
        } catch {
          // Target doesn't exist, definitely needs update
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        // Optimize image if it's an image format (not audio, video, or PDF)
        if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(imageFile.relativePath)) {
          try {
            // Convert to WebP and optimize
            const webpPath = targetPath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
            await sharp(imageFile.sourcePath)
              .webp({ quality: 85 })
              .toFile(webpPath);
            synced++;
          } catch (error) {
            // If Sharp fails, fall back to copying original
            log.warn(`⚠️  Could not optimize ${imageFile.relativePath}, copying original:`, error.message);
            await fs.copyFile(imageFile.sourcePath, targetPath);
            synced++;
          }
        } else {
          // Non-image files (audio, video, PDF) - just copy as-is
          await fs.copyFile(imageFile.sourcePath, targetPath);
          synced++;
        }
      } else {
        skipped++;
      }
    }

    // Cleanup: Remove files from target that no longer exist in source
    // We need to recursively clean up the target directory
    await cleanupTargetDirectory(config.target, imageFiles);

    return { synced, skipped, removed: 0 }; // removed count handled in cleanup function
  } catch (error) {
    log.error(`❌ Error syncing ${config.name} images:`, error);
    process.exit(1);
  }
}

// Recursively clean up target directory, removing files that no longer exist in source
async function cleanupTargetDirectory(targetDir, sourceImageFiles) {
  // Create a set that maps both original paths and attachments subfolder paths
  const sourceFileSet = new Set();
  sourceImageFiles.forEach(f => {
    sourceFileSet.add(f.relativePath);
    // Also add the path without attachments/ prefix for cleanup
    if (f.relativePath.startsWith('attachments/') || f.relativePath.startsWith('attachments\\')) {
      sourceFileSet.add(f.relativePath.replace(/^attachments[/\\]/, ''));
    }
    // Add WebP version of image paths (since we generate WebP from originals)
    if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(f.relativePath)) {
      const webpPath = f.relativePath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
      sourceFileSet.add(webpPath);
      if (f.relativePath.startsWith('attachments/') || f.relativePath.startsWith('attachments\\')) {
        const webpPathNoAttachments = webpPath.replace(/^attachments[/\\]/, '');
        sourceFileSet.add(webpPathNoAttachments);
      }
    }
  });
  let removed = 0;

  try {
    const items = await fs.readdir(targetDir);
    
    for (const item of items) {
      const itemPath = path.join(targetDir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Recursively clean subdirectories
        const subRemoved = await cleanupTargetDirectory(itemPath, sourceImageFiles);
        removed += subRemoved;
        
        // Remove empty directories
        try {
          const remainingItems = await fs.readdir(itemPath);
          if (remainingItems.length === 0) {
            await fs.rmdir(itemPath);
          }
        } catch {
          // Directory might not be empty or might have been removed already
        }
      } else {
        // Check if this file exists in source
        const relativePath = path.relative(targetDir, itemPath).replace(/\\/g, '/');
        if (!sourceFileSet.has(relativePath)) {
          await fs.unlink(itemPath);
          removed++;
        }
      }
    }
  } catch (error) {
    // Directory might not exist or be readable
    if (error.code !== 'ENOENT') {
      log.warn(`Warning: Could not clean directory ${targetDir}:`, error.message);
    }
  }
  
  return removed;
}

async function syncAllImages() {
  log.info('🖼️ Syncing images from content to public directory...');

  for (const config of IMAGE_SYNC_CONFIGS) {
    const result = await syncImagesForConfig(config);
    if (result.synced > 0 || result.skipped > 0) {
      log.info(`📁 Syncing ${config.name} images...`);
      if (result.synced > 0) log.info(`   Synced ${result.synced} files`);
      if (result.skipped > 0) log.info(`   Skipped ${result.skipped} files that were unchanged`);
    }
  }

  // Sync folder-based images for all content types
  const contentTypes = ['posts', 'pages', 'projects', 'docs', 'special'];
  for (const contentType of contentTypes) {
    await syncFolderBasedImages(contentType);
  }

  log.info('🎉 Image sync complete!');
}

syncAllImages();