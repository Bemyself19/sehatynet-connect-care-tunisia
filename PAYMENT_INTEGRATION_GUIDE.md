# Payment Integration Guide - SehatyNet+ Tunisia

## Overview

This guide covers the implementation of payment processing for the SehatyNet+ telehealth platform in Tunisia, supporting both local (Tunisie Monétique) and international payment methods.

## Payment Methods Supported

### 1. Tunisie Monétique - Click to Pay
- **Provider:** SPSi (Tunisie Monétique)
- **Cards:** All Tunisian bank cards
- **Currency:** TND (Tunisian Dinar)
- **Status:** ✅ Implemented

### 2. International Cards
- **Provider:** Adyen (recommended) or Stripe
- **Cards:** Visa, Mastercard, American Express
- **Currency:** TND, USD, EUR
- **Status:** 🔄 Partially implemented

### 3. PayPal
- **Provider:** PayPal
- **Currency:** Multiple currencies
- **Status:** 🔄 Partially implemented

### 4. Mobile Money (Future)
- **Providers:** Orange Money, Tunisie Telecom Money
- **Status:** 📋 Planned

### 5. Bank Transfer (Future)
- **Status:** 📋 Planned

## Backend Implementation

### 1. Environment Variables

Add these to your `.env` file:

```env
# Tunisie Monétique Configuration
TUNISIE_MERCHANT_ID=your_merchant_id
TUNISIE_TERMINAL_ID=your_terminal_id
TUNISIE_SECRET_KEY=your_secret_key
TUNISIE_API_URL=https://test.tunisie-monetique.tn/api

# International Payment Providers
ADYEN_CLIENT_KEY=your_adyen_client_key
ADYEN_API_KEY=your_adyen_api_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### 2. Database Schema

The payment model includes:
- Basic payment info (appointment, patient, provider)
- Payment method and provider
- Status tracking
- Provider-specific data (Tunisie Monétique, Adyen, etc.)
- Error handling and metadata

### 3. API Endpoints

```
POST /api/payments/session          # Create payment session
POST /api/payments/tunisie-monetique/return  # Handle Tunisie Monétique return
GET  /api/payments/:paymentId/status # Get payment status
GET  /api/payments/history          # Get user's payment history
```

## Frontend Implementation

### 1. Payment Flow

1. **Patient books appointment** → Payment required
2. **Payment form opens** → Choose payment method
3. **Create payment session** → Backend generates session
4. **Redirect to payment provider** → Tunisie Monétique or inline payment
5. **Payment processing** → Provider handles payment
6. **Return to platform** → Verify payment status
7. **Appointment confirmed** → Success or failure

### 2. Components

- `TunisiaPaymentForm.tsx` - Main payment form with method selection
- `PaymentReturn.tsx` - Handle payment returns from providers
- `PaymentHistory.tsx` - Display user's payment history

## Tunisie Monétique Integration

### 1. Setup Requirements

1. **Merchant Account:** Register with Tunisie Monétique
2. **API Credentials:** Get merchant ID, terminal ID, and secret key
3. **Test Environment:** Use test credentials for development
4. **Production Environment:** Switch to live credentials

### 2. Integration Steps

1. **Create Payment Session:**
   ```javascript
   const sessionData = await createTunisieMonetiqueSession(payment, appointment);
   ```

2. **Redirect to Tunisie Monétique:**
   ```javascript
   window.location.href = sessionData.redirectUrl;
   ```

3. **Handle Payment Return:**
   ```javascript
   // Verify signature and update payment status
   const result = await handleTunisieMonetiqueReturn(paymentData);
   ```

### 3. Security

- **Signature Verification:** All requests must be signed
- **HTTPS Required:** All communications must be encrypted
- **No Card Storage:** Never store card data directly

## International Payment Integration

### 1. Adyen Integration (Recommended)

```javascript
// Install Adyen SDK
npm install @adyen/adyen-web

// Create payment session
const sessionData = await createAdyenSession(payment, appointment);

// Initialize Adyen Drop-in
const checkout = await AdyenCheckout(sessionData);
checkout.mount('#payment-container');
```

### 2. PayPal Integration

```javascript
// Install PayPal SDK
npm install @paypal/react-paypal-js

// Create PayPal order
const order = await createPayPalOrder(payment);

// Process payment
const result = await processPayPalPayment(order);
```

## Testing

### 1. Tunisie Monétique Test Cards

```
Card Number: 4111111111111111
Expiry: 12/25
CVV: 123
```

### 2. Test Scenarios

- ✅ Successful payment
- ❌ Failed payment (insufficient funds)
- ❌ Cancelled payment
- ❌ Network timeout
- ❌ Invalid signature

## Production Deployment

### 1. Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] API keys rotated regularly
- [ ] Webhook endpoints secured
- [ ] Error logging configured
- [ ] Payment monitoring enabled

### 2. Monitoring

- **Payment Success Rate:** Track successful vs failed payments
- **Response Times:** Monitor payment processing times
- **Error Rates:** Track and alert on payment errors
- **Revenue Tracking:** Monitor payment amounts and trends

### 3. Compliance

- **PCI DSS:** Ensure compliance with payment card standards
- **Local Regulations:** Follow Tunisian financial regulations
- **Data Protection:** Implement GDPR-compliant data handling
- **Audit Trail:** Maintain complete payment audit logs

## Troubleshooting

### Common Issues

1. **Invalid Signature:**
   - Check secret key configuration
   - Verify signature generation algorithm
   - Ensure all required fields are included

2. **Payment Not Confirmed:**
   - Check webhook endpoint configuration
   - Verify return URL settings
   - Monitor payment status updates

3. **Session Expired:**
   - Implement session timeout handling
   - Add retry mechanisms
   - Improve user experience with clear messaging

### Support Contacts

- **Tunisie Monétique:** Contact SPSi support
- **Adyen:** Use Adyen support portal
- **PayPal:** PayPal developer support

## Future Enhancements

1. **Mobile Money Integration:** Orange Money, Tunisie Telecom Money
2. **Bank Transfer:** Direct bank transfers
3. **Subscription Payments:** Recurring payment support
4. **Multi-Currency:** Support for USD, EUR payments
5. **Payment Analytics:** Advanced reporting and analytics
6. **Refund Management:** Automated refund processing

## Resources

- [Tunisie Monétique Documentation](https://www.tunisie-monetique.tn/)
- [Adyen Documentation](https://docs.adyen.com/)
- [PayPal Developer Documentation](https://developer.paypal.com/)
- [PCI DSS Guidelines](https://www.pcisecuritystandards.org/) 