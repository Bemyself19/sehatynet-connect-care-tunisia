import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DoctorAppointmentsList from '@/components/doctor/DoctorAppointmentsList';
import { PrescriptionModal } from '@/components/prescription/PrescriptionModal';
import { Appointment } from '@/types/appointment';
import { Prescription } from '@/types/prescription';
import { useAppointments } from '@/hooks/useAppointments';
import { useUser } from '@/hooks/useUser';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, addMinutes, isSameDay, isSameWeek, isSameMonth, parseISO } from 'date-fns';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Video, MapPin, FileText, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';

// Helper function to convert time string (HH:mm) to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes since midnight to time string (HH:mm)
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-blue-200 text-blue-900',
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-red-100 text-red-700',
  available: 'bg-slate-100 text-slate-400',
  'outside-hours': 'bg-gray-100 text-gray-400',
};

const getSlotStatus = (slotTime: Date, appointments: any[], workingHours: { start: string; end: string }) => {
  const slotMinutes = slotTime.getHours() * 60 + slotTime.getMinutes();
  const workStartMinutes = timeToMinutes(workingHours.start);
  const workEndMinutes = timeToMinutes(workingHours.end);
  
  if (slotMinutes < workStartMinutes || slotMinutes >= workEndMinutes) {
    return 'outside-hours';
  }
  
  // Only consider non-cancelled, non-no-show appointments
  for (const appt of appointments) {
    if (["cancelled", "no-show"].includes(appt.status)) continue;
    const apptStart = parseISO(appt.scheduledDate + 'T' + appt.scheduledTime);
    const apptEnd = addMinutes(apptStart, appt.duration || 30);
    if (slotTime >= apptStart && slotTime < apptEnd) {
      return appt.status;
    }
  }
  return 'available';
};

const DoctorAppointments: React.FC = () => {
  const { t } = useTranslation();
  // Move statusLabels inside the component so t is in scope
  const statusLabels: Record<string, string> = {
    confirmed: t('confirmed'),
    scheduled: t('scheduled'),
    'in-progress': t('inProgress'),
    completed: t('completed'),
    pending: t('pending'),
    cancelled: t('cancelled'),
    'no-show': t('noShow'),
    available: t('available'),
    'outside-hours': t('outsideHours'),
  };
  const { appointments, isLoading } = useAppointments();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentDetailModalOpen, setAppointmentDetailModalOpen] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const today = currentDate;
  
  // Get doctor's working hours and slot duration
  const workingHours = (user as any)?.workingHours || { start: '09:00', end: '17:00' };
  const slotDuration = (user as any)?.slotDuration || 30;
  
  // Convert working hours to minutes for calculations
  const workStartMinutes = timeToMinutes(workingHours.start);
  const workEndMinutes = timeToMinutes(workingHours.end);

  // Filter appointments for the current view
  const filteredAppointments = useMemo(() => {
    if (view === 'day') {
      return appointments?.filter(appt => isSameDay(parseISO(appt.scheduledDate), today)) || [];
    } else if (view === 'week') {
      return appointments?.filter(appt => isSameWeek(parseISO(appt.scheduledDate), today)) || [];
    } else {
      return appointments?.filter(appt => isSameMonth(parseISO(appt.scheduledDate), today)) || [];
    }
  }, [appointments, view, today]);

  // Generate slots for the day or week
  const slots = useMemo(() => {
    if (view === 'day') {
      const result = [];
      for (let mins = workStartMinutes; mins < workEndMinutes; mins += slotDuration) {
        const slotTime = addMinutes(today, mins);
        const status = getSlotStatus(slotTime, filteredAppointments, workingHours);
        result.push({
          time: format(slotTime, 'HH:mm'),
          status,
          appointment: filteredAppointments.find(appt => {
            if (["cancelled", "no-show"].includes(appt.status)) return false;
            const apptStart = parseISO(appt.scheduledDate + 'T' + appt.scheduledTime);
            return slotTime >= apptStart && slotTime < addMinutes(apptStart, appt.duration || slotDuration);
          })
        });
      }
      return result;
    } else if (view === 'week') {
      // 7 days, each with slots
      const week = [];
      for (let day = 0; day < 7; day++) {
        const dayDate = addMinutes(today, day * 24 * 60);
        const daySlots = [];
        for (let mins = workStartMinutes; mins < workEndMinutes; mins += slotDuration) {
          const slotTime = addMinutes(dayDate, mins);
          const status = getSlotStatus(slotTime, filteredAppointments, workingHours);
          daySlots.push({
            time: format(slotTime, 'HH:mm'),
            status,
            appointment: filteredAppointments.find(appt => {
              if (["cancelled", "no-show"].includes(appt.status)) return false;
              const apptStart = parseISO(appt.scheduledDate + 'T' + appt.scheduledTime);
              return slotTime >= apptStart && slotTime < addMinutes(apptStart, appt.duration || slotDuration);
            })
          });
        }
        week.push({ date: format(dayDate, 'EEE dd/MM'), slots: daySlots });
      }
      return week;
    } else {
      // Month view: 7 columns (weekdays), 4-6 rows
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
      const month = [];
      let week = [];
      let dayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
      // Fill initial empty days
      for (let i = 0; i < dayOfWeek; i++) {
        week.push(null);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(today.getFullYear(), today.getMonth(), d);
        const appts = filteredAppointments.filter(appt => isSameDay(parseISO(appt.scheduledDate), dayDate));
        week.push({ date: format(dayDate, 'dd/MM'), count: appts.length, statuses: [...new Set(appts.map(a => a.status))] });
        if (week.length === 7) {
          month.push(week);
          week = [];
        }
      }
      // Fill trailing empty days
      if (week.length > 0) {
        while (week.length < 7) week.push(null);
        month.push(week);
      }
      return month;
    }
  }, [filteredAppointments, view, today, slotDuration, workingHours, workStartMinutes, workEndMinutes]);

  // Toast notification for cancellations
  const [prevAppointments, setPrevAppointments] = useState<Appointment[]>([]);
  useEffect(() => {
    if (prevAppointments.length > 0 && appointments) {
      const prevCancelledIds = prevAppointments.filter(a => a.status === 'cancelled').map(a => a._id);
      const newCancelled = appointments.filter(a => a.status === 'cancelled' && !prevCancelledIds.includes(a._id));
      if (newCancelled.length > 0) {
        newCancelled.forEach(cancelled => {
          toast.info(`Appointment with ${cancelled.patientId.firstName} ${cancelled.patientId.lastName} on ${cancelled.scheduledDate} at ${cancelled.scheduledTime} was cancelled by the patient.`);
        });
      }
    }
    setPrevAppointments(appointments || []);
  }, [appointments]);

  const handleAppointmentStatusChange = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      if (status === 'confirmed') {
        // Use the approve endpoint for confirming pending appointments
        await api.approveAppointment(id);
        toast.success(t('appointmentApproved'));
      } else {
        // Use regular update for cancellation
        await api.updateAppointment(id, { status });
        toast.success(`Appointment ${status}`);
      }
      await queryClient.invalidateQueries({ queryKey: ['appointments', user?._id] });
      handleCloseAppointmentDetail();
    } catch (error) {
      toast.error('Error updating appointment');
    }
  };

  const handleJoinCall = (appointment: Appointment) => {
    navigate(`/live-consultation/${appointment._id}`);
  };

  const handlePrescriptionCreated = (prescription: Prescription) => {
    queryClient.invalidateQueries({ queryKey: ['prescriptions', user?._id] });
    toast.success('Prescription created successfully!');
    handleClosePrescriptionModal();
  };

  const handleOpenPrescriptionModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionModalOpen(true);
  };

  const handleClosePrescriptionModal = () => {
    setPrescriptionModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleOpenAppointmentDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentDetailModalOpen(true);
  };

  const handleCloseAppointmentDetail = () => {
    setAppointmentDetailModalOpen(false);
    setSelectedAppointment(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('appointmentManagement')}</CardTitle>
        <CardDescription>{t('manageUpcomingConsultations')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* View Switcher */}
        <div className="flex gap-2 mb-4">
          <Button variant={view === 'day' ? 'default' : 'outline'} onClick={() => setView('day')}>{t('day')}</Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>{t('week')}</Button>
          <Button variant={view === 'month' ? 'default' : 'outline'} onClick={() => setView('month')}>{t('month')}</Button>
        </div>
        {/* Working Hours Display */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <span className="font-semibold text-blue-700">{t('workingHours')}:</span> {workingHours.start} - {workingHours.end} | <span className="font-semibold text-blue-700">{t('slotDuration')}:</span> {slotDuration} {t('minutes')}
        </div>
        {/* Table Headers */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('time')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('patient')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type')}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('details')}</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 whitespace-nowrap">{slot.time}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[slot.status]}`}>{statusLabels[slot.status]}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{slot.appointment ? `${slot.appointment.patientId.firstName} ${slot.appointment.patientId.lastName}` : '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{slot.appointment ? t(slot.appointment.type) : '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Existing List View Below */}
        <DoctorAppointmentsList
          appointments={appointments || []}
          onConfirm={(id) => handleAppointmentStatusChange(id, 'confirmed')}
          onCancel={(id) => handleAppointmentStatusChange(id, 'cancelled')}
          onJoinCall={handleJoinCall}
          onCreatePrescription={handleOpenPrescriptionModal}
        />
        
        {/* Appointment Detail Modal */}
        <Dialog open={isAppointmentDetailModalOpen} onOpenChange={setAppointmentDetailModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('appointmentDetails')}
              </DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-6">
                {/* Patient Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('patientInformation')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('name')}:</span> {selectedAppointment.patientId.firstName} {selectedAppointment.patientId.lastName}
                    </div>
                    <div>
                      <span className="font-medium">{t('email')}:</span> {selectedAppointment.patientId.email}
                    </div>
                    <div>
                      <span className="font-medium">{t('phone')}:</span> {selectedAppointment.patientId.phone}
                    </div>
                    <div>
                      <span className="font-medium">{t('cnamId')}:</span> {selectedAppointment.patientId.cnamId || t('notRequested')}
                    </div>
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('appointmentInformation')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('date')}:</span> {new Date(selectedAppointment.scheduledDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">{t('time')}:</span> {selectedAppointment.scheduledTime}
                    </div>
                    <div>
                      <span className="font-medium">{t('duration')}:</span> {selectedAppointment.duration} {t('minutes')}
                    </div>
                    <div>
                      <span className="font-medium">{t('type')}:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${statusColors[selectedAppointment.status]}`}>
                        {statusLabels[selectedAppointment.status]}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">{t('consultationType')}:</span> 
                      <span className="ml-2 flex items-center gap-1">
                        {selectedAppointment.appointmentType === 'video' ? (
                          <><Video className="h-3 w-3" /> {t('videoConsultation')}</>
                        ) : (
                          <><MapPin className="h-3 w-3" /> {t('inPerson')}</>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">{t('fee')}:</span> ${selectedAppointment.consultationFee}
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                {(selectedAppointment.reason || selectedAppointment.symptoms || selectedAppointment.notes) && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t('medicalInformation')}
                    </h3>
                    <div className="space-y-3 text-sm">
                      {selectedAppointment.reason && (
                        <div>
                          <span className="font-medium">{t('reasonForVisit')}:</span>
                          <p className="mt-1 text-gray-700">{selectedAppointment.reason}</p>
                        </div>
                      )}
                      {selectedAppointment.symptoms && (
                        <div>
                          <span className="font-medium">{t('symptoms')}:</span>
                          <p className="mt-1 text-gray-700">{selectedAppointment.symptoms}</p>
                        </div>
                      )}
                      {selectedAppointment.notes && (
                        <div>
                          <span className="font-medium">{t('notes')}:</span>
                          <p className="mt-1 text-gray-700">{selectedAppointment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  {selectedAppointment.status === 'pending' && (
                    <>
                      <Button variant="outline" onClick={() => {
                        handleAppointmentStatusChange(selectedAppointment._id, 'confirmed');
                        handleCloseAppointmentDetail();
                      }}>
                        {t('confirmAppointment')}
                      </Button>
                      <Button variant="destructive" onClick={() => {
                        handleAppointmentStatusChange(selectedAppointment._id, 'cancelled');
                        handleCloseAppointmentDetail();
                      }}>
                        {t('cancelAppointment')}
                      </Button>
                    </>
                  )}
                  {selectedAppointment.appointmentType === 'video' && selectedAppointment.status === 'confirmed' && (
                    <Button onClick={() => {
                      handleCloseAppointmentDetail();
                      handleJoinCall(selectedAppointment);
                    }}>
                      {t('joinCall')}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => {
                    handleCloseAppointmentDetail();
                    handleOpenPrescriptionModal(selectedAppointment);
                  }}>
                    {t('createPrescription')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {selectedAppointment && (
          <PrescriptionModal
            open={isPrescriptionModalOpen}
            onClose={handleClosePrescriptionModal}
            appointmentId={selectedAppointment._id}
            patientId={selectedAppointment.patientId._id}
            patientName={`${selectedAppointment.patientId.firstName} ${selectedAppointment.patientId.lastName}`}
            onPrescriptionCreated={handlePrescriptionCreated}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorAppointments;