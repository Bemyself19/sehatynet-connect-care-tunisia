# Google SSO Setup Guide for SehatyNet+

This guide explains how to set up Google Single Sign-On (SSO) for the SehatyNet+ healthcare platform.

## Overview

Google SSO allows users to sign in using their Google accounts, providing a seamless authentication experience. This implementation supports:

- Login and registration with Google accounts
- Automatic user verification for Google users
- Role-based authentication (patient, doctor, pharmacy, lab, radiologist)
- Fallback to traditional email/password authentication

## Prerequisites

1. A Google Cloud Console account
2. A project set up in Google Cloud Console
3. Access to configure OAuth 2.0 credentials

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `sehatynet-oauth`
4. Click "Create"

### 1.2 Enable Google+ API

1. Navigate to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: `SehatyNet+ Healthcare Platform`
   - User support email: Your support email
   - Developer contact information: Your contact email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users (for development)
6. Submit for verification (for production)

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Name: `SehatyNet+ Web Client`
5. Add authorized JavaScript origins:
   - Development: `https://localhost:5173`
   - Production: `https://yourdomain.com`
6. Add authorized redirect URIs:
   - Development: `https://localhost:5173`
   - Production: `https://yourdomain.com`
7. Click "Create"
8. Copy the Client ID and Client Secret

## Step 2: Environment Configuration

### 2.1 Backend Configuration

Add to `backend/.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 2.2 Frontend Configuration

Add to `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

⚠️ **Important**: Only add the Client ID to the frontend. Never expose the Client Secret in frontend code.

## Step 3: Development Testing

### 3.1 Start the Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### 3.2 Test Google Sign-In

1. Navigate to `https://localhost:5173/auth/login?type=patient`
2. Select your account type (Patient/Provider)
3. Click "Continue with Google"
4. Sign in with your Google account
5. Verify successful authentication and dashboard redirect

## Step 4: Production Deployment

### 4.1 Update OAuth Settings

1. Return to Google Cloud Console
2. Update "Authorized JavaScript origins" and "Authorized redirect URIs" with your production domain
3. Submit OAuth consent screen for verification if not already done

### 4.2 Environment Variables

Ensure production environment variables are set:

```env
# Backend production .env
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret

# Frontend production .env
VITE_GOOGLE_CLIENT_ID=your_production_client_id
```

## Features Implemented

### Backend Features

- Google token verification using `google-auth-library`
- User creation/login with Google credentials
- Automatic email verification for Google users
- Role-based authentication
- Protection against mixed authentication methods

### Frontend Features

- Google Sign-In component with proper error handling
- Integration with existing authentication flow
- Support for all user roles (patient, doctor, pharmacy, lab, radiologist)
- Multilingual support (English, French, Arabic)

## Database Schema Changes

The user model now includes:

```typescript
{
  googleId: String, // Google user ID
  authProvider: 'local' | 'google', // Authentication method
  password: { required: function() { return !this.googleId; } } // Optional for Google users
}
```

## Security Considerations

1. **Token Validation**: All Google tokens are verified server-side
2. **User Isolation**: Users cannot mix Google and local authentication
3. **Role Verification**: Google users must specify their role during registration
4. **Secure Storage**: Only access tokens are stored, refresh tokens are handled by Google

## Troubleshooting

### Common Issues

1. **"Invalid Google token" error**
   - Check that GOOGLE_CLIENT_ID matches in both frontend and backend
   - Verify token hasn't expired

2. **"Redirect URI mismatch" error**
   - Ensure redirect URIs in Google Console match your domain exactly
   - Include both `https://localhost:5173` for development

3. **"Access blocked" error**
   - Verify OAuth consent screen is configured
   - Check that user is added to test users (development mode)

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_GOOGLE_AUTH=true
```

## Support

For additional support:
- Check Google Cloud Console logs
- Review browser console for client-side errors
- Verify all environment variables are set correctly
- Test with multiple Google accounts to ensure consistency

## Version History

- v1.0.0: Initial Google SSO implementation
- Supports login, registration, and role-based authentication
- Full multilingual support
