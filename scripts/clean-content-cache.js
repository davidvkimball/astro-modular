#!/usr/bin/env node
/**
 * Removes Astro's content layer cache before a build.
 *
 * `node_modules/.astro/data-store.json` holds the parsed and rendered content
 * collections. It survives a `.astro` wipe, and it is keyed on the content
 * files rather than on the remark and rehype plugins that transform them, so
 * editing a plugin leaves the cache looking valid and the build serves the
 * previous HTML. That failure is silent: the build succeeds and the output is
 * simply out of date.
 *
 * Astro 7 writes the same cache to `.astro/data-store.json` in the project root as well (the dev server reads and writes it there), and this script used to miss it, so both locations are removed.
 *
 * The sibling `node_modules/.astro/assets` directory is deliberately left
 * alone. It caches processed images, it is not involved in the staleness
 * above, and clearing it would make every build reprocess every image.
 */
import { rmSync } from 'node:fs';

rmSync('node_modules/.astro/data-store.json', { force: true });
rmSync('.astro/data-store.json', { force: true });
