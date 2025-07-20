/**
 * Debug Google SSO Issues
 * This script helps identify common Google Sign-In problems
 */

console.log('🔍 Debugging Google SSO Setup...\n');

// Check 1: Environment Variables
console.log('1. Environment Variables:');
console.log('  VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('  Client ID Preview:', import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 20) + '...');

// Check 2: Google Identity Services Library
console.log('\n2. Google Identity Services:');
if (typeof window !== 'undefined') {
  console.log('  window.google:', window.google ? '✅ Loaded' : '❌ Not loaded');
  if (window.google) {
    console.log('  google.accounts:', window.google.accounts ? '✅ Available' : '❌ Missing');
    console.log('  google.accounts.id:', window.google.accounts?.id ? '✅ Available' : '❌ Missing');
  }
} else {
  console.log('  Running in Node.js environment');
}

// Check 3: DOM Elements
console.log('\n3. DOM Elements:');
if (typeof document !== 'undefined') {
  const googleScript = document.querySelector('script[src*="accounts.google.com"]');
  console.log('  Google Script Tag:', googleScript ? '✅ Found' : '❌ Missing');
  
  const googleButtons = document.querySelectorAll('[data-testid*="google"], button[class*="google"]');
  console.log('  Google Sign-In Buttons:', googleButtons.length > 0 ? `✅ Found ${googleButtons.length}` : '❌ None found');
} else {
  console.log('  Running outside browser environment');
}

// Check 4: Network Connectivity
console.log('\n4. Network Test:');
if (typeof fetch !== 'undefined') {
  fetch('https://accounts.google.com/gsi/client')
    .then(response => {
      console.log('  Google GSI Client:', response.ok ? '✅ Accessible' : '❌ Network error');
    })
    .catch(error => {
      console.log('  Google GSI Client: ❌ Network error -', error.message);
    });
} else {
  console.log('  Fetch not available');
}

// Check 5: Console Errors
console.log('\n5. Console Monitoring:');
console.log('  Check browser console for any errors related to:');
console.log('  - Google Identity Services');
console.log('  - CORS errors');
console.log('  - Script loading failures');
console.log('  - Token verification errors');

console.log('\n📝 Common Solutions:');
console.log('1. Clear browser cache and reload');
console.log('2. Check Google Cloud Console authorized origins');
console.log('3. Verify Client ID matches in both frontend and backend');
console.log('4. Check network connectivity');
console.log('5. Look for browser console errors');

export {};
