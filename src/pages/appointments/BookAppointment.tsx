
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Heart, Calendar, Clock, User } from 'lucide-react';
import DoctorSelectionModal from '@/components/patient/DoctorSelectionModal';

const BookAppointment: React.FC = () => {
  const [formData, setFormData] = useState({
    doctor: '',
    specialty: '',
    date: '',
    time: '',
    type: 'in-person',
    reason: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const { toast } = useToast();
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = '/auth/login-selection';
  };

  const handleSelectDoctor = (doctor: any) => {
    setFormData(prev => ({ 
      ...prev, 
      doctor: doctor.name,
      specialty: doctor.specialty 
    }));
    setShowDoctorModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Booking appointment:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store the new appointment with pending status
      const newAppointment = {
        ...formData,
        id: Date.now(),
        status: 'pending',
        patientName: 'Current Patient'
      };
      
      // In a real app, this would be stored in a database
      const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      existingAppointments.push(newAppointment);
      localStorage.setItem('appointments', JSON.stringify(existingAppointments));
      
      toast({
        title: 'Appointment Booked Successfully',
        description: 'Your appointment is pending confirmation from the doctor.',
      });

      navigate('/dashboard/patient');
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: 'Unable to book appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">SehatyNet+</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard/patient">
                <Button variant="outline" size="sm">
                  {t('backToDashboard') || 'Back to Dashboard'}
                </Button>
              </Link>
              <span className="text-sm text-gray-600">{t('welcome') || 'Welcome'}, Patient</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                {t('logout') || 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('bookAppointment') || 'Book Appointment'}
          </h1>
          <p className="text-gray-600">
            {t('scheduleConsultation') || 'Schedule a new consultation with your healthcare provider'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{t('appointmentDetails') || 'Appointment Details'}</span>
            </CardTitle>
            <CardDescription>
              {t('fillAppointmentForm') || 'Please fill in the details for your appointment'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="doctor">{t('doctor') || 'Doctor'}</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="doctor"
                      type="text"
                      placeholder={t('selectDoctor') || 'Select doctor'}
                      value={formData.doctor}
                      readOnly
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={() => setShowDoctorModal(true)}
                      variant="outline"
                    >
                      Browse Doctors
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="date">{t('date') || 'Date'}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="time">{t('time') || 'Time'}</Label>
                  <Select 
                    value={formData.time} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                  >
                    <SelectTrigger>
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

                <div className="md:col-span-2">
                  <Label htmlFor="type">{t('appointmentType') || 'Appointment Type'}</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">{t('inPerson') || 'In Person'}</SelectItem>
                      <SelectItem value="video">{t('videoCall') || 'Video Call'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="reason">{t('reason') || 'Reason for Visit'}</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder={t('describeSymptoms') || 'Please describe your symptoms or reason for the visit'}
                    rows={4}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading || !formData.doctor}>
                {isLoading ? (t('booking') || 'Booking...') : (t('bookAppointment') || 'Book Appointment')}
              </Button>
            </form>
          </CardContent>
        </Card>

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
