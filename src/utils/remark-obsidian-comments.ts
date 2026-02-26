import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Root, Text, Paragraph } from 'mdast';

/**
 * Remark plugin to remove Obsidian-style comments (%%...%%)
 * These comments should be hidden in the rendered output
 */
export const remarkObsidianComments: Plugin<[], Root> = () => {
  return (tree: Root) => {
    // First pass: Remove comment syntax from text nodes
    visit(tree, 'text', (node: Text) => {
      if (typeof node.value === 'string') {
        // Remove Obsidian comments: %%...%%
        // This handles both single-line and multi-line comments
        // The regex matches %% followed by any content (including newlines) until the closing %%
        node.value = node.value.replace(/%%[\s\S]*?%%/g, '');
      }
    });

    // Second pass: Remove paragraphs that only contain comments (now empty after first pass)
    const nodesToRemove: Array<{ parent: any; index: number }> = [];
    
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      
      // Check if paragraph has any meaningful content after comment removal
      const hasContent = node.children.some((child: any) => {
        if (child.type === 'text') {
          return child.value.trim().length > 0;
        }
        // Keep non-text nodes (links, images, etc.) as they are meaningful content
        return true;
      });
      
      // If paragraph has no content, mark it for removal
      if (!hasContent) {
        nodesToRemove.push({ parent, index });
      }
    });

    // Remove empty paragraphs in reverse order to maintain correct indices
    nodesToRemove.reverse().forEach(({ parent, index }) => {
      if (Array.isArray(parent.children)) {
        parent.children.splice(index, 1);
      }
    });
  };
};

