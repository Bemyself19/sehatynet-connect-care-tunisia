import React, { useState, useEffect } from 'react';
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
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { DayPicker } from 'react-day-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function generateTimeSlots(start = '09:00', end = '17:00', slotDuration = 30) {
  const slots = [];
  let [hour, minute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  while (hour < endHour || (hour === endHour && minute <= endMinute)) {
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    minute += slotDuration;
    if (minute >= 60) {
      hour += 1;
      minute -= 60;
    }
  }
  return slots;
}

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
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [monthSlots, setMonthSlots] = useState<Record<string, string[]>>({});
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [modalSlots, setModalSlots] = useState<string[]>([]);
  const [modalDate, setModalDate] = useState<string>('');

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

  if (!user || user.role !== 'patient') {
    toast.error("Access Denied", { description: "Only patients can book appointments." });
    navigate(-1);
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

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoctor || !selectedDate) return;
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const res = await api.getAvailableSlots(selectedDoctor._id, selectedDate);
        setAvailableSlots(res.availableSlots || []);
      } catch (err: any) {
        setSlotsError('Failed to load slots');
        setAvailableSlots([]);
      }
      setSlotsLoading(false);
    };
    fetchSlots();
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    const fetchMonthSlots = async () => {
      if (!selectedDoctor || !calendarMonth) return;
      const yyyy = calendarMonth.getFullYear();
      const mm = String(calendarMonth.getMonth() + 1).padStart(2, '0');
      const monthStr = `${yyyy}-${mm}`;
      try {
        const res = await api.getAvailableSlotsForMonth(selectedDoctor._id, monthStr);
        setMonthSlots(res);
      } catch (err) {
        setMonthSlots({});
      }
    };
    fetchMonthSlots();
  }, [selectedDoctor, calendarMonth]);

  const today = new Date();
  const availableDays = Object.keys(monthSlots).filter(dateStr => (monthSlots[dateStr] || []).length > 0).map(dateStr => new Date(dateStr));
  const fullDays = Object.keys(monthSlots).filter(dateStr => (monthSlots[dateStr] || []).length === 0).map(dateStr => new Date(dateStr));

  const modifiers = {
    available: availableDays,
    full: fullDays,
  };
  const modifiersClassNames = {
    available: 'bg-blue-100 text-blue-700 font-bold rounded-full border border-blue-300 cursor-pointer',
    full: 'bg-red-200 text-red-700 font-bold rounded-full border border-red-400 cursor-not-allowed opacity-60',
  };

  const workingHours = selectedDoctor?.workingHours || { start: '09:00', end: '17:00' };
  const slotDuration = selectedDoctor?.slotDuration || 30;
  const timeSlots = generateTimeSlots(workingHours.start, workingHours.end, slotDuration);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                  <Card className="mb-6 shadow-md border-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarDays className="h-5 w-5 text-blue-600" />
                        Select Date & Time
                      </CardTitle>
                      <CardDescription>
                        Choose a date and an available time slot for your appointment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <div className="rounded-lg border bg-white p-8 shadow-sm text-xl mx-auto">
                          <CalendarPicker
                            mode="single"
                            selected={selectedDate ? new Date(selectedDate) : undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              const yyyy = date.getFullYear();
                              const mm = String(date.getMonth() + 1).padStart(2, '0');
                              const dd = String(date.getDate()).padStart(2, '0');
                              const dateStr = `${yyyy}-${mm}-${dd}`;
                              setModalSlots(monthSlots[dateStr] || []);
                              setModalDate(dateStr);
                              setSlotModalOpen(true);
                            }}
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                            modifiers={modifiers}
                            modifiersClassNames={modifiersClassNames}
                          />
                        </div>
                        {formData.scheduledDate && formData.scheduledTime && (
                          <div className="my-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-center">
                            Selected: {formData.scheduledDate} at {formData.scheduledTime}
                          </div>
                        )}
                      </div>
                      <Dialog open={slotModalOpen} onOpenChange={setSlotModalOpen}>
                        <DialogContent
                          className="max-h-[70vh] overflow-y-auto"
                        >
                          <DialogHeader>
                            <DialogTitle>Available Time Slots for {modalDate}</DialogTitle>
                          </DialogHeader>
                          {modalSlots.length === 0 ? (
                            <div className="text-gray-500 py-4">No available slots for this day.</div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                              {timeSlots.map(slot => {
                                let isPassed = false;
                                let isAvailable = modalSlots.includes(slot);
                                let isBooked = !isAvailable;
                                if (modalDate === (() => {
                                  const today = new Date();
                                  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                })()) {
                                  const [slotHour, slotMinute] = slot.split(":").map(Number);
                                  const now = new Date();
                                  const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotHour, slotMinute);
                                  if (slotDate < now) {
                                    isPassed = true;
                                    isAvailable = false;
                                    isBooked = false;
                                  }
                                }
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    className={`rounded-lg px-4 py-2 font-semibold shadow-sm border transition-all duration-150
                                      ${formData.scheduledTime === slot && isAvailable
                                        ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-lg'
                                        : isPassed
                                          ? 'bg-gray-300 text-gray-500 border-gray-300 opacity-70 cursor-not-allowed'
                                          : isBooked
                                            ? 'bg-red-500 text-white border-red-500 opacity-70 cursor-not-allowed'
                                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-400'}
                                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2`}
                                    onClick={() => {
                                      if (!isAvailable) return;
                                      setFormData(prev => ({ ...prev, scheduledDate: modalDate, scheduledTime: slot }));
                                      setSelectedDate(modalDate);
                                      setSlotModalOpen(false);
                                    }}
                                    disabled={isBooking || !isAvailable}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>

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
                      </SelectContent>
                    </Select>
                  </div>

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
                      disabled={isBooking || !formData.scheduledTime}
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

          <div className="lg:col-span-1">
            <div className="space-y-6">
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
