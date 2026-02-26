import type { Post, PostData, ReadingTime, Heading } from "@/types";
import { render } from "astro:content";

// Check if a date is valid (not January 1, 1970 or invalid)
export function isValidDate(date: Date): boolean {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }

  // Check if it's January 1, 1970 (Unix epoch)
  const epoch = new Date(0);
  return date.getTime() > epoch.getTime();
}

// Process markdown content and extract data
export function processMarkdown(content: string): {
  excerpt: string;
  wordCount: number;
  hasMore: boolean;
} {
  // Handle empty or undefined content
  if (!content || typeof content !== "string") {
    return {
      excerpt: "",
      wordCount: 0,
      hasMore: false,
    };
  }

  // Remove frontmatter
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, "");

  // Remove markdown syntax for word counting and excerpt
  const plainText = withoutFrontmatter
    .replace(/!\[.*?\]\(.*?\)/g, "") // Images
    .replace(/\[.*?\]\(.*?\)/g, "$1") // Links
    .replace(/`{1,3}.*?`{1,3}/gs, "") // Code
    .replace(/#{1,6}\s+/g, "") // Headers
    .replace(/[*_~`]/g, "") // Emphasis
    .replace(/\n+/g, " ") // Line breaks
    .trim();

  const words = plainText.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  // Create excerpt (first 150 words or until first heading)
  const excerptWords = words.slice(0, 150);
  const excerpt = excerptWords.join(" ");
  const hasMore = wordCount > 150;

  return {
    excerpt: hasMore ? excerpt + "..." : excerpt,
    wordCount,
    hasMore,
  };
}

// Calculate reading time manually
export function calculateReadingTime(content: string): ReadingTime {
  // Handle empty or undefined content
  if (!content || typeof content !== "string") {
    return {
      text: "1 min read",
      minutes: 1,
      time: 60000,
      words: 0,
    };
  }

  // Remove frontmatter and markdown syntax for accurate word counting
  const plainText = content
    .replace(/^---\n[\s\S]*?\n---\n/, "") // Remove frontmatter
    .replace(/!\[.*?\]\(.*?\)/g, "") // Images
    .replace(/\[.*?\]\(.*?\)/g, "$1") // Links
    .replace(/`{1,3}.*?`{1,3}/gs, "") // Code blocks
    .replace(/#{1,6}\s+/g, "") // Headers
    .replace(/[*_~`]/g, "") // Emphasis
    .replace(/\n+/g, " ") // Line breaks
    .trim();

  const words = plainText.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  // Average reading speed is 200-250 words per minute, using 225
  const wordsPerMinute = 225;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

  return {
    text: `${minutes} min read`,
    minutes: minutes,
    time: minutes * 60 * 1000, // in milliseconds
    words: wordCount,
  };
}

// Get mobile-friendly reading time text
export function getReadingTimeMobile(readingTime: ReadingTime): string {
  return `${readingTime.minutes} min`;
}

// Extract reading time from remark plugin or calculate manually
export function getReadingTime(
  remarkData: any,
  content?: string
): ReadingTime | null {
  // Validate remark plugin reading time data
  if (
    remarkData?.readingTime &&
    typeof remarkData.readingTime === "object" &&
    remarkData.readingTime.text &&
    typeof remarkData.readingTime.text === "string" &&
    remarkData.readingTime.text !== "read0" &&
    typeof remarkData.readingTime.minutes === "number" &&
    typeof remarkData.readingTime.time === "number" &&
    typeof remarkData.readingTime.words === "number"
  ) {
    return {
      text: remarkData.readingTime.text,
      minutes: remarkData.readingTime.minutes,
      time: remarkData.readingTime.time,
      words: remarkData.readingTime.words,
    };
  }

  // Fallback to manual calculation if content is provided
  if (content !== undefined) {
    return calculateReadingTime(content);
  }

  // Default for no content and no valid remark data
  return {
    text: "1 min read",
    minutes: 1,
    time: 60000,
    words: 0,
  };
}

// Generate table of contents from headings
export async function generateTOC(headings: Heading[]): Promise<Heading[]> {
  const { getTableOfContentsDepth } = await import("@/config");
  const maxDepth = getTableOfContentsDepth();
  return headings.filter(
    (heading) => heading.depth >= 2 && heading.depth <= maxDepth
  );
}

// Process content data for display (posts, projects, docs, etc.)
export async function processPost(post: any) {
  const { Content, headings, remarkPluginFrontmatter } = await render(post);
  const { excerpt, wordCount, hasMore } = processMarkdown(post.body || "");
  const readingTime = getReadingTime(remarkPluginFrontmatter, post.body || ""); // Pass post.body as fallback
  const toc = await generateTOC(headings);

  return {
    ...post,
    Content,
    headings,
    excerpt,
    wordCount,
    hasMore,
    readingTime,
    toc,
    remarkPluginFrontmatter,
  };
}

// Format date for display
export function formatDate(date: Date): string {
  // If the date is at midnight UTC, it was likely a YYYY-MM-DD date
  // that was parsed as UTC but should be treated as local
  if (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0
  ) {
    // Create a new date in local timezone using the UTC date components
    const localDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    return localDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format date for mobile display (shorter format)
export function formatDateMobile(date: Date): string {
  // If the date is at midnight UTC, it was likely a YYYY-MM-DD date
  // that was parsed as UTC but should be treated as local
  if (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0
  ) {
    // Create a new date in local timezone using the UTC date components
    const localDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    return localDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format date for ISO string
export function formatDateISO(date: Date): string {
  return date.toISOString();
}

// Helper to check if we're in development mode (not preview or production)
// import.meta.env.DEV is true only for 'astro dev', false for 'astro build' and 'astro preview'
function isDevelopmentMode(): boolean {
  return import.meta.env.DEV === true;
}

// Check if a post should be shown in production
export function shouldShowPost(post: Post, isDev: boolean | undefined = undefined): boolean {
  const { draft, title, date } = post.data;

  // Always require title and date
  if (!title || !date) {
    return false;
  }

  // Determine if we're in dev mode (use provided value or check environment)
  const inDevMode = isDev !== undefined ? isDev : isDevelopmentMode();

  // In development mode only, show all posts (even drafts)
  // In preview and production builds, hide drafts
  if (inDevMode) {
    return true;
  }

  // In production/preview, hide drafts (draft: true or undefined draft defaults to false)
  if (draft === true) {
    return false;
  }

  return true;
}

// Generic function to check if any content item should be shown
export function shouldShowContent(
  item: { data: { title: string; draft?: boolean } },
  isDev: boolean | undefined = undefined
): boolean {
  const { draft, title } = item.data;

  // Always require title
  if (!title) {
    return false;
  }

  // Determine if we're in dev mode (use provided value or check environment)
  const inDevMode = isDev !== undefined ? isDev : isDevelopmentMode();

  // In development mode only, show all content (even drafts)
  // In preview and production builds, hide drafts
  if (inDevMode) {
    return true;
  }

  // In production/preview, hide drafts
  return !draft;
}

// Sort content by date (newest first)
export function sortPostsByDate<T extends { data: { date: Date } }>(
  posts: T[]
): T[] {
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// Get next and previous content items
export function getAdjacentPosts(posts: Post[], currentSlug: string) {
  const sortedPosts = sortPostsByDate(posts);
  const currentIndex = sortedPosts.findIndex((post) => post.id === currentSlug);

  return {
    prev: currentIndex > 0 ? sortedPosts[currentIndex - 1] : null,
    next:
      currentIndex < sortedPosts.length - 1
        ? sortedPosts[currentIndex + 1]
        : null,
  };
}

// Get next and previous documentation items within the same category, sorted by order
export function getAdjacentDocs<T extends { id: string; data: { category?: string | null; order: number; title: string } }>(
  docs: T[],
  currentSlug: string,
  currentCategory: string | null
) {
  // Filter docs by the same category
  const categoryDocs = docs.filter((doc) => {
    const docCategory = doc.data.category && 
      doc.data.category.trim() !== '' && 
      doc.data.category !== 'General'
      ? doc.data.category
      : null;
    
    // If current doc has no category, match docs with no category
    if (!currentCategory) {
      return !docCategory;
    }
    
    // Match exact category
    return docCategory === currentCategory;
  });

  // Sort by order (ascending), then by title (alphabetical)
  const sortedDocs = categoryDocs.sort((a, b) => {
    if (a.data.order !== b.data.order) {
      return a.data.order - b.data.order;
    }
    return a.data.title.localeCompare(b.data.title);
  });

  // Find current doc index
  const currentIndex = sortedDocs.findIndex((doc) => doc.id === currentSlug);

  // Only return navigation if there are other docs in the category
  if (sortedDocs.length <= 1) {
    return {
      prev: null,
      next: null,
    };
  }

  return {
    prev: currentIndex > 0 ? sortedDocs[currentIndex - 1] : null,
    next:
      currentIndex < sortedDocs.length - 1
        ? sortedDocs[currentIndex + 1]
        : null,
  };
}

// Extract tags from posts
export function extractTags(posts: Post[]): string[] {
  const tags = new Set<string>();
  const isDev = import.meta.env.DEV;

  try {
    posts.forEach((post) => {
      if (post.data.tags) {
        // Handle both string and array tags, and filter out invalid values
        const postTags = Array.isArray(post.data.tags)
          ? post.data.tags
          : [post.data.tags];
        postTags.forEach((tag) => {
          if (tag && typeof tag === "string" && tag.trim()) {
            tags.add(tag.trim());
          }
        });
      }
    });
  } catch (error) {
    return [];
  }

  return Array.from(tags).sort();
}

// Filter posts by tag
export function filterPostsByTag(posts: Post[], tag: string): Post[] {
  const isDev = import.meta.env.DEV;

  if (!tag || typeof tag !== "string") {
    return [];
  }

  try {
    return posts.filter((post) => {
      if (!post.data.tags) return false;

      // Handle both string and array tags
      const postTags = Array.isArray(post.data.tags)
        ? post.data.tags
        : [post.data.tags];
      return postTags.some(
        (postTag) =>
          postTag &&
          typeof postTag === "string" &&
          postTag.trim() === tag.trim()
      );
    });
  } catch (error) {
    return [];
  }
}

// Create post slug from title
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Validate post data
export function validatePostData(data: Partial<PostData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.title) {
    errors.push("Title is required");
  }

  if (!data.date) {
    errors.push("Date is required");
  }

  if (!data.description) {
    errors.push("Description is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
