import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { Heart, Calendar, Clock, User as UserIcon, ArrowLeft, Search, CalendarDays, MapPin, Phone, Mail } from 'lucide-react';
import DoctorSelectionModal from '@/components/patient/DoctorSelectionModal';
import { CreateAppointmentData } from '@/types/appointment';
import { Provider } from '@/types/user';
import api from '@/lib/api';
import { Appointment } from '@/types/appointment';
import { useUser } from '@/hooks/useUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const BookAppointment: React.FC = () => {
  const [formData, setFormData] = useState<Partial<CreateAppointmentData>>({
    providerId: '',
    type: 'consultation',
    appointmentType: 'in-person',
  });
  const [selectedDoctor, setSelectedDoctor] = useState<Provider | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user, isLoading: isUserLoading } = useUser();
  const queryClient = useQueryClient();

  const { mutate: createAppointment, isPending: isBooking } = useMutation({
    mutationFn: (appointmentData: Partial<Appointment>) => api.createAppointment(appointmentData),
    onSuccess: () => {
      toast.success('Appointment Booked Successfully', {
        description: 'Your appointment is pending confirmation from the doctor.',
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      navigate('/dashboard/patient');
    },
    onError: () => {
      toast.error('Booking Failed', {
        description: 'Unable to book appointment. Please try again.',
      });
    },
  });

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
  ];

  const handleLogout = () => {
    window.dispatchEvent(new CustomEvent('logout'));
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only allow patients to book appointments
  if (!user || user.role !== 'patient') {
    toast.error("Access Denied", { description: "Only patients can book appointments." });
    navigate(-1); // Go back to the previous page
    return null;
  }

  const handleSelectDoctor = (doctor: Provider) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctor) {
      toast.error('Doctor Not Selected', {
        description: 'Please select a doctor to book an appointment.',
      });
      return;
    }

    const appointmentData: Partial<Appointment> = {
      providerId: selectedDoctor,
      type: formData.type,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      appointmentType: formData.appointmentType,
      reason: formData.reason,
    };

    createAppointment(appointmentData);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Link to="/" className="flex items-center group">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg group-hover:scale-105 transition-transform">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-3">
                  SehatyNet+
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  {t('welcome') || 'Welcome'}, {user.firstName}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                {t('logout') || 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('bookAppointment') || 'Book Appointment'}
              </h1>
              <p className="text-gray-600">
                {t('scheduleConsultation') || 'Schedule a new consultation with your healthcare provider'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarDays className="h-5 w-5 text-green-600" />
                  <span>{t('appointmentDetails') || 'Appointment Details'}</span>
                </CardTitle>
                <CardDescription>
                  {t('fillAppointmentForm') || 'Please fill in the details for your appointment'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Doctor Selection */}
                  <div className="md:col-span-2">
                    <Label htmlFor="doctor" className="text-base font-medium text-gray-700">
                      {t('doctor') || 'Doctor'}
                    </Label>
                    <div className="mt-2">
                      {selectedDoctor ? (
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {selectedDoctor.firstName?.charAt(0)}{selectedDoctor.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {selectedDoctor.specialization || 'General Practitioner'}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {selectedDoctor.licenseNumber ? 'Licensed' : 'Verified'}
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedDoctor(null)}
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Input
                            id="doctor"
                            type="text"
                            placeholder={t('selectDoctor') || 'Select doctor'}
                            readOnly
                            className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Button 
                            type="button" 
                            onClick={() => setShowDoctorModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Browse Doctors
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="date" className="text-base font-medium text-gray-700">
                        {t('date') || 'Date'}
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="time" className="text-base font-medium text-gray-700">
                        {t('time') || 'Time'}
                      </Label>
                      <Select 
                        value={formData.scheduledTime} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, scheduledTime: value }))}
                      >
                        <SelectTrigger className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder={t('selectTime') || 'Select time'} />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Appointment Type */}
                  <div className="md:col-span-2">
                    <Label htmlFor="type" className="text-base font-medium text-gray-700">
                      {t('appointmentType') || 'Appointment Type'}
                    </Label>
                    <Select 
                      value={formData.appointmentType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, appointmentType: value as any }))}
                    >
                      <SelectTrigger className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={t('selectAppointmentType') || 'Select appointment type'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="video">Video Consultation</SelectItem>
                        <SelectItem value="phone">Phone Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Consultation Type */}
                  <div className="md:col-span-2">
                    <Label htmlFor="consultationType" className="text-base font-medium text-gray-700">
                      {t('consultationType') || 'Consultation Type'}
                    </Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={t('selectConsultationType') || 'Select consultation type'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">General Consultation</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="routine">Routine Check-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reason */}
                  <div className="md:col-span-2">
                    <Label htmlFor="reason" className="text-base font-medium text-gray-700">
                      {t('reason') || 'Reason for Visit'}
                    </Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder={t('describeSymptoms') || 'Please describe your symptoms or reason for the visit'}
                      rows={4}
                      className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      className="border-2 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isBooking || !selectedDoctor}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {isBooking ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Booking...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Book Appointment</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Patient Info */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                    <span>Patient Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">Patient</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{user.email}</span>
                    </div>
                    {(user as any).phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{(user as any).phone}</span>
                      </div>
                    )}
                    {user.cnamId && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          CNAM: {user.cnamId}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Tips */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Appointment Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-gray-700">Arrive 10 minutes before your scheduled time</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-gray-700">Bring your ID and insurance information</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-gray-700">Prepare a list of current medications</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-gray-700">Note down any symptoms or concerns</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Doctor Selection Modal */}
        <DoctorSelectionModal
          isOpen={showDoctorModal}
          onClose={() => setShowDoctorModal(false)}
          onSelectDoctor={handleSelectDoctor}
        />
      </main>
    </div>
  );
};

export default BookAppointment;
