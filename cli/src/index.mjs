import { downloadTemplate } from 'giget';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { execSync } from 'node:child_process';

// ANSI color helpers
const bold = (s) => `\x1b[1m${s}\x1b[22m`;
const green = (s) => `\x1b[32m${s}\x1b[39m`;
const cyan = (s) => `\x1b[36m${s}\x1b[39m`;
const red = (s) => `\x1b[31m${s}\x1b[39m`;
const dim = (s) => `\x1b[2m${s}\x1b[22m`;

const TEMPLATE = 'gh:davidvkimball/astro-modular#master';

const CLEANUP = [
  'cli',
  '.github',
  '.ref',
  'AGENTS.md',
];

function detectPackageManager() {
  const ua = process.env.npm_config_user_agent || '';
  if (ua.startsWith('pnpm')) return 'pnpm';
  if (ua.startsWith('yarn')) return 'yarn';
  if (ua.startsWith('bun')) return 'bun';
  return 'npm';
}

function isEmpty(dir) {
  if (!existsSync(dir)) return true;
  const entries = readdirSync(dir);
  return entries.length === 0;
}

export async function main() {
  console.log();
  console.log(bold(cyan('  create-astro-modular')) + dim(' - Scaffold an Astro Modular blog'));
  console.log();

  let projectName = process.argv[2];

  // Prompt for project name if not provided
  if (!projectName) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      projectName = await rl.question(cyan('? ') + bold('Project name: '));
      projectName = projectName.trim();
    } finally {
      rl.close();
    }
  }

  if (!projectName) {
    console.log(red('Error: Project name is required.'));
    process.exit(1);
  }

  const targetDir = resolve(process.cwd(), projectName);

  // Validate target directory
  if (!isEmpty(targetDir)) {
    console.log(red(`Error: Directory "${projectName}" already exists and is not empty.`));
    process.exit(1);
  }

  // Download template
  console.log();
  console.log(`  ${dim('Downloading template...')}`);

  try {
    await downloadTemplate(TEMPLATE, {
      dir: targetDir,
      force: true,
    });
  } catch (err) {
    console.log(red(`Error downloading template: ${err.message}`));
    process.exit(1);
  }

  // Clean up dev-only files and directories
  for (const name of CLEANUP) {
    const target = resolve(targetDir, name);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
    }
  }

  console.log(green('  Template downloaded and cleaned up.'));

  // Detect package manager and install
  const pm = detectPackageManager();
  console.log(`  ${dim(`Installing dependencies with ${pm}...`)}`);

  try {
    execSync(`${pm} install`, {
      cwd: targetDir,
      stdio: 'inherit',
    });
    console.log(green('  Dependencies installed.'));
  } catch {
    console.log(dim('  Could not install dependencies. Run install manually.'));
  }

  // Success message
  const cdPath = basename(targetDir) === basename(process.cwd())
    ? '.'
    : projectName;

  console.log();
  console.log(green(bold('  Done!')) + ' Your Astro Modular blog is ready.');
  console.log();
  console.log('  Next steps:');
  console.log(`    ${cyan('cd')} ${cdPath}`);
  console.log(`    ${cyan(`${pm} dev`)}`);
  console.log();
  console.log(dim('  Docs: https://github.com/davidvkimball/astro-modular'));
  console.log();
}
