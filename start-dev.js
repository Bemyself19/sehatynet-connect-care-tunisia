// start-dev.js - Script to start both the peer server and frontend/backend together
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Convert __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color constants for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function formatLog(prefix, message) {
  return `${colors.bright}${colors.cyan}[${prefix}]${colors.reset} ${message}`;
}

// Start the peer server
function startPeerServer() {
  console.log(formatLog('STARTUP', `${colors.green}Starting PeerJS server...${colors.reset}`));
  
  const peerProcess = spawn('node', ['peer-server.js'], {
    stdio: 'pipe',
    shell: true,
  });

  peerProcess.stdout.on('data', (data) => {
    console.log(formatLog('PEER', data.toString().trim()));
  });

  peerProcess.stderr.on('data', (data) => {
    console.error(formatLog('PEER ERROR', `${colors.red}${data.toString().trim()}${colors.reset}`));
  });

  peerProcess.on('close', (code) => {
    console.log(formatLog('PEER', `${colors.yellow}Peer server process exited with code ${code}${colors.reset}`));
  });

  return peerProcess;
}

// Start the dev server using npm (most widely available)
function startDevServer() {
  console.log(formatLog('STARTUP', `${colors.green}Starting development server with npm...${colors.reset}`));
  
  // Always use npm for better compatibility
  const command = 'npm';
  const args = ['run', 'dev'];
  
  // Note: We're not using package detection anymore to ensure compatibility
  console.log(formatLog('STARTUP', `${colors.green}Using command: ${command} ${args.join(' ')}${colors.reset}`));
  
  const devProcess = spawn(command, args, {
    stdio: 'pipe',
    shell: true,
  });

  devProcess.stdout.on('data', (data) => {
    console.log(formatLog('DEV', data.toString().trim()));
  });

  devProcess.stderr.on('data', (data) => {
    console.error(formatLog('DEV ERROR', `${colors.red}${data.toString().trim()}${colors.reset}`));
  });

  devProcess.on('close', (code) => {
    console.log(formatLog('DEV', `${colors.yellow}Development server process exited with code ${code}${colors.reset}`));
  });

  return devProcess;
}

// Handle cleanup on exit
function setupCleanup(processes) {
  const cleanup = () => {
    console.log(formatLog('SHUTDOWN', `${colors.yellow}Shutting down all processes...${colors.reset}`));
    
    processes.forEach((process) => {
      if (!process.killed) {
        process.kill();
      }
    });
  };

  // Handle various termination signals
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
}

// Main function to start everything
function main() {
  console.log(`${colors.bright}${colors.green}=== SEHATYNET DEVELOPMENT ENVIRONMENT ====${colors.reset}`);
  console.log(`${colors.bright}${colors.green}Starting all services for local development${colors.reset}`);
  
  const processes = [];
  
  // Start in specific order
  processes.push(startPeerServer());
  
  // Give the peer server a head start
  setTimeout(() => {
    processes.push(startDevServer());
    setupCleanup(processes);
  }, 1000);
}

main();
