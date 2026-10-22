/**
 * Mermaid diagrams, rendered by Pele (https://pele.run).
 *
 * Pele colors diagrams with CSS variables (mapped to the theme in global.css),
 * so theme and light/dark changes restyle them in place with no re-render.
 * Diagrams mount lazily as they approach the viewport.
 */

type Mounted = { destroy(): void };

let peleModule: typeof import("pele") | null = null;
// One entry per mounted diagram. Pele keeps a ResizeObserver per mount so it
// can re-lay out on width changes; destroy() releases it.
const mounts = new Map<Element, Mounted>();
let intersectionObserver: IntersectionObserver | null = null;
// Diagrams waiting to scroll into view.
const pending = new Set<Element>();

async function mountDiagram(diagram: Element): Promise<void> {
  if (mounts.has(diagram) || !diagram.isConnected) return;
  const source = decodeURIComponent(diagram.getAttribute("data-mermaid-source") || "");
  const content = diagram.querySelector<HTMLElement>(".mermaid-diagram-content");
  if (!source || !content) return;

  peleModule ??= await import("pele");
  // The await above lets another call get here first.
  if (mounts.has(diagram) || !diagram.isConnected) return;

  // An empty linkRel keeps click-through links plain (no rel attribute).
  const mounted = peleModule.mount(content, source, { linkRel: "" });
  if (mounted.error) {
    mounted.destroy();
    content.innerHTML = errorState(source, mounted.error);
    return;
  }
  mounts.set(diagram, mounted);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function errorState(source: string, error: unknown): string {
  const detail = error instanceof Error ? error.message.split("\n")[0] : "";
  return `
    <div class="mermaid-diagram-error">
      <p class="mermaid-diagram-error-title">Diagram rendering failed${detail ? `: ${escapeHtml(detail)}` : ""}</p>
      <details>
        <summary>Show source</summary>
        <pre>${escapeHtml(source)}</pre>
      </details>
    </div>
  `;
}

function getIntersectionObserver(): IntersectionObserver {
  intersectionObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        intersectionObserver?.unobserve(entry.target);
        pending.delete(entry.target);
        void mountDiagram(entry.target);
      }
    },
    // Start loading 50px before a diagram enters the viewport.
    { rootMargin: "50px", threshold: 0.1 },
  );
  return intersectionObserver;
}

/** Mount every diagram on the page. Safe to call repeatedly (Swup re-runs it). */
function renderAllDiagrams(): void {
  // Release diagrams that Swup swapped out of the document.
  for (const [el, mounted] of mounts) {
    if (!el.isConnected) {
      mounted.destroy();
      mounts.delete(el);
    }
  }

  const observer = getIntersectionObserver();
  for (const el of pending) {
    if (!el.isConnected) {
      observer.unobserve(el);
      pending.delete(el);
    }
  }

  document
    .querySelectorAll(".mermaid-diagram[data-mermaid-source]")
    .forEach((diagram) => {
      if (mounts.has(diagram) || pending.has(diagram)) return;
      pending.add(diagram);
      observer.observe(diagram);
    });
}

function initializeMermaidOnLoad(): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAllDiagrams);
  } else {
    renderAllDiagrams();
  }
}

export { renderAllDiagrams, initializeMermaidOnLoad };

// Swup calls this after every page transition.
if (typeof window !== "undefined") {
  (window as any).initializeMermaid = renderAllDiagrams;
}
