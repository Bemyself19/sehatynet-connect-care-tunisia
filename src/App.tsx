import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import LoginSelection from "./pages/auth/LoginSelection";
import Register from "./pages/auth/Register";
import RegisterSelection from "./pages/auth/RegisterSelection";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import BookAppointment from "./pages/appointments/BookAppointment";
import Profile from "./pages/profile/Profile";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/auth/AdminLogin";
import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
import PharmacyDashboard from "./pages/dashboards/PharmacyDashboard";
import LabDashboard from "./pages/dashboards/LabDashboard";
import RadiologistDashboard from "./pages/dashboards/RadiologistDashboard";
import LiveConsultation from "./pages/appointments/LiveConsultation";
import TeleExpertiseRequestsPage from './pages/tele-expertise';
import MedicalRecordDetail from './pages/medical-records/MedicalRecordDetail';
import { useUser } from './hooks/useUser';
import CreateServiceRequest from './pages/appointments/CreateServiceRequest';
import PharmacyProfile from './pages/profile/PharmacyProfile';
import LabProfile from './pages/profile/LabProfile';
import RadiologyProfile from './pages/profile/RadiologyProfile';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import PatientLayout from './components/layouts/PatientLayout';
import AppointmentsList from './components/patient/AppointmentsList';
import MedicalRecords from './components/patient/MedicalRecords';

const queryClient = new QueryClient();

// A component to protect routes that require authentication and enforce role-based dashboard access
const dashboardRoutes: Record<string, string> = {
  patient: '/dashboard/patient',
  doctor: '/dashboard/doctor',
  pharmacy: '/dashboard/pharmacy',
  lab: '/dashboard/lab',
  radiologist: '/dashboard/radiologist',
  admin: '/dashboard/admin',
};

const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const token = sessionStorage.getItem('authToken');
  const { user, isLoading } = useUser();

  if (!token) {
    // If no token, redirect to the login selection page
    return <Navigate to="/auth/login-selection" replace />;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If user is loaded, enforce role-based dashboard access
  if (user) {
    const path = window.location.pathname;
    // Check if accessing a dashboard route
    const dashboardMatch = path.match(/^\/dashboard\/(\w+)/);
    if (dashboardMatch) {
      const dashboardRole = dashboardMatch[1];
      if (user.role && dashboardRole !== user.role) {
        // Redirect to the correct dashboard for this user
        return <Navigate to={dashboardRoutes[user.role]} replace />;
      }
    }
  }

  return element;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster richColors position="top-right" />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/login-selection" element={<LoginSelection />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/admin-login" element={<AdminLogin />} />
            <Route path="/auth/register-selection" element={<RegisterSelection />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard/patient" element={<ProtectedRoute element={<PatientLayout />} />}>
              <Route index element={<PatientDashboard />} />
              <Route path="appointments" element={<AppointmentsList />} />
              <Route path="medical-records" element={<MedicalRecords />} />
              <Route path="tele-expertise" element={<TeleExpertiseRequestsPage />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="/dashboard/doctor" element={<ProtectedRoute element={<DoctorDashboard />} />} />
            <Route path="/dashboard/pharmacy" element={<ProtectedRoute element={<PharmacyDashboard />} />} />
            <Route path="/dashboard/lab" element={<ProtectedRoute element={<LabDashboard />} />} />
            <Route path="/dashboard/radiologist" element={<ProtectedRoute element={<RadiologistDashboard />} />} />
            <Route path="/dashboard/admin" element={<ProtectedRoute element={<AdminDashboard />} />} />
            <Route path="/appointments/book" element={<ProtectedRoute element={<BookAppointment />} />} />
            <Route path="/live-consultation/:appointmentId" element={<ProtectedRoute element={<LiveConsultation />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
            <Route path="/medical-records/:id" element={<ProtectedRoute element={<MedicalRecordDetail />} />} />
            <Route path="/appointments/create-service-request" element={<ProtectedRoute element={<CreateServiceRequest />} />} />
            <Route path="/profile/pharmacy/:id" element={<PharmacyProfile />} />
            <Route path="/profile/lab/:id" element={<LabProfile />} />
            <Route path="/profile/radiology/:id" element={<RadiologyProfile />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
