/**
 * Client-side Mermaid initialization. Diagrams render with Pele and mount
 * lazily as they approach the viewport; see src/utils/mermaid.ts.
 */

import { initializeMermaidOnLoad } from '../utils/mermaid';

initializeMermaidOnLoad();
