import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    // Basic payment info
    appointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Appointment', 
        required: true 
    },
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    providerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    // Payment details
    amount: { 
        type: Number, 
        required: true 
    },
    currency: { 
        type: String, 
        default: 'TND' 
    },
    description: { 
        type: String, 
        required: true 
    },
    
    // Payment method
    paymentMethod: { 
        type: String, 
        enum: ['click_to_pay', 'international_card', 'paypal', 'mobile_money', 'bank_transfer'],
        required: true 
    },
    
    // Payment provider
    paymentProvider: { 
        type: String, 
        enum: ['tunisie_monetique', 'paypal', 'adyen', 'stripe'],
        required: true 
    },
    
    // Status tracking
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending' 
    },
    
    // Provider-specific data
    providerTransactionId: { 
        type: String 
    },
    providerResponse: { 
        type: mongoose.Schema.Types.Mixed 
    },
    
    // Tunisie Monétique specific fields
    tunisieMonetique: {
        sessionId: String,
        merchantId: String,
        terminalId: String,
        transactionId: String,
        authorizationCode: String,
        responseCode: String,
        responseMessage: String
    },
    
    // International payment fields
    internationalPayment: {
        cardLast4: String,
        cardBrand: String,
        country: String,
        paymentIntentId: String
    },
    
    // Error handling
    errorCode: String,
    errorMessage: String,
    
    // Timestamps
    paidAt: Date,
    refundedAt: Date,
    
    // Metadata
    metadata: {
        patientName: String,
        providerName: String,
        appointmentType: String,
        ipAddress: String,
        userAgent: String
    }
}, { 
    timestamps: true 
});

// Indexes for performance
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ patientId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ providerTransactionId: 1 });

export default mongoose.model("Payment", paymentSchema); 