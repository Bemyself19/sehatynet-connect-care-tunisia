import { Request, Response } from "express";
import Payment from "../models/payment.model";
import Appointment from "../models/appointment.model";
import User from "../models/user.model";
import crypto from "crypto";
import SystemSetting from '../models/systemSetting.model';

// Tunisie Monétique configuration
const TUNISIE_MONETIQUE_CONFIG = {
    merchantId: process.env.TUNISIE_MERCHANT_ID || '',
    terminalId: process.env.TUNISIE_TERMINAL_ID || '',
    secretKey: process.env.TUNISIE_SECRET_KEY || '',
    apiUrl: process.env.TUNISIE_API_URL || 'https://test.tunisie-monetique.tn/api',
    returnUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/payment/return',
    cancelUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/payment/cancel'
};

// Create payment session
export const createPaymentSession = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId, paymentMethod } = req.body;
    
    try {
        const patientId = (req as any).user.id;
        
        // Get appointment details with populated patient and provider
        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'firstName lastName email')
            .populate('providerId', 'firstName lastName consultationFee');
            
        if (!appointment) {
            res.status(404).json({ message: "Appointment not found" });
            return;
        }
        
        // Type assertion for populated fields
        const populatedAppointment = appointment as any;
        
        if (populatedAppointment.patientId._id.toString() !== patientId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        
        // Check if payments are enabled
        const paymentsSetting = await SystemSetting.findOne({ key: 'paymentsEnabled' });
        const paymentsEnabled = paymentsSetting ? Boolean(paymentsSetting.value) : true;
        if (!paymentsEnabled) {
            // Mark appointment as confirmed/paid, skip payment
            appointment.status = 'confirmed';
            await appointment.save();
            res.json({ paymentRequired: false, message: 'Payments are disabled. Appointment confirmed for free.' });
            return;
        }
        
        // Determine payment provider based on method
        let paymentProvider = 'tunisie_monetique';
        if (paymentMethod === 'international_card') {
            paymentProvider = 'adyen'; // or 'stripe' for international
        } else if (paymentMethod === 'paypal') {
            paymentProvider = 'paypal';
        }
        
        // Create payment record
        const payment = new Payment({
            appointmentId,
            patientId,
            providerId: populatedAppointment.providerId._id,
            amount: populatedAppointment.consultationFee || 0,
            currency: 'TND',
            description: `Consultation with Dr. ${populatedAppointment.providerId.firstName} ${populatedAppointment.providerId.lastName}`,
            paymentMethod,
            paymentProvider,
            metadata: {
                patientName: `${populatedAppointment.patientId.firstName} ${populatedAppointment.patientId.lastName}`,
                providerName: `${populatedAppointment.providerId.firstName} ${populatedAppointment.providerId.lastName}`,
                appointmentType: populatedAppointment.appointmentType,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });
        
        await payment.save();
        
        // Generate payment session based on provider
        if (paymentProvider === 'tunisie_monetique') {
            const sessionData = await createTunisieMonetiqueSession(payment, populatedAppointment);
            res.json({
                paymentId: payment._id,
                sessionData,
                redirectUrl: sessionData.redirectUrl
            });
        } else if (paymentProvider === 'adyen') {
            const sessionData = await createAdyenSession(payment, populatedAppointment);
            res.json({
                paymentId: payment._id,
                sessionData
            });
        } else {
            res.status(400).json({ message: "Unsupported payment provider" });
        }
        
    } catch (err) {
        console.error('Create payment session error:', err);
        res.status(500).json({ message: "Failed to create payment session", error: err });
    }
};

// Tunisie Monétique Click to Pay session creation
const createTunisieMonetiqueSession = async (payment: any, appointment: any) => {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const amount = Math.round(payment.amount * 100); // Convert to smallest currency unit
    
    // Create signature for Tunisie Monétique
    const signatureData = `${TUNISIE_MONETIQUE_CONFIG.merchantId}${TUNISIE_MONETIQUE_CONFIG.terminalId}${sessionId}${amount}${payment.currency}${TUNISIE_MONETIQUE_CONFIG.returnUrl}`;
    const signature = crypto.createHmac('sha256', TUNISIE_MONETIQUE_CONFIG.secretKey).update(signatureData).digest('hex');
    
    // Update payment with session data
    payment.tunisieMonetique = {
        sessionId,
        merchantId: TUNISIE_MONETIQUE_CONFIG.merchantId,
        terminalId: TUNISIE_MONETIQUE_CONFIG.terminalId
    };
    await payment.save();
    
    // Return session data for frontend
    return {
        sessionId,
        merchantId: TUNISIE_MONETIQUE_CONFIG.merchantId,
        terminalId: TUNISIE_MONETIQUE_CONFIG.terminalId,
        amount,
        currency: payment.currency,
        description: payment.description,
        returnUrl: TUNISIE_MONETIQUE_CONFIG.returnUrl,
        cancelUrl: TUNISIE_MONETIQUE_CONFIG.cancelUrl,
        signature,
        redirectUrl: `${TUNISIE_MONETIQUE_CONFIG.apiUrl}/payment/init`
    };
};

