# Sehatynet WebRTC Troubleshooting Guide

This document provides solutions for common issues with the live video consultation feature.

## Prerequisites

1. Make sure all services are running:
   - Backend API server
   - Peer server
   - Frontend development server

## Quick Start

Run the `start-dev.bat` script to start both the peer server and development server:
```
.\start-dev.bat
```

## Testing the Peer Server

Run the peer server test to verify it's working correctly:
```
.\test-peer-server.bat
```

## Common Issues and Solutions

### 1. "Socket closed" or "Lost connection to server" errors

**Causes:**
- Peer server is not running
- WebSocket URL is incorrect
- Network/firewall blocking WebSocket connections

**Solutions:**
- Ensure the peer server is running (check the terminal window)
- Verify WebSocket URL matches your peer server configuration
- Try using HTTP instead of HTTPS for local development
- Check for browser console errors

### 2. "Peer unavailable" errors

**Causes:**
- The remote peer has not joined yet
- The remote peer ID is incorrect
- The remote peer has disconnected

**Solutions:**
- Wait for the other user to join
- Check peer IDs in console logs
- Try refreshing the page

### 3. No video feed appears

**Causes:**
- Camera permissions denied
- Camera in use by another application
- Media constraints incompatible with device

**Solutions:**
- Check browser permissions
- Close other applications using the camera
- Check browser console for media device errors
- Try an audio-only call

### 4. Connection works initially but disconnects

**Causes:**
- Network instability
- Browser tab put to sleep in background
- System sleep/hibernate

**Solutions:**
- Ensure stable network connection
- Keep the browser tab active
- Disable power saving features during calls

### 5. Only one-way audio/video

**Causes:**
- One participant has microphone/camera issues
- One participant has muted their audio/video
- ICE connection issues

**Solutions:**
- Check mute status
- Verify media permissions on both sides
- Check browser console for ICE connection errors

## Advanced Troubleshooting

### WebRTC Connection Process

1. **Signaling**: Peer IDs are exchanged via WebSocket
2. **ICE Candidates**: Network paths are discovered via STUN/TURN servers
3. **Media Exchange**: Audio/video streams are sent directly between peers

### Checking Browser Support

Run this in your browser console:
```javascript
console.log("WebRTC Support:", !!window.RTCPeerConnection);
console.log("getUserMedia Support:", !!navigator.mediaDevices?.getUserMedia);
```

### Network Diagnostics

- Check if you can access the peer server directly: http://localhost:9000/peerjs/peerjs/info (Peer server runs on HTTP, but frontend/backend use HTTPS)
- Verify STUN servers are accessible: stun:stun.l.google.com:19302
- Check for restrictive firewalls or proxies

## Contact Support

If issues persist after trying these solutions, gather the following information:
1. Browser console logs
2. Network tab information
3. Browser and OS versions
4. Description of the exact error and when it occurs

Submit these details to the support team for further assistance.
