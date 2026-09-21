#!/usr/bin/env node
/**
 * Fails the build if a tracked file is empty on disk but not empty in git.
 *
 * Eleven files in this repo were found truncated to zero bytes and sat that way
 * unnoticed, because nothing checks for it and the damage only surfaces when
 * whatever imports the file happens to run. Git always had the content, so the
 * loss was never permanent. The cost was the twelve days of not knowing.
 *
 * Legitimately empty tracked files (.gitkeep and friends) are empty in git too,
 * so they never trip this.
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

let tracked;
try {
  tracked = git(['ls-files', '-z']).split('\0').filter(Boolean);
} catch {
  // Not a git checkout (a release zip, for instance). Nothing to compare against.
  process.exit(0);
}

const truncated = [];
for (const file of tracked) {
  let size;
  try {
    size = statSync(file).size;
  } catch {
    continue; // deleted on purpose; git status covers that case
  }
  if (size > 0) continue;

  let committed = 0;
  try {
    committed = Buffer.byteLength(git(['show', `HEAD:${file}`]));
  } catch {
    continue; // newly added and still empty
  }
  if (committed > 0) truncated.push({ file, committed });
}

if (truncated.length > 0) {
  console.error(`\n${truncated.length} tracked file(s) are empty on disk but have content in git:\n`);
  for (const { file, committed } of truncated) {
    console.error(`  ${file}  (${committed} bytes in git)`);
  }
  console.error('\nRestore them with:\n  git checkout -- <path>\n');
  process.exit(1);
}
