import type { Root, Image } from "mdast";
import { visit } from "unist-util-visit";

/**
 * Remark plugin to parse Obsidian-style image size syntax
 * Supports: ![alt|100x100](image.png) or ![alt|200](image.png)
 * - ![alt|100x100] - width x height (pixels)
 * - ![alt|200] - width only (pixels, height auto)
 */
export function remarkObsidianImageSize() {
  return (tree: Root) => {
    visit(tree, "image", (node: Image) => {
      const alt = node.alt || "";

      // Parse Obsidian syntax: alt|widthxheight or alt|width
      const pipeIndex = alt.lastIndexOf('|');

      if (pipeIndex !== -1) {
        const actualAlt = alt.substring(0, pipeIndex).trim();
        const sizePart = alt.substring(pipeIndex + 1).trim();

        // Parse size: "100x100" or "200"
        const sizeMatch = sizePart.match(/^(\d+(?:\.\d+)?)(?:x(\d+(?:\.\d+)?))?$/);

        if (sizeMatch) {
          const width = sizeMatch[1];
          const height = sizeMatch[2] ? sizeMatch[2] : undefined;

          // Update node properties
          node.alt = actualAlt;

          if (!node.data) {
            node.data = {};
          }
          if (!node.data.hProperties) {
            node.data.hProperties = {};
          }

          const hProperties = node.data.hProperties as Record<string, any>;

          // Add inline style for width/height (in pixels)
          const styleParts: string[] = [];

          if (width) {
            styleParts.push(`width: ${width}px`);
          }

          if (height) {
            styleParts.push(`height: ${height}px`);
          }

          if (styleParts.length > 0) {
            hProperties.style = styleParts.join('; ');
          }

          // Add class for targeting in CSS
          hProperties.class = (hProperties.class || '').split(' ')
            .filter(Boolean)
            .concat('obsidian-sized')
            .join(' ');
        }
      }
    });
  };
}

export default remarkObsidianImageSize;
