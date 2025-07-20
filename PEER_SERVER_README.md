# Sehatynet Peer Server

This is a simple PeerJS server implementation for Sehatynet's live video consultation feature.

## Overview

The peer server provides WebRTC signaling services to help establish direct peer-to-peer connections between users for video/audio streaming. It acts as a matchmaker to help peers find each other, but the actual audio/video data flows directly between the connected peers.

## Setup

No additional setup is required. The peer server is configured to run in HTTP mode for local development to avoid mixed content issues.

## Running the Server

There are several ways to start the peer server:

### Method 1: Standalone Mode

```
node peer-server.js
```

### Method 2: With Development Environment

```
.\start-dev.bat
```

This will start both the peer server and development server.

### Method 3: Using npm Script

```
npm run peer
```

## Testing

To verify the peer server is running correctly:

```
.\test-peer-server.bat
```

This will start the server and run a test client to verify connectivity.

## Configuration

The peer server uses the following default configuration:

- **Host:** localhost
- **Port:** 9000
- **Path:** /peerjs
- **Protocol:** HTTP (not HTTPS)
- **WebSocket URL:** ws://localhost:9000/peerjs

## Troubleshooting

If you encounter issues with the peer server:

1. Check if the server is running with `node peer-server.js`
2. Verify there are no other services using port 9000
3. Look for any error messages in the console
4. Run the test script to check connectivity
5. See the WEBRTC_TROUBLESHOOTING.md document for more detailed guidance

## Security Notes

- This server is configured for local development only
- SSL is intentionally disabled for ease of local testing
- In production, always use HTTPS and secure WebSockets (WSS)
