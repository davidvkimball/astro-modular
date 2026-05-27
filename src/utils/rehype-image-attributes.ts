import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin to add loading attributes and optimize image paths in markdown content
 * Adds lazy loading attributes and converts image paths to WebP versions when available
 */
export function rehypeImageAttributes() {
  return (tree: Root) => {
    // First pass: collect img nodes so we can identify the first one
    // (the LCP candidate on posts that hide the cover image).
    const imgNodes: Element[] = [];
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'img') imgNodes.push(node);
    });

    imgNodes.forEach((node, index) => {
      const properties = node.properties || {};
      const src = (properties.src as string) || '';

      // Convert image paths to WebP if available
      // The sync script generates WebP versions of JPG/PNG files
      // Only convert if path doesn't already end with .webp (remarkFolderImages may have already converted it)
      if (src && typeof src === 'string' && !src.startsWith('http') && !src.toLowerCase().endsWith('.webp') && !src.toLowerCase().endsWith('.svg')) {
        // Check if this is an image format that would have been converted to WebP
        if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(src)) {
          // Replace extension with .webp
          // Note: remarkFolderImages should have already set the correct path with collection prefix
          // This is a fallback for any images that weren't processed by remarkFolderImages
          properties.src = src.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
        }
      }

      // The first body image is the LCP candidate when the post hides the
      // cover image (hideCoverImage: true). Mark it eager + high priority
      // so it isn't deferred by default lazy loading. Posts with a cover
      // image already have fetchpriority="high" on the cover, which still
      // wins the bandwidth race.
      if (index === 0) {
        if (!properties.loading) properties.loading = 'eager';
        if (!properties.fetchpriority) properties.fetchpriority = 'high';
      } else {
        if (!properties.loading) properties.loading = 'lazy';
      }

      // Add decoding="async" if not already set
      if (!properties.decoding) {
        properties.decoding = 'async';
      }

      // Ensure alt text is present
      if (!properties.alt) {
        properties.alt = '';
      }
    });
  };
}

export default rehypeImageAttributes;