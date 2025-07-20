// peer-server.js
import { PeerServer } from 'peer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force HTTP mode for local development
const forceHttp = false;

// Configure options
const options = {
    port: 9000,
    path: '/peerjs',
    proxied: false, // Set to true if behind a proxy like nginx
    debug: true,
    allow_discovery: true, // Enable peer discovery
    alive_timeout: 60000, // Keep connections alive for 60 seconds
    key: 'sehatynet', // Optional but recommended for your app
    // Connection limits to prevent abuse
    concurrent_limit: 100
};

// Try to load SSL certificates if they exist (for secure HTTPS connections)
try {
    // Only attempt to use SSL if not forcing HTTP mode
    if (!forceHttp) {
        const certPath = path.join(__dirname, 'cert');
        if (fs.existsSync(path.join(certPath, 'localhost.key')) && 
            fs.existsSync(path.join(certPath, 'localhost.crt'))) {
            
            console.log('SSL certificates found, using HTTPS for PeerServer');
            options.ssl = {
                key: fs.readFileSync(path.join(certPath, 'localhost.key')),
                cert: fs.readFileSync(path.join(certPath, 'localhost.crt'))
            };
        }
    } else {
        console.log('Forcing HTTP mode for local development');
    }
} catch (err) {
    console.log('SSL certificates not found or invalid, using HTTP for PeerServer');
}

// Create the PeerServer
const server = PeerServer(options);

// Event handlers
server.on('connection', (client) => {
    console.log(`Client connected: ${client.getId()}`);
});

server.on('disconnect', (client) => {
    console.log(`Client disconnected: ${client.getId()}`);
});

// Log the server URL with appropriate protocol
const protocol = options.ssl ? 'https' : 'http';
console.log(`PeerServer running on ${protocol}://localhost:${options.port}${options.path}`);
console.log('PeerJS server ready for WebRTC connections');
console.log('For WebSocket connections, use: ws://localhost:9000/peerjs');
console.log('=== Configuration ===');
console.log(`Port: ${options.port}`);
console.log(`Path: ${options.path}`);
console.log(`Protocol: ${protocol}`);
console.log(`SSL Enabled: ${!!options.ssl}`);
console.log('====================');