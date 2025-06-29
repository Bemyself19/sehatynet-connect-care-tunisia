import React from 'react';
import { Heart } from 'lucide-react';

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 36, className = '' }) => (
  <span
    className={`inline-flex items-center justify-center relative ${className}`}
    style={{ width: size, height: size }}
  >
    <Heart className="text-blue-600" style={{ width: size, height: size }} />
    <span
      className="absolute rounded-full bg-green-500 border-2 border-white"
      style={{
        width: size * 0.36,
        height: size * 0.36,
        top: -size * 0.08,
        right: -size * 0.08,
      }}
    />
  </span>
);

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = '' }) => (
  <span className={`flex items-center space-x-3 ${className}`}>
    <Logo size={size} />
    <span>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        SehatyNet+
      </span>
      <div className="text-xs text-gray-500 -mt-1">Telehealth Platform</div>
    </span>
  </span>
);

export default Logo; 