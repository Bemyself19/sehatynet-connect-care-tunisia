// test-peer-server.js
// This script starts a minimal test client that connects to the peer server
import Peer from 'peerjs';

// WebRTC Configuration
const PEER_HOST = 'localhost';
const PEER_PORT = 9000;
const PEER_PATH = '/peerjs';
const PEER_SECURE = false;
const PEER_DEBUG = 3;

// Unique ID for testing
const TEST_ID = 'test-client-' + Math.random().toString(36).substring(2, 8);

console.log('=== PeerJS Connection Test ===');
console.log('Attempting to connect to peer server with configuration:');
console.log(`Host: ${PEER_HOST}`);
console.log(`Port: ${PEER_PORT}`);
console.log(`Path: ${PEER_PATH}`);
console.log(`Secure: ${PEER_SECURE}`);
console.log(`Debug Level: ${PEER_DEBUG}`);
console.log(`Test Client ID: ${TEST_ID}`);
console.log('================================');

const peer = new Peer(TEST_ID, {
    host: PEER_HOST,
    port: PEER_PORT,
    path: PEER_PATH,
    debug: PEER_DEBUG,
    secure: PEER_SECURE
});

peer.on('open', (id) => {
    console.log(`✅ SUCCESS: Connected to peer server with ID: ${id}`);
    console.log('Connection is working properly!');
    
    // Keep the connection open for a few seconds then close
    setTimeout(() => {
        console.log('Test complete, disconnecting...');
        peer.destroy();
        process.exit(0);
    }, 3000);
});

peer.on('error', (error) => {
    console.error(`❌ ERROR: ${error.type} - ${error.message}`);
    console.error('Connection failed. Check that your peer server is running.');
    process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Terminating test client...');
    if (peer) {
        peer.destroy();
    }
    process.exit(0);
});
