import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

/**
 * Rescues `inlineMath` nodes that are actually currency in disguise.
 *
 * remark-math has no built-in currency guard. A paragraph like
 * "Search spent $1,144 and made $20.80 per lead" is parsed as one
 * inline-math node with value "1,144 and made " plus stray "20.80 per
 * lead" text, because the two `$` signs delimit math by spec.
 *
 * Heuristic: real inline math basically never starts with a bare
 * digit. Variable names, operators, and `\command`s do. If the math
 * content begins with a digit, restore the literal `$...$` text.
 *
 * Must be registered AFTER `remarkMath` in the plugin chain so the
 * inlineMath nodes exist when this transformer runs.
 */
export default function remarkRescueCurrency() {
  return (tree: Root) => {
    visit(tree, 'inlineMath', (node: any, index, parent: any) => {
      if (!parent || typeof index !== 'number') return;
      const value: string = typeof node.value === 'string' ? node.value : '';
      if (!/^\s*\d/.test(value)) return;
      parent.children.splice(index, 1, {
        type: 'text',
        value: '$' + value + '$',
      });
      return index + 1;
    });
  };
}
