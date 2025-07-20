import { Request, Response } from "express";
import Payment from "../models/payment.model";
import Appointment from "../models/appointment.model";
import User from "../models/user.model";
import crypto from "crypto";
import SystemSetting from '../models/systemSetting.model';
import axios from "axios";

// Define interfaces for Flouci API responses
interface FlouciPaymentResult {
  payment_id: string;
  link: string;
  status: string;
  receipt_id?: string;
}

interface FlouciApiResponse {
  result: FlouciPaymentResult;
  success: boolean;
  error_code?: string;
  error_message?: string;
}

// Tunisie Monétique configuration
const TUNISIE_MONETIQUE_CONFIG = {
    merchantId: process.env.TUNISIE_MERCHANT_ID || '',
    terminalId: process.env.TUNISIE_TERMINAL_ID || '',
    secretKey: process.env.TUNISIE_SECRET_KEY || '',
    apiUrl: process.env.TUNISIE_API_URL || 'https://test.tunisie-monetique.tn/api',
    returnUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/payment/return',
    cancelUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/payment/cancel'
};

// Flouci configuration
const FLOUCI_CONFIG = {
    appToken: process.env.FLOUCI_APP_TOKEN || '',
    appSecret: process.env.FLOUCI_APP_SECRET || '',
    apiUrl: process.env.FLOUCI_API_URL || 'https://developers.flouci.com/api',
    successUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + (process.env.FLOUCI_SUCCESS_URL || '/payment/success'),
    failUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + (process.env.FLOUCI_FAIL_URL || '/payment/failed')
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
            // Mark appointment as pending doctor approval, skip payment
            appointment.status = 'pending';
            await appointment.save();
            
            // Create notification for doctor to review appointment
            const Notification = require('../models/notification.model').default;
            await Notification.create({
                userId: populatedAppointment.providerId._id,
                type: 'appointment_pending',
                title: 'New Appointment Request',
                message: `${populatedAppointment.patientId.firstName} ${populatedAppointment.patientId.lastName} has booked an appointment for ${new Date(appointment.scheduledDate).toLocaleDateString()}`,
                priority: 'medium',
                relatedEntity: {
                    type: 'appointment',
                    id: appointment._id
                }
            });
            
            res.json({ paymentRequired: false, message: 'Payments are disabled. Appointment submitted for doctor approval.' });
            return;
        }
        
        // Determine payment provider based on method
        let paymentProvider = 'tunisie_monetique';
        if (paymentMethod === 'international_card') {
            paymentProvider = 'adyen'; // or 'stripe' for international
        } else if (paymentMethod === 'paypal') {
            paymentProvider = 'paypal';
        } else if (paymentMethod === 'flouci') {
            paymentProvider = 'flouci';
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
        } else if (paymentProvider === 'flouci') {
            const sessionData = await createFlouciSession(payment, populatedAppointment);
            res.json({
                paymentId: payment._id,
                sessionData,
                redirectUrl: sessionData.paymentUrl
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

// Flouci session creation for local payments
const createFlouciSession = async (payment: any, appointment: any) => {
    try {
        // Create a unique tracking ID
        const developerTrackingId = crypto.randomBytes(16).toString('hex');
        
        // Prepare the request payload
        const payload = {
            app_token: FLOUCI_CONFIG.appToken,
            app_secret: FLOUCI_CONFIG.appSecret,
            amount: payment.amount,
            accept_card: true,
            session_timeout_secs: 1200, // 20 minutes
            success_link: FLOUCI_CONFIG.successUrl + `?paymentId=${payment._id}`,
            fail_link: FLOUCI_CONFIG.failUrl + `?paymentId=${payment._id}`,
            developer_tracking_id: developerTrackingId,
        };
        
        // Make API call to Flouci
        const response = await axios.post<FlouciApiResponse>(`${FLOUCI_CONFIG.apiUrl}/generate_payment`, payload);
        
        if (response.status !== 200 || !response.data?.result) {
            throw new Error('Failed to create Flouci payment session');
        }
        
        const result = response.data.result;
        
        // Update payment with Flouci session data
        if (!payment.flouci) {
            payment.flouci = {
                paymentUrl: result.link,
                paymentId: result.payment_id,
                developerTrackingId: developerTrackingId,
                status: 'pending'
            };
        } else {
            payment.flouci.paymentUrl = result.link;
            payment.flouci.paymentId = result.payment_id;
            payment.flouci.developerTrackingId = developerTrackingId;
            payment.flouci.status = 'pending';
        }
        
        await payment.save();
        
        // Return session data for frontend
        return {
            paymentUrl: result.link,
            paymentId: result.payment_id,
            developerTrackingId: developerTrackingId
        };
    } catch (error) {
        console.error('Flouci session creation error:', error);
        throw error;
    }
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
            
            // Update appointment status to pending doctor approval
            const appointment = await Appointment.findByIdAndUpdate(payment.appointmentId, { status: 'pending' }, { new: true })
                .populate('patientId', 'firstName lastName')
                .populate('providerId', '_id');
            
            // Create notification for doctor to review paid appointment
            if (appointment) {
                const Notification = require('../models/notification.model').default;
                const populatedAppointment = appointment as any;
                await Notification.create({
                    userId: populatedAppointment.providerId._id,
                    type: 'appointment_pending',
                    title: 'New Paid Appointment Request',
                    message: `${populatedAppointment.patientId.firstName} ${populatedAppointment.patientId.lastName} has booked and paid for an appointment on ${new Date(appointment.scheduledDate).toLocaleDateString()}`,
                    priority: 'medium',
                    relatedEntity: {
                        type: 'appointment',
                        id: appointment._id
                    }
                });
            }
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

// Handle Flouci payment verification
export const handleFlouciVerification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { paymentId } = req.params;
        
        // Find payment record
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            res.status(404).json({ success: false, message: "Payment not found" });
            return;
        }
        
        if (payment.paymentProvider !== 'flouci') {
            res.status(400).json({ success: false, message: "Invalid payment provider" });
            return;
        }
        
        // Initialize flouci object if it doesn't exist
        if (!payment.flouci) {
            res.status(400).json({ success: false, message: "Invalid payment configuration" });
            return;
        }
        
        // Verify payment status with Flouci API
        const verifyUrl = `${FLOUCI_CONFIG.apiUrl}/verify_payment/${payment.flouci.paymentId}`;
        
        const verifyPayload = {
            app_token: FLOUCI_CONFIG.appToken,
        };
        
        const response = await axios.post<FlouciApiResponse>(verifyUrl, verifyPayload);
        
        if (response.status !== 200 || !response.data?.result) {
            payment.status = 'failed';
            payment.errorMessage = 'Failed to verify payment';
            await payment.save();
            
            res.json({
                success: false,
                message: "Failed to verify payment",
                paymentStatus: 'failed'
            });
            return;
        }
        
        const result = response.data.result;
        
        // Update payment status based on Flouci response
        const paymentStatus = result.status;
        
        payment.flouci.status = paymentStatus;
        payment.providerResponse = result;
        
        if (paymentStatus === 'completed' || paymentStatus === 'paid') {
            // Payment successful
            payment.status = 'completed';
            payment.paidAt = new Date();
            
            // Save receipt ID if available
            if (result.receipt_id) {
                payment.flouci.receiptId = result.receipt_id;
            }
            
            // Update appointment status to pending doctor approval
            const appointment = await Appointment.findByIdAndUpdate(payment.appointmentId, { status: 'pending' }, { new: true })
                .populate('patientId', 'firstName lastName')
                .populate('providerId', '_id');
            
            // Create notification for doctor to review paid appointment
            if (appointment) {
                const Notification = require('../models/notification.model').default;
                const populatedAppointment = appointment as any;
                await Notification.create({
                    userId: populatedAppointment.providerId._id,
                    type: 'appointment_pending',
                    title: 'New Paid Appointment Request',
                    message: `${populatedAppointment.patientId.firstName} ${populatedAppointment.patientId.lastName} has booked and paid for an appointment on ${new Date(appointment.scheduledDate).toLocaleDateString()}`,
                    priority: 'medium',
                    relatedEntity: {
                        type: 'appointment',
                        id: appointment._id
                    }
                });
            }
            
            res.json({
                success: true,
                message: "Payment completed successfully",
                paymentStatus: 'completed'
            });
        } else if (paymentStatus === 'unpaid' || paymentStatus === 'failed') {
            // Payment failed
            payment.status = 'failed';
            payment.errorMessage = 'Payment was not completed';
            
            res.json({
                success: false,
                message: "Payment was not completed",
                paymentStatus: 'failed'
            });
        } else {
            // Payment in other status (pending, etc.)
            res.json({
                success: false,
                message: "Payment is still being processed",
                paymentStatus: paymentStatus
            });
        }
        
        await payment.save();
        
    } catch (error) {
        console.error('Flouci verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: "An error occurred while verifying the payment" 
        });
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