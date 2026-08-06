/**
 * Astro server launcher with automatic port detection
 * Checks if port 4322 is available, falls back to 4323 if occupied
 * Supports both 'dev' and 'preview' commands
 *
 * Any extra CLI arguments after the command are forwarded verbatim to the
 * astro CLI, e.g. `node scripts/dev-with-port.js dev --force`.
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Unique dev port for this project. Keep in sync with `server.port` in astro.config.mjs.
const DEV_PORT = 4322;
const FALLBACK_PORT = 4323;

function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // Port is occupied
    });
  });
}

async function getAvailablePort() {
  const primaryPortAvailable = await checkPort(DEV_PORT);

  if (primaryPortAvailable) {
    return DEV_PORT;
  } else {
    // Primary port is occupied by something else
    console.log(`⚠️  Port ${DEV_PORT} is occupied, using port ${FALLBACK_PORT} instead`);
    return FALLBACK_PORT;
  }
}

async function main() {
  // Get command from first argument (defaults to 'dev')
  const command = process.argv[2] || 'dev';

  if (!['dev', 'preview'].includes(command)) {
    console.error(`Invalid command: ${command}. Must be 'dev' or 'preview'.`);
    process.exit(1);
  }

  // Everything after the command is passed straight through to the astro CLI
  const passthroughArgs = process.argv.slice(3);

  const port = await getAvailablePort();
  
  // Use pnpm exec to ensure we use the local Astro installation
  // On Windows, use 'pnpm.cmd', on Unix use 'pnpm'
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  
  // Spawn astro with the detected port
  const astroArgs = ['exec', 'astro', command, '--host', 'localhost', '--port', port.toString(), ...passthroughArgs];

  const astroProcess = spawn(pnpmCmd, astroArgs, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });
  
  astroProcess.on('error', (error) => {
    console.error(`Failed to start Astro ${command} server:`, error);
    process.exit(1);
  });
  
  astroProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

