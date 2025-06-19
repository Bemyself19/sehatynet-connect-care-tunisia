
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import LoginSelection from "./pages/auth/LoginSelection";
import Register from "./pages/auth/Register";
import RegisterSelection from "./pages/auth/RegisterSelection";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import ProviderDashboard from "./pages/dashboards/ProviderDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import BookAppointment from "./pages/appointments/BookAppointment";
import Profile from "./pages/profile/Profile";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/auth/AdminLogin";
import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
import PharmacyDashboard from "./pages/dashboards/PharmacyDashboard";
import LabDashboard from "./pages/dashboards/LabDashboard";
import RadiologistDashboard from "./pages/dashboards/RadiologistDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/login-selection" element={<LoginSelection />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/admin-login" element={<AdminLogin />} />
          <Route path="/auth/register-selection" element={<RegisterSelection />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/dashboard/patient" element={<PatientDashboard />} />
          <Route path="/dashboard/provider" element={<ProviderDashboard />} />
          <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
          <Route path="/dashboard/pharmacy" element={<PharmacyDashboard />} />
          <Route path="/dashboard/lab" element={<LabDashboard />} />
          <Route path="/dashboard/radiologist" element={<RadiologistDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/appointments/book" element={<BookAppointment />} />
          <Route path="/profile" element={<Profile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
