import React from 'react';
import { AlertTriangle, Camera, Mic, Shield, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface VideoCallTroubleshootingProps {
  error?: string;
  onRetry: () => void;
}

const VideoCallTroubleshooting: React.FC<VideoCallTroubleshootingProps> = ({ error, onRetry }) => {
  const { t } = useTranslation();

  const troubleshootingSteps = [
    {
      icon: <Shield className="h-4 w-4" />,
      title: 'Allow Permissions',
      description: 'Click the camera/microphone icon in your browser address bar and allow access.',
      detail: 'Browser permissions are required for video calls to work properly.'
    },
    {
      icon: <Camera className="h-4 w-4" />,
      title: 'Check Camera',
      description: 'Ensure no other applications are using your camera.',
      detail: 'Close video chat apps, Zoom, Teams, or other camera applications.'
    },
    {
      icon: <Mic className="h-4 w-4" />,
      title: 'Check Microphone',
      description: 'Make sure your microphone is connected and working.',
      detail: 'Test your microphone in system settings or other applications.'
    },
    {
      icon: <RefreshCw className="h-4 w-4" />,
      title: 'Reload Page',
      description: 'Try refreshing the page and allowing permissions again.',
      detail: 'Sometimes a fresh page load resolves permission issues.'
    }
  ];

  const isHttpsRequired = location.protocol === 'http:' && location.hostname !== 'localhost';

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Camera and microphone access is required for video calls.'}
        </AlertDescription>
      </Alert>

      {isHttpsRequired && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>HTTPS Required:</strong> Your browser requires a secure connection (HTTPS) for camera and microphone access. 
            Please access the application using HTTPS or contact your administrator.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Troubleshooting Steps</h3>
        
        {troubleshootingSteps.map((step, index) => (
          <div key={index} className="flex gap-3 p-4 border rounded-lg">
            <div className="flex-shrink-0 mt-1">
              {step.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{step.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              <p className="text-xs text-gray-500 mt-2">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Button onClick={onRetry} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Browser Support:</strong> Chrome, Firefox, Safari, Edge (latest versions)</p>
          <p><strong>Requirements:</strong> HTTPS connection (except localhost), camera/microphone permissions</p>
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium">Technical Details</summary>
        <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
          <p>Protocol: {location.protocol}</p>
          <p>Host: {location.hostname}</p>
          <p>getUserMedia Support: {navigator.mediaDevices?.getUserMedia ? '✓' : '✗'}</p>
          <p>WebRTC Support: {window.RTCPeerConnection ? '✓' : '✗'}</p>
        </div>
      </details>
    </div>
  );
};

export default VideoCallTroubleshooting;
