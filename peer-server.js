// peer-server.js
import { PeerServer } from 'peer';
const server = PeerServer({ port: 9000, path: '/peerjs' });
console.log('PeerServer running on http://localhost:9000/peerjs'); 