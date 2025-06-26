import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import appointmentRoutes from "./routes/appointment.routes";
import medicalRecordRoutes from "./routes/medicalRecord.routes";
import prescriptionRoutes from "./routes/prescription.routes";
import specialtyRoutes from './routes/specialty.routes';
import teleExpertiseRequestRoutes from './routes/teleExpertiseRequest.routes';

dotenv.config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket connection handling
const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws) => {
    console.log('🔌 WebSocket client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'join-room') {
                const { appointmentId, peerId } = data;
                if (!rooms.has(appointmentId)) {
                    rooms.set(appointmentId, new Set());
                }
                rooms.get(appointmentId)?.add(ws);
                (ws as any).appointmentId = appointmentId;
                (ws as any).peerId = peerId;

                // Notify others in the room
                rooms.get(appointmentId)?.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'user-connected', peerId }));
                    }
                });
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
                    client.send(JSON.stringify({ type: 'user-disconnected', peerId }));
                }
            });

            if (rooms.get(appointmentId)?.size === 0) {
                rooms.delete(appointmentId);
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
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
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/tele-expertise-requests', teleExpertiseRequestRoutes);

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
