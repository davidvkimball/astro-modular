// Type definitions for the blog theme
import type { CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"posts">;

export type PostData = CollectionEntry<"posts">["data"];

export type Page = CollectionEntry<"pages">;

export type PageData = CollectionEntry<"pages">["data"];

export type Project = CollectionEntry<"projects">;

export type ProjectData = CollectionEntry<"projects">["data"];

export type Docs = CollectionEntry<"docs">;

export type DocsData = CollectionEntry<"docs">["data"];

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export interface ReadingTime {
  text: string;
  minutes: number;
  time: number;
  words: number;
}

export interface NavigationItem {
  title: string;
  url?: string;  // Optional - if missing, item is dropdown-only
  external?: boolean;
  icon?: string;
  children?: NavigationItem[];  // Single level only
}

export interface SocialLink {
  title: string;
  url: string;
  icon: string;
}

export interface CommandPaletteItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: "post" | "page" | "project" | "docs" | "social" | "external" | "action";
  icon?: string;
}

export interface SearchResult {
  item: CommandPaletteItem;
  score: number;
  matches: Array<{
    indices: Array<[number, number]>;
    value: string;
    key: string;
  }>;
}

export interface ImageInfo {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface OpenGraphImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface SEOData {
  title: string;
  description: string;
  canonical: string;
  ogImage?: OpenGraphImage;
  ogType: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  noIndex?: boolean;
  robots?: string;
  articleSection?: string;
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  keywords?: string[];
}

export interface WikilinkMatch {
  link: string;
  display: string;
  slug: string;
}

export interface LinkedMention {
  title: string;
  slug: string;
  excerpt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextUrl?: string;
  prevUrl?: string;
}
