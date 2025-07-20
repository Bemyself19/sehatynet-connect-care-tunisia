#!/usr/bin/env node

/**
 * Test script for Google SSO implementation
 * Run this after setting up Google OAuth credentials
 */

import axios from 'axios';
import { readFileSync } from 'fs';

async function testGoogleSSO() {
  console.log('🔍 Testing Google SSO Setup...\n');

  // Test 1: Check if backend environment is configured
  console.log('1. Checking backend environment...');
  try {
    const envFile = readFileSync('./backend/.env', 'utf8');
    const hasGoogleClientId = envFile.includes('GOOGLE_CLIENT_ID=') && !envFile.includes('your_google_client_id_here');
    const hasGoogleClientSecret = envFile.includes('GOOGLE_CLIENT_SECRET=') && !envFile.includes('your_google_client_secret_here');
    
    if (hasGoogleClientId && hasGoogleClientSecret) {
      console.log('✅ Google OAuth credentials are configured in backend/.env');
    } else {
      console.log('❌ Google OAuth credentials are missing in backend/.env');
      console.log('   Please update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    }
  } catch (error) {
    console.log('❌ Could not read backend/.env file');
  }

  // Test 2: Check if backend server is running
  console.log('\n2. Checking backend server...');
  try {
    const response = await axios.get('https://localhost:5000/api/auth/health', { timeout: 3000 });
    console.log('✅ Backend server is running');
  } catch (error) {
    console.log('❌ Backend server is not running or not responding');
    console.log('   Please start the backend server: cd backend && npm run dev');
  }

  // Test 3: Check if frontend is configured
  console.log('\n3. Checking frontend configuration...');
  try {
    const response = await axios.get('https://localhost:5173', { timeout: 3000 });
    console.log('✅ Frontend server is running');
  } catch (error) {
    console.log('❌ Frontend server is not running');
    console.log('   Please start the frontend server: npm run dev');
  }

  // Test 4: Test Google auth endpoint
  console.log('\n4. Testing Google auth endpoint...');
  try {
    const response = await axios.post('http://localhost:5000/api/auth/google-auth', {
      idToken: 'test_token',
      role: 'patient'
    }, { timeout: 3000 });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Google auth endpoint is accessible (expected 400 for test token)');
    } else {
      console.log('❌ Google auth endpoint error:', error.message);
    }
  }

  console.log('\n🔧 Setup Instructions:');
  console.log('1. Make sure you have valid Google OAuth credentials in backend/.env');
  console.log('2. Start backend: cd backend && npm run dev');
  console.log('3. Start frontend: npm run dev');
  console.log('4. Test Google Sign-In at: http://localhost:5173/auth/login');
  console.log('\n📝 If you encounter issues:');
  console.log('- Check browser console for Google Identity Services errors');
  console.log('- Verify authorized origins in Google Cloud Console');
  console.log('- Ensure Client ID matches in both backend/.env and frontend');
}

testGoogleSSO().catch(console.error);
