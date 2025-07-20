import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { UserRole } from '@/types/user';
import { useTranslation } from 'react-i18next';

interface GoogleSignInProps {
  role: UserRole;
  onSuccess: (result: { token: string; user: any; message: string }) => void;
  onError?: (error: string) => void;
  mode?: 'signin' | 'signup';
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ 
  role, 
  onSuccess, 
  onError, 
  mode = 'signin',
  disabled = false 
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    // Check if Google script is already loaded
    if (window.google) {
      console.log('Google Identity Services already loaded');
      initializeGoogleSignIn();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;
    if (existingScript) {
      console.log('Google script already in DOM, waiting for load...');
      existingScript.onload = initializeGoogleSignIn;
      return;
    }

    // Load Google Identity Services script
    console.log('Loading Google Identity Services script...');
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Identity Services script loaded successfully');
      initializeGoogleSignIn();
    };
    script.onerror = (error) => {
      console.error('Failed to load Google Identity Services script:', error);
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove script to avoid issues with multiple components
      console.log('GoogleSignIn component unmounting');
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '626163039742-pej6m8bh5dbc2421uvjk82o8cg4iu5jb.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false, // Disable FedCM
        });
        // Always render the Google button in a visible container
        const buttonContainer = document.getElementById('google-signin-button');
        if (buttonContainer) {
          buttonContainer.innerHTML = '';
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: 'outline',
            size: 'large',
            width: 300,
            text: mode === 'signin' ? 'signin_with' : 'signup_with',
          });
          buttonContainer.classList.remove('hidden');
          console.log('Google button rendered in container with width 300');
        } else {
          console.error('Google signin button container not found');
        }
        console.log('Google Sign-In initialized successfully');
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
      }
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      console.log('[GoogleSignIn] Received Google credential:', response.credential);
      let result;
      try {
        result = await api.googleAuth({
          credential: response.credential,
          role: role
        });
      } catch (apiError: any) {
        // Try to extract backend error message
        let backendMessage = apiError?.message;
        if (apiError?.response) {
          try {
            const data = await apiError.response.json();
            backendMessage = data.message || backendMessage;
          } catch {}
        }
        console.error('[GoogleSignIn] Backend /auth/google-auth error:', backendMessage, apiError);
        throw new Error(backendMessage || 'Google authentication failed (backend)');
      }

      // Always set the token in sessionStorage for consistency
      sessionStorage.setItem('authToken', result.token);

      onSuccess(result);
      toast.success(result.message || 'Successfully authenticated with Google');
    } catch (error: any) {
      const errorMessage = error.message || 'Google authentication failed';
      console.error('[GoogleSignIn] Google login error:', errorMessage, error);
      if (onError) {
        onError(errorMessage);
      }
      toast.error(errorMessage);
    }
  };

  // No need for handleGoogleSignIn anymore

  return (
    <div className="w-full flex items-center justify-center">
      <div id="google-signin-button"></div>
    </div>
  );
};

export default GoogleSignIn;
