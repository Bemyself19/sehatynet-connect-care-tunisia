import express from "express";
import { 
    createPaymentSession, 
    handleTunisieMonetiqueReturn, 
    getPaymentStatus, 
    getPaymentHistory,
    handleFlouciVerification
} from "../controllers/payment.controller";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Create payment session
router.post("/session", createPaymentSession);

// Handle Tunisie Monétique payment return (no auth required for webhook)
router.post("/tunisie-monetique/return", handleTunisieMonetiqueReturn);

// Handle Flouci payment verification
router.get("/flouci/verify/:paymentId", handleFlouciVerification);

// Get payment status
router.get("/:paymentId/status", getPaymentStatus);

// Get user's payment history
router.get("/history", getPaymentHistory);

export default router;