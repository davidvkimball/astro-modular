import fs from "node:fs";
import path from "node:path";
import type { ImageInfo, OpenGraphImage } from "@/types";
import { siteConfig } from "@/config";

// Process images for responsive layouts
export function processImageLayout(images: ImageInfo[]): {
  layout: "single" | "grid-2" | "grid-3" | "grid-4";
  images: ImageInfo[];
} {
  const count = images.length;

  if (count === 1) {
    return { layout: "single", images };
  } else if (count === 2) {
    return { layout: "grid-2", images };
  } else if (count === 3) {
    return { layout: "grid-3", images };
  } else if (count >= 4) {
    return { layout: "grid-4", images: images.slice(0, 4) };
  }

  return { layout: "single", images };
}

// Extract images from markdown content
export function extractImagesFromContent(content: string): ImageInfo[] {
  // Updated regex to capture title/caption: ![alt](src "title")
  const imageRegex = /!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g;
  const images: ImageInfo[] = [];
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const [, alt, src, title] = match;
    images.push({
      src: src.trim(),
      alt: alt.trim() || "Image",
      caption: title ? title.trim() : undefined,
    });
  }

  return images;
}

// Find consecutive images in markdown
export function findConsecutiveImages(content: string): Array<{
  images: ImageInfo[];
  startIndex: number;
  endIndex: number;
}> {
  const lines = content.split("\n");
  const imageGroups: Array<{
    images: ImageInfo[];
    startIndex: number;
    endIndex: number;
  }> = [];

  let currentGroup: ImageInfo[] = [];
  let groupStart = -1;

  lines.forEach((line, index) => {
    const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);

    if (imageMatch) {
      const [, alt, src] = imageMatch;

      if (currentGroup.length === 0) {
        groupStart = index;
      }

      currentGroup.push({
        src: src.trim(),
        alt: alt.trim() || "Image",
      });
    } else if (line.trim() === "" && currentGroup.length > 0) {
      // Empty line, continue group
      return;
    } else {
      // Non-image, non-empty line - end current group
      if (currentGroup.length > 1) {
        imageGroups.push({
          images: [...currentGroup],
          startIndex: groupStart,
          endIndex: index - 1,
        });
      }
      currentGroup = [];
      groupStart = -1;
    }
  });

  // Handle group at end of content
  if (currentGroup.length > 1) {
    imageGroups.push({
      images: [...currentGroup],
      startIndex: groupStart,
      endIndex: lines.length - 1,
    });
  }

  return imageGroups;
}

// Optimize image path for Astro
export function optimizeImagePath(imagePath: string): string {
  // Handle different image path formats
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath; // External URL
  }

  if (imagePath.startsWith("/")) {
    return imagePath; // Absolute path
  }

  // Relative path - ensure it starts with /
  return `/${imagePath}`;
}

// Optimize image path specifically for pages
export function optimizePageImagePath(imagePath: string): string {
  // Handle null, undefined, or empty strings
  if (!imagePath || typeof imagePath !== "string") {
    return "/pages/attachments/placeholder.jpg"; // Fallback to placeholder
  }

  // Strip Obsidian brackets first
  const cleanPath = stripObsidianBrackets(imagePath.trim());

  // Handle empty path after cleaning
  if (!cleanPath) {
    return "/pages/attachments/placeholder.jpg";
  }

  // Handle different image path formats
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath; // External URL
  }

  if (cleanPath.startsWith("/")) {
    return cleanPath; // Absolute path
  }

  // Prevent double processing - if already optimized, convert to WebP and return
  if (cleanPath.startsWith("/pages/attachments/")) {
    return getOptimizedFormat(cleanPath);
  }

  // Handle Obsidian-style relative paths from markdown content
  if (cleanPath.startsWith("./images/")) {
    const attachPath = cleanPath.replace("./images/", "/pages/attachments/");
    return getOptimizedFormat(attachPath);
  }

  if (cleanPath.startsWith("images/")) {
    const pagePath = `/pages/${cleanPath}`;
    return getOptimizedFormat(pagePath);
  }

  // Handle case where filename is provided without path
  if (!cleanPath.includes("/")) {
    const attachPath = `/pages/attachments/${cleanPath}`;
    return getOptimizedFormat(attachPath);
  }

  // Default - assume it's a relative path in the pages directory
  const finalPath = `/pages/attachments/${cleanPath}`;
  
  // Convert to WebP if applicable (sync-images.js creates WebP versions)
  return getOptimizedFormat(finalPath);
}

