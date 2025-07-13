import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
// import https from "https";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import appointmentRoutes from "./routes/appointment.routes";
import medicalRecordRoutes from "./routes/medicalRecord.routes";
import prescriptionRoutes from "./routes/prescription.routes";
import specialtyRoutes from './routes/specialty.routes';
import teleExpertiseRequestRoutes from './routes/teleExpertiseRequest.routes';
import paymentRoutes from "./routes/payment.routes";
import systemSettingRoutes from './routes/systemSetting.routes';
import reportRoutes from './routes/report.routes';
import labResultRoutes from './routes/labResult.routes';
import medicationRoutes from './routes/medication.routes';
import allergyRoutes from './routes/allergy.routes';
import immunizationRoutes from './routes/immunization.routes';

dotenv.config();
const app = express();

// NOTE: HTTPS server code removed. HTTPS is now handled via a reverse proxy (e.g., Nginx) for security and maintainability. See documentation for details.
// const httpsOptions = {
//   key: fs.readFileSync('cert/localhost.key'),
//   cert: fs.readFileSync('cert/localhost.crt'),
// };
// const server = https.createServer(httpsOptions, app);

// Use HTTP server instead
const server = require('http').createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket connection handling
const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws) => {
    console.log('🔌 WebSocket client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('📩 WebSocket message received:', data);

            // Handle both formats of join messages (join-room or JOIN_CONSULTATION)
            if (data.type === 'join-room' || data.type === 'JOIN_CONSULTATION') {
                // Extract peerId from either format
                const appointmentId = data.appointmentId;
                const peerId = data.peerId;
                const userId = data.userId;
                const userRole = data.userRole;

                console.log(`🚪 User joining room ${appointmentId}:`, { peerId, userId, userRole });

                if (!rooms.has(appointmentId)) {
                    rooms.set(appointmentId, new Set());
                }
                rooms.get(appointmentId)?.add(ws);
                (ws as any).appointmentId = appointmentId;
                (ws as any).peerId = peerId;
                (ws as any).userId = userId;
                (ws as any).userRole = userRole;

                // Notify others in the room
                rooms.get(appointmentId)?.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ 
                            type: 'PEER_JOINED', 
                            peerId,
                            userId,
                            userRole
                        }));
                    }
                });
                
                // Acknowledge join
                ws.send(JSON.stringify({
                    type: 'JOIN_CONFIRMED',
                    appointmentId,
                    timestamp: new Date().toISOString()
                }));
            }
            // Handle GET_PEERS request
            else if (data.type === 'GET_PEERS') {
                const appointmentId = data.appointmentId;
                console.log(`📋 Peer list requested for room ${appointmentId}`);
                
                if (rooms.has(appointmentId)) {
                    const peers = Array.from(rooms.get(appointmentId) || [])
                        .map(client => ({
                            peerId: (client as any).peerId,
                            userId: (client as any).userId,
                            userRole: (client as any).userRole
                        }))
                        .filter(peer => peer.peerId && peer.peerId !== (ws as any).peerId); // Filter out self
                    
                    console.log(`📋 Sending peer list for room ${appointmentId}:`, peers);
                    
                    ws.send(JSON.stringify({
                        type: 'PEER_LIST',
                        peers,
                        appointmentId
                    }));
                }
            }
            // Handle PING
            else if (data.type === 'PING') {
                ws.send(JSON.stringify({
                    type: 'PONG',
                    timestamp: new Date().toISOString()
                }));
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        const appointmentId = (ws as any).appointmentId;
        const peerId = (ws as any).peerId;

        if (appointmentId && rooms.has(appointmentId)) {
            rooms.get(appointmentId)?.delete(ws);
            // Notify others in the room
            rooms.get(appointmentId)?.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ 
                        type: 'PEER_LEFT', 
                        peerId,
                        appointmentId
                    }));
                }
            });

            if (rooms.get(appointmentId)?.size === 0) {
                rooms.delete(appointmentId);
                console.log(`🧹 Room ${appointmentId} deleted (empty)`);
            }
        }
    });

    ws.on('error', (error) => {
        console.error('⚠️ WebSocket error:', error);
    });
});

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/specialties", specialtyRoutes);
app.use("/api/tele-expertise", teleExpertiseRequestRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/system-settings", systemSettingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/lab-results', labResultRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/allergies', allergyRoutes);
app.use('/api/immunizations', immunizationRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sehatynet";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔌 WebSocket server is running`);
        console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