// Adyen session creation for international cards
const createAdyenSession = async (payment: any, appointment: any) => {
    // This would integrate with Adyen API for international payments
    // For now, return a mock session
    return {
        sessionId: crypto.randomBytes(16).toString('hex'),
        clientKey: process.env.ADYEN_CLIENT_KEY || '',
        environment: process.env.NODE_ENV === 'production' ? 'live' : 'test'
    };
};

// Handle Tunisie Monétique payment return
export const handleTunisieMonetiqueReturn = async (req: Request, res: Response): Promise<void> => {
    const { sessionId, transactionId, responseCode, responseMessage, signature } = req.body;
    
    try {
        // Verify signature
        const expectedSignature = crypto.createHmac('sha256', TUNISIE_MONETIQUE_CONFIG.secretKey)
            .update(`${sessionId}${transactionId}${responseCode}`)
            .digest('hex');
            
        if (signature !== expectedSignature) {
            res.status(400).json({ message: "Invalid signature" });
            return;
        }
        
        // Find payment by session ID
        const payment = await Payment.findOne({ 'tunisieMonetique.sessionId': sessionId });
        if (!payment) {
            res.status(404).json({ message: "Payment not found" });
            return;
        }
        
        // Update payment status
        payment.status = responseCode === '00' ? 'completed' : 'failed';
        payment.providerTransactionId = transactionId;
        
        // Initialize tunisieMonetique if it doesn't exist
        if (!payment.tunisieMonetique) {
            payment.tunisieMonetique = {
                sessionId: '',
                merchantId: '',
                terminalId: '',
                transactionId: '',
                authorizationCode: '',
                responseCode: '',
                responseMessage: ''
            };
        }
        
        payment.tunisieMonetique.transactionId = transactionId;
        payment.tunisieMonetique.responseCode = responseCode;
        payment.tunisieMonetique.responseMessage = responseMessage;
        
        if (payment.status === 'completed') {
            payment.paidAt = new Date();
            
            // Update appointment status
            await Appointment.findByIdAndUpdate(payment.appointmentId, { status: 'confirmed' });
        } else {
            payment.errorCode = responseCode;
            payment.errorMessage = responseMessage;
        }
        
        await payment.save();
        
        res.json({
            success: payment.status === 'completed',
            paymentId: payment._id,
            status: payment.status,
            message: responseMessage
        });
        
    } catch (err) {
        console.error('Tunisie Monétique return error:', err);
        res.status(500).json({ message: "Failed to process payment return", error: err });
    }
};

// Get payment status
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    const { paymentId } = req.params;
    const userId = (req as any).user.id;
    
    try {
        const payment = await Payment.findById(paymentId)
            .populate('appointmentId')
            .populate('patientId', 'firstName lastName')
            .populate('providerId', 'firstName lastName');
            
        if (!payment) {
            res.status(404).json({ message: "Payment not found" });
            return;
        }
        
        if (payment.patientId._id.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        
        res.json({
            paymentId: payment._id,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            createdAt: payment.createdAt,
            paidAt: payment.paidAt,
            appointment: payment.appointmentId
        });
        
    } catch (err) {
        console.error('Get payment status error:', err);
        res.status(500).json({ message: "Failed to get payment status", error: err });
    }
};

// Get user's payment history
export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    
    try {
        const payments = await Payment.find({ patientId: userId })
            .populate('appointmentId')
            .populate('providerId', 'firstName lastName specialization')
            .sort({ createdAt: -1 });
            
        res.json(payments);
        
    } catch (err) {
        console.error('Get payment history error:', err);
        res.status(500).json({ message: "Failed to get payment history", error: err });
    }
}; 