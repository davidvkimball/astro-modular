/**
 * Astro server launcher with automatic port detection
 * Checks if port 5000 is available, falls back to 5001 if occupied
 * Supports both 'dev' and 'preview' commands
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

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
  const port5000Available = await checkPort(5000);
  
  if (port5000Available) {
    return 5000;
  } else {
    // Port 5000 is occupied (likely AirPlay on macOS)
    console.log('⚠️  Port 5000 is occupied, using port 5001 instead');
    return 5001;
  }
}

async function main() {
  // Get command from first argument (defaults to 'dev')
  const command = process.argv[2] || 'dev';
  
  if (!['dev', 'preview'].includes(command)) {
    console.error(`Invalid command: ${command}. Must be 'dev' or 'preview'.`);
    process.exit(1);
  }
  
  const port = await getAvailablePort();
  
  // Use pnpm exec to ensure we use the local Astro installation
  // On Windows, use 'pnpm.cmd', on Unix use 'pnpm'
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  
  // Spawn astro with the detected port
  const astroProcess = spawn(pnpmCmd, ['exec', 'astro', command, '--host', 'localhost', '--port', port.toString()], {
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

