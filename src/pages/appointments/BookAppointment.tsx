
import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Heart, ArrowLeft, Clock, User, Calendar as CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const BookAppointment: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const providers = [
    { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Cardiologist' },
    { id: '2', name: 'Dr. Ahmed Hassan', specialty: 'General Practitioner' },
    { id: '3', name: 'Dr. Maria Garcia', specialty: 'Dermatologist' }
  ];

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !provider || !appointmentType) {
      toast({
        title: t('error') || 'Error',
        description: t('fillAllFields') || 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: t('appointmentBooked') || 'Appointment Booked',
      description: t('appointmentConfirmed') || 'Your appointment has been confirmed'
    });
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">SehatyNet+</span>
            </div>
            <Link to="/dashboard/patient">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToDashboard') || 'Back to Dashboard'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('bookAppointment') || 'Book Appointment'}
          </h1>
          <p className="text-gray-600">
            {t('scheduleConsultation') || 'Schedule a consultation with a healthcare provider'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                {t('selectDate') || 'Select Date & Time'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>{t('appointmentDate') || 'Appointment Date'}</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border mt-2"
                  disabled={(date) => date < new Date()}
                />
              </div>

              {selectedDate && (
                <div>
                  <Label>{t('selectTime') || 'Select Time'}</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t('appointmentDetails') || 'Appointment Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="provider">{t('selectProvider') || 'Select Provider'}</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t('chooseProvider') || 'Choose a provider'} />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - {p.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">{t('appointmentType') || 'Appointment Type'}</Label>
                <Select value={appointmentType} onValueChange={setAppointmentType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t('selectType') || 'Select type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">{t('consultation') || 'Consultation'}</SelectItem>
                    <SelectItem value="followup">{t('followUp') || 'Follow-up'}</SelectItem>
                    <SelectItem value="checkup">{t('checkUp') || 'Check-up'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">{t('notes') || 'Notes (Optional)'}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('additionalNotes') || 'Any additional notes or symptoms'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleBooking} className="w-full" size="lg">
                <Clock className="h-4 w-4 mr-2" />
                {t('confirmBooking') || 'Confirm Booking'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BookAppointment;
