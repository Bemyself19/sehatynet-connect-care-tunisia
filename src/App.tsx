import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import i18n from './i18n';
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import LoginSelection from "./pages/auth/LoginSelection";
import Register from "./pages/auth/Register";
import RegisterSelection from "./pages/auth/RegisterSelection";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import AdminLayout from "./components/layouts/AdminLayout";
import AdminUserManagementPage from "./pages/dashboards/admin/UserManagement";
import AdminSystemSettingsPage from "./pages/dashboards/admin/SystemSettings";
import AdminAuditLogsPage from "./pages/dashboards/admin/AuditLogs";
import AdminReportsPage from "./pages/dashboards/admin/Reports";
import AdminProfilePage from "./pages/dashboards/admin/AdminProfile";
import BookAppointment from "./pages/appointments/BookAppointment";
import Profile from "./pages/profile/Profile";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/auth/AdminLogin";
import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
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
import DoctorLayout from './components/layouts/DoctorLayout';
import DoctorAppointments from '@/pages/dashboards/doctor/DoctorAppointments';
import DoctorPatients from '@/pages/dashboards/doctor/DoctorPatients';
import DoctorTeleExpertise from '@/pages/dashboards/doctor/DoctorTeleExpertise';
import DoctorAnalytics from '@/pages/dashboards/doctor/DoctorAnalytics';
import DoctorProfile from '@/pages/profile/DoctorProfile';
import PaymentReturn from './pages/payment/PaymentReturn';
import FlouciPaymentReturn from './pages/payment/FlouciPaymentReturn';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

const App = () => {
  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (i18n.isInitialized) return;
    const handleInit = () => setReady(true);
    i18n.on('initialized', handleInit);
    return () => {
      i18n.off('initialized', handleInit);
    };
  }, []);

  if (!ready) {
    return <div className="flex items-center justify-center h-screen">Loading translations...</div>;
  }

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
            <Route path="/dashboard/admin" element={<ProtectedRoute element={<AdminLayout />} />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUserManagementPage />} />
              <Route path="settings" element={<AdminSystemSettingsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
            </Route>
            <Route path="/dashboard/patient" element={<ProtectedRoute element={<PatientLayout />} />}>
              <Route index element={<PatientDashboard />} />
              <Route path="appointments" element={<AppointmentsList />} />
              <Route path="book" element={<BookAppointment />} />
              <Route path="medical-records" element={<MedicalRecords />} />
              <Route path="tele-expertise" element={<TeleExpertiseRequestsPage />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="/dashboard/doctor" element={<ProtectedRoute element={<DoctorLayout />} />}>
              <Route index element={<DoctorDashboard />} />
              <Route path="appointments" element={<DoctorAppointments />} />
              <Route path="patients" element={<DoctorPatients />} />
              <Route path="tele-expertise" element={<DoctorTeleExpertise />} />
              <Route path="analytics" element={<DoctorAnalytics />} />
              <Route path="profile" element={<DoctorProfile />} />
            </Route>
            <Route path="/dashboard/pharmacy" element={<ProtectedRoute element={<PharmacyProfile />} />} />
            <Route path="/dashboard/lab" element={<ProtectedRoute element={<LabProfile />} />} />
            <Route path="/dashboard/radiologist" element={<ProtectedRoute element={<RadiologyProfile />} />} />
            <Route path="/live-consultation/:appointmentId" element={<ProtectedRoute element={<LiveConsultation />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
            <Route path="/medical-records/:id" element={<ProtectedRoute element={<MedicalRecordDetail />} />} />
            <Route path="/appointments/create-service-request" element={<ProtectedRoute element={<CreateServiceRequest />} />} />
            {/* Payment Routes */}
            <Route path="/payment/return" element={<ProtectedRoute element={<PaymentReturn />} />} />
            <Route path="/payment/success" element={<ProtectedRoute element={<FlouciPaymentReturn />} />} />
            <Route path="/payment/failed" element={<ProtectedRoute element={<FlouciPaymentReturn />} />} />
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
