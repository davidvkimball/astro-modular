import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Blockquote, Paragraph, Text } from 'mdast';

interface CalloutMapping {
  type: string;
  icon: string;
  title: string;
}

/**
 * Recursively extract all text content from a node and its children
 * Handles text nodes, strong, emphasis, links, and other inline elements
 */
function extractTextFromNode(node: any): string {
  if (!node) return '';
  
  if (node.type === 'text') {
    return node.value || '';
  }
  
  if (node.children && Array.isArray(node.children)) {
    return node.children.map((child: any) => extractTextFromNode(child)).join('');
  }
  
  return '';
}

// Official Lucide SVG icon paths for callouts
const iconPaths: Record<string, string> = {
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="m12 8 .01 0"/>',
  'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  'star': '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>',
  'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/>',
  'circle-alert': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="m12 16 .01 0"/>',
  'circle-x': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  'circle-help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'bug': '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  'code': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  'quote': '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'
};

function getIconSVG(iconName: string): string {
  const path = iconPaths[iconName] || iconPaths['info'];
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="callout-icon">${path}</svg>`;
}

const calloutMappings: Record<string, CalloutMapping> = {
  note: { type: 'note', icon: 'info', title: 'Note' },
  tip: { type: 'tip', icon: 'lightbulb', title: 'Tip' },
  important: { type: 'important', icon: 'star', title: 'Important' },
  warning: { type: 'warning', icon: 'triangle-alert', title: 'Warning' },
  caution: { type: 'caution', icon: 'circle-alert', title: 'Caution' },
  danger: { type: 'caution', icon: 'circle-x', title: 'Danger' },
  info: { type: 'note', icon: 'info', title: 'Info' },
  question: { type: 'important', icon: 'circle-help', title: 'Question' },
  success: { type: 'tip', icon: 'circle-check', title: 'Success' },
  failure: { type: 'caution', icon: 'circle-x', title: 'Failure' },
  bug: { type: 'caution', icon: 'bug', title: 'Bug' },
  example: { type: 'tip', icon: 'code', title: 'Example' },
  quote: { type: 'note', icon: 'quote', title: 'Quote' },
  abstract: { type: 'important', icon: 'file-text', title: 'Abstract' },
  summary: { type: 'important', icon: 'file-text', title: 'Summary' },
  tldr: { type: 'important', icon: 'file-text', title: 'TL;DR' }
};

const remarkCallouts: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
      // Check if this blockquote contains a callout pattern
      const firstChild = node.children[0];
      if (!firstChild || firstChild.type !== 'paragraph') return;
      
      // Extract all text from the first paragraph to find the callout pattern
      const firstParagraph = firstChild as Paragraph;
      const paragraphText = extractTextFromNode(firstParagraph);
      
      // Match callout pattern at the start of the paragraph text
      // The custom title capture should stop at newline (title is on same line as callout)
      const calloutMatch = paragraphText.match(/^\[!([\w-]+)\]([+\-]?)(?:\s+([^\n]+))?/);
      
      if (!calloutMatch) return;
      
      const [fullMatch, calloutType, collapseState, customTitle] = calloutMatch;
      const calloutKey = calloutType.toLowerCase();
      const mapping = calloutMappings[calloutKey] || {
        type: 'note',
        icon: 'info',
        title: calloutType.charAt(0).toUpperCase() + calloutType.slice(1)
      };
      
      // Get remaining text after the callout syntax
      const remainingText = paragraphText.slice(fullMatch.length).trim();
      const hasMultipleParagraphs = node.children.length > 1;
      
      // CRITICAL: Check if the FIRST text node starts with callout syntax followed by newline
      // This indicates the callout is on its own line, even if content follows in the same paragraph
      const firstTextNode = firstParagraph.children.find((child: any) => child.type === 'text') as Text | undefined;
      const firstTextValue = firstTextNode?.value || '';
      
      // Check if first text node starts with callout syntax followed by newline
      // Pattern: "[!example]\n" or "[!example] \n" (with optional space before newline)
      const calloutStartsOnOwnLine = firstTextValue.match(/^\[![\w-]+\][+\-]?\s*\n/);
      
      // The callout is on its own line if:
      // 1. Multiple paragraphs exist, OR
      // 2. First text node starts with callout syntax + newline (callout on own line, content follows), OR
      // 3. No remaining text (callout only)
      const isCalloutOnOwnLine = hasMultipleParagraphs || 
                                calloutStartsOnOwnLine !== null || 
                                remainingText.length === 0;
      
      // Determine the actual title to use - ALWAYS use mapped title when callout is on its own line
      const calloutTitle = isCalloutOnOwnLine
        ? mapping.title  // Use mapped title when callout is on its own line
        : (customTitle || mapping.title);  // Use custom title if provided, otherwise mapped title
      
      // Determine if callout should be collapsible and its initial state
      const isCollapsible = collapseState === '+' || collapseState === '-';
      const isCollapsed = collapseState === '-';
      
      // Process the remaining content
      let contentChildren = [...node.children];
      
      // Handle content based on structure:
      // - Multiple paragraphs: Remove first paragraph (callout line separate from content)
      // - Single paragraph, callout on own line (newline detected): Keep paragraph, remove callout syntax
      // - Single paragraph, callout only: Remove paragraph (no content)
      // - Single paragraph, callout with title on same line: Keep paragraph, remove callout syntax
      if (hasMultipleParagraphs) {
        // Multiple paragraphs - callout line is separate, remove first paragraph
        contentChildren = contentChildren.slice(1);
      } else if (calloutStartsOnOwnLine) {
        // Single paragraph but callout starts on its own line (has newline after callout)
        // Keep the paragraph but remove the callout syntax from the first text node
        if (firstTextNode) {
          // Remove callout syntax and newline from start of first text node
          const newlinePattern = /^\[![\w-]+\][+\-]?\s*\n\s*/;
          firstTextNode.value = firstTextNode.value.replace(newlinePattern, '');
        }
        // Keep the paragraph (contentChildren already has it)
      } else if (remainingText.length === 0) {
        // Single paragraph with only callout syntax - remove it
        contentChildren = contentChildren.slice(1);
      } else if (remainingText) {
        // Single paragraph with text after callout - remove callout syntax, keep the text
        const updateTextNode = (node: any): boolean => {
          if (node.type === 'text' && node.value) {
            const textValue = node.value as string;
            if (textValue.includes(fullMatch)) {
              const index = textValue.indexOf(fullMatch);
              const before = textValue.slice(0, index);
              const after = textValue.slice(index + fullMatch.length).trim();
              node.value = (before + (after ? ' ' + after : '')).trim();
              return true;
            }
          }
          if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
              if (updateTextNode(child)) return true;
            }
          }
          return false;
        };
        updateTextNode(firstParagraph);
      }
      
      // Generate toggle button HTML if collapsible
      const toggleButton = isCollapsible ? 
        `<button class="callout-toggle" aria-expanded="${!isCollapsed}" aria-label="Toggle callout content">
          <svg class="callout-toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </button>` : '';
      
      // Transform the blockquote into a callout HTML structure
      const calloutHtml: any = {
        type: 'html',
        value: `<div class="callout callout-${mapping.type}${isCollapsible ? ' callout-collapsible' : ''}${isCollapsed ? ' callout-collapsed' : ''}">
          <div class="callout-title">
            ${getIconSVG(mapping.icon)}
            <span>${calloutTitle}</span>
            ${toggleButton}
          </div>
          <div class="callout-content"${isCollapsed ? ' style="display: none;"' : ''}>`
      };
      
      const closeHtml: any = {
        type: 'html',
        value: '</div></div>'
      };
      
      // Replace the blockquote with the callout structure
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1, calloutHtml, ...contentChildren, closeHtml);
      }
    });
  };
};


export default remarkCallouts;