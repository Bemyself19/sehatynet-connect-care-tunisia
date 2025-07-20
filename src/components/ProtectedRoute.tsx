import React from 'react';
import { Navigate } from 'react-router-dom';

// Dummy user authentication check. Replace with your actual auth logic.
const isAuthenticated = () => {
  // Check if a JWT token exists in sessionStorage under the correct key
  return Boolean(sessionStorage.getItem('authToken'));
};

interface ProtectedRouteProps {
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/auth/login" replace />;
  }
  return element;
};

export default ProtectedRoute;