// Strip Obsidian double bracket syntax from image paths
export function stripObsidianBrackets(imagePath: string): string {
  if (!imagePath) return imagePath;

  // Remove double brackets if present
  if (imagePath.startsWith("[[") && imagePath.endsWith("]]")) {
    return imagePath.slice(2, -2);
  }

  return imagePath;
}

// Collections with an `image` (cover) field, named by their src/content/ folder
export type CoverCollection = "posts" | "pages" | "projects" | "docs";

export interface CoverImage {
  // Where the cover is served, or the web URL it points to
  url: string;
  // ImageWrapper props: the URL's folder and file name. A web URL goes in src
  // whole, with an empty basePath.
  basePath: string;
  src: string;
}

const contentDir = path.join(process.cwd(), "src", "content");

// Whether a file exists in the vault, given its path under src/content/
function isVaultFile(...segments: string[]): boolean {
  const stat = fs.statSync(path.join(contentDir, ...segments), { throwIfNoEntry: false });
  return stat?.isFile() ?? false;
}

/**
 * Resolve an `image` frontmatter value to the URL scripts/sync-images.js
 * publishes the cover at. Cards, layouts, preload links, Open Graph tags and
 * the RSS feed all use this, and scripts/check-missing-images.js mirrors it.
 *
 * - Web URLs are used as they are, and absolute paths only get the WebP
 *   extension inside the collection folders, where sync converts images.
 * - attachments/cover.png looks in the entry's own attachments/ folder first,
 *   which is what Obsidian's relative links mean in folder-based content, then
 *   in the collection's shared attachments/ folder.
 * - Any other relative path, such as cover.png, is in the entry's folder.
 *   images/ is the old name for attachments/ and is dropped.
 */
export function resolveCoverImage(
  image: unknown,
  collection: CoverCollection,
  entryId?: string
): CoverImage | null {
  // The content schema already takes the first item of a list
  const value = Array.isArray(image) ? image[0] : image;
  if (typeof value !== "string") return null;
  const ref = stripObsidianBrackets(value.trim()).trim();
  if (!ref) return null;

  // Web URLs, including protocol-relative ones
  if (/^([a-z][a-z\d+.-]*:|\/\/)/i.test(ref)) {
    return { url: ref, basePath: "", src: ref };
  }

  let url: string;
  const rel = path.posix.normalize(ref);
  if (rel.startsWith("/")) {
    url = rel;
  } else if (rel.startsWith("attachments/")) {
    const file = rel.slice("attachments/".length);
    if (entryId && isVaultFile(collection, ...entryId.split("/"), "attachments", ...file.split("/"))) {
      // Sync flattens the attachments/ folder of a top-level entry folder only
      url = entryId.includes("/")
        ? `/${collection}/${entryId}/attachments/${file}`
        : `/${collection}/${entryId}/${file}`;
    } else {
      url = `/${collection}/attachments/${file}`;
    }
  } else {
    const file = rel.replace(/^images\//, "");
    url = entryId ? `/${collection}/${entryId}/${file}` : `/${collection}/attachments/${file}`;
  }
  // Resolve ../ segments, such as ../attachments/cover.png in folder-based content
  url = path.posix.normalize(url);

  // Sync converts images in the collection folders to WebP
  if (/^\/(posts|pages|projects|docs|special)\//.test(url)) {
    url = getOptimizedFormat(url);
  }

  const slash = url.lastIndexOf("/");
  return { url, basePath: url.slice(0, slash + 1), src: url.slice(slash + 1) };
}

// Optimize image path specifically for posts
export function optimizePostImagePath(
  imagePath: string,
  postSlug?: string,
  postId?: string
): string {
  return resolveCoverImage(imagePath, "posts", postSlug ?? postId)?.url
    ?? "/posts/attachments/placeholder.jpg";
}

// Generic image optimization function for all content types
export function optimizeContentImagePath(
  imagePath: string,
  contentType: "posts" | "projects" | "documentation" | "pages",
  contentSlug?: string,
  contentId?: string
): string {
  // Map content types to their URL paths
  const urlPath = contentType === "documentation" ? "docs" : contentType;
  return resolveCoverImage(imagePath, urlPath, contentSlug ?? contentId)?.url
    ?? `/${urlPath}/attachments/placeholder.jpg`;
}

// Generate responsive image srcset
export function generateSrcSet(
  imagePath: string,
  widths: number[] = [320, 640, 768, 1024, 1280]
): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath; // Can't generate srcset for external images
  }

  const basePath = imagePath.replace(/\.[^.]+$/, ""); // Remove extension
  const extension = imagePath.match(/\.[^.]+$/)?.[0] || ".jpg";

  return widths
    .map((width) => `${basePath}-${width}w${extension} ${width}w`)
    .join(", ");
}

// Get image dimensions (placeholder for actual implementation)
export async function getImageDimensions(
  imagePath: string
): Promise<{ width: number; height: number } | null> {
  // This would typically use a library to get actual image dimensions
  // For now, return null to indicate dimensions are unknown
  return null;
}

// Get the default OG image
export function getDefaultOGImage(): OpenGraphImage {
  return {
    url: "/open-graph.png",
    alt: siteConfig.defaultOgImageAlt,
    width: 1200,
    height: 630,
  };
}

// Check if image is external
export function isExternalImage(imagePath: string): boolean {
  return imagePath.startsWith("http://") || imagePath.startsWith("https://");
}

// Get fallback OG image
export function getFallbackOGImage(site?: URL): OpenGraphImage {
  const baseUrl = site ? site.toString() : siteConfig.site;
  return {
    url: `${baseUrl}/open-graph.png`,
    alt: siteConfig.defaultOgImageAlt,
    width: 1200,
    height: 630,
  };
}

// Get image alt text with fallback
export function getImageAlt(
  image: ImageInfo,
  fallback: string = "Image"
): string {
  return image.alt && image.alt.trim() !== "" ? image.alt : fallback;
}

// Process images for lightbox
export function processImagesForLightbox(images: ImageInfo[]): ImageInfo[] {
  return images.map((image) => ({
    ...image,
    src: optimizeImagePath(image.src),
    alt: getImageAlt(image),
  }));
}

// Create image gallery data
export function createImageGallery(images: ImageInfo[], layout: string) {
  return {
    images: processImagesForLightbox(images),
    layout,
    count: images.length,
    hasMultiple: images.length > 1,
  };
}

// Validate image format
export function isValidImageFormat(imagePath: string): boolean {
  const validExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|ico)$/i;
  return validExtensions.test(imagePath);
}

// Get MIME type from file extension
export function getMimeTypeFromPath(imagePath: string): string {
  const extension = imagePath.toLowerCase().match(/\.([^.]+)$/)?.[1];

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "bmp":
      return "image/bmp";
    case "tiff":
    case "tif":
      return "image/tiff";
    case "ico":
      return "image/x-icon";
    default:
      return "image/jpeg"; // Safe fallback
  }
}

// Get optimized image format
// Converts image paths to WebP format (sync-images.js creates WebP versions)
export function getOptimizedFormat(imagePath: string): string {
  // Don't convert external URLs, SVG, or already WebP files
  if (!imagePath || 
      imagePath.startsWith("http") || 
      imagePath.toLowerCase().endsWith(".svg") ||
      imagePath.toLowerCase().endsWith(".webp")) {
    return imagePath;
  }

  // Convert supported image formats to WebP
  // sync-images.js creates WebP versions of JPG/PNG/GIF/etc during build
  return imagePath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, ".webp");
}

// Check if image format can be optimized
export function canOptimizeImageFormat(imagePath: string): boolean {
  const extension = imagePath.toLowerCase().match(/\.([^.]+)$/)?.[1];
  // SVG and WebP don't need optimization, ICO is usually small
  return !["svg", "webp", "ico"].includes(extension || "");
}
