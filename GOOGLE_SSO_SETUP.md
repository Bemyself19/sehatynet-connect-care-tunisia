# Google SSO Setup Guide for SehatyNet+

This guide explains how to set up Google Single Sign-On (SSO) for the SehatyNet+ healthcare platform.

## Overview

Google SSO has been integrated into both the login and registration flows, allowing users to authenticate using their Google accounts instead of creating separate credentials. This provides a seamless experience while maintaining security.

## Features Added

### Backend Integration
- ✅ Google OAuth2 Client integration
- ✅ Google token verification
- ✅ User account creation/linking with Google accounts
- ✅ Dual authentication support (local + Google)
- ✅ Role-based Google authentication
- ✅ Database schema updates for Google users

### Frontend Integration
- ✅ Google Sign-In component
- ✅ Login page Google SSO integration
- ✅ Registration page Google SSO integration
- ✅ Multilingual support (EN/FR/AR)
- ✅ Modern Google Identity Services

## Google Cloud Console Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity Services

### 2. Configure OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Configure the following:
   - **Name**: SehatyNet+ Healthcare Platform
   - **Authorized JavaScript origins**:
     - `https://localhost:5173` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://localhost:5173/auth/google/callback` (for development)
     - `https://yourdomain.com/auth/google/callback` (for production)

### 3. Get Your Credentials

After creating the OAuth client, you'll receive:
- **Client ID** (public)
- **Client Secret** (private)

## Environment Configuration

### Backend (.env)

Add these variables to your `backend/.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Frontend (.env)

Add this variable to your root `.env` file:

```env
# Google Client ID for frontend
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Note**: Only the Client ID is needed for the frontend. The Client Secret should never be exposed to the client-side code.

## Database Changes

The user schema has been updated to support Google SSO:

```typescript
{
  googleId: { type: String, unique: true, sparse: true }, // Google SSO ID
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }, // Authentication provider
  password: { type: String, required: function() { return !this.googleId; } }, // Optional for Google users
}
```

## API Endpoints

### New Google Authentication Endpoint

```
POST /api/auth/google-auth
```

**Request Body:**
```json
{
  "credential": "google_jwt_token",
  "role": "patient" // or "doctor", "pharmacy", "lab", "radiologist"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": { /* user object */ },
  "message": "Successfully authenticated with Google"
}
```

## User Experience Flow

### For New Users (Registration)
1. User clicks "Sign up with Google"
2. Google Sign-In popup appears
3. User authorizes the application
4. Backend creates new account with Google credentials
5. User is automatically logged in

### For Existing Users (Login)
1. User clicks "Continue with Google"
2. Google Sign-In popup appears
3. System checks if Google account is linked
4. If linked: User is logged in
5. If not linked but email exists: Error message suggests linking accounts

### Account Linking
- Users with existing email/password accounts cannot directly link Google accounts
- They need to contact support for manual linking
- This prevents unauthorized account takeovers

## Security Features

### Token Verification
- All Google tokens are verified server-side using Google's OAuth2 library
- Invalid or expired tokens are rejected

### Account Protection
- Prevents Google account takeover of existing email accounts
- Separate authentication providers are tracked
- Google users cannot login with password (and vice versa)

### Role-Based Access
- Google authentication respects the same role system
- Users must specify their role during registration
- Role mismatches are prevented

## Multilingual Support

Google SSO buttons and messages are translated into:
- **English**: "Continue with Google", "Sign up with Google"
- **French**: "Continuer avec Google", "S'inscrire avec Google"
- **Arabic**: "المتابعة مع جوجل", "التسجيل مع جوجل"

## Testing

### Development Testing
1. Ensure your domain is added to authorized origins
2. Use the development Google Client ID
3. Test both login and registration flows
4. Verify role-based authentication works correctly

### Production Deployment
1. Update authorized origins with production domain
2. Use production Google Client ID and Secret
3. Test SSL/HTTPS configuration
4. Verify CORS settings allow Google domains

## Troubleshooting

### Common Issues

1. **"Invalid Client ID"**
   - Check that VITE_GOOGLE_CLIENT_ID is set correctly
   - Verify the Client ID matches Google Cloud Console

2. **"Unauthorized Origin"**
   - Add your domain to authorized JavaScript origins
   - Include both HTTP (dev) and HTTPS (prod) if needed

3. **"Google Sign-In not loading"**
   - Check browser console for errors
   - Verify Google Identity Services script is loading
   - Check for ad blockers or privacy extensions

4. **"Account linking error"**
   - This is by design for security
   - Users need to contact support for manual linking

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Browser Support

Google Identity Services supports:
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## GDPR Compliance

Google SSO integration maintains GDPR compliance:
- User consent is required before Google authentication
- Google account data is only used for authentication
- Users can delete their accounts at any time
- Privacy policy should mention Google authentication

## Production Checklist

- [ ] Google Cloud Console project configured
- [ ] OAuth 2.0 credentials created
- [ ] Production domains added to authorized origins
- [ ] Environment variables set correctly
- [ ] SSL/HTTPS configured
- [ ] Database schema updated
- [ ] Testing completed for all user roles
- [ ] Privacy policy updated
- [ ] User documentation provided

## Support

For issues with Google SSO integration:
1. Check this documentation
2. Review Google Cloud Console configuration
3. Check application logs for specific errors
4. Contact the development team

---

**Note**: This implementation follows Google's latest Identity Services guidelines and security best practices for healthcare applications.
