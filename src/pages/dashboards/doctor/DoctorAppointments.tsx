import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

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

// Status labels will be translated dynamically

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
  const { appointments, isLoading } = useAppointments();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentDetailModalOpen, setAppointmentDetailModalOpen] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const today = currentDate;
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Get doctor's working hours and slot duration
  const workingHours = (user as any)?.workingHours || { start: '09:00', end: '17:00' };
  const slotDuration = (user as any)?.slotDuration || 30;
  
  // Convert working hours to minutes for calculations
  const workStartMinutes = timeToMinutes(workingHours.start);
  const workEndMinutes = timeToMinutes(workingHours.end);

  // Dynamic status labels with translations
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      confirmed: t('confirmed') || 'Confirmed',
      scheduled: t('scheduled') || 'Scheduled',
      'in-progress': t('inProgress') || 'In Progress',
      completed: t('completed') || 'Completed',
      pending: t('pending') || 'Pending',
      cancelled: t('cancelled') || 'Cancelled',
      'no-show': t('noShow') || 'No-show',
      available: t('available') || 'Available',
      'outside-hours': t('outsideHours') || 'Outside Hours',
    };
    return statusMap[status] || status;
  };

  // Auto-scroll to current time effect
  useEffect(() => {
    if (view === 'day' && tableContainerRef.current) {
      const currentTime = new Date();
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      
      // Only scroll if current time is within working hours
      if (currentMinutes >= workStartMinutes && currentMinutes <= workEndMinutes) {
        const slotIndex = Math.floor((currentMinutes - workStartMinutes) / slotDuration);
        const rowHeight = 40; // Approximate row height
        const scrollPosition = Math.max(0, (slotIndex - 2) * rowHeight); // Show 2 rows before current time
        
        setTimeout(() => {
          if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = scrollPosition;
          }
        }, 100);
      }
    }
  }, [view, workStartMinutes, workEndMinutes, slotDuration]);

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
      await api.updateAppointment(id, { status });
      toast.success(`Appointment ${status}`);
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

  // Auto-scroll to current time slot in day view
  useEffect(() => {
    if (view === 'day' && tableContainerRef.current) {
      const now = new Date();
      const currentSlot = Math.floor((now.getHours() * 60 + now.getMinutes() - workStartMinutes) / slotDuration);
      if (currentSlot >= 0) {
        const row = Math.floor(currentSlot / 7);
        const col = currentSlot % 7;
        const target = tableContainerRef.current.querySelector(`tbody tr:nth-child(${row + 1}) td:nth-child(${col + 1})`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [view, slots, workStartMinutes, slotDuration]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="text-xl">{t('appointmentManagement.title') || 'Appointment Management'}</CardTitle>
        <CardDescription>{t('appointmentManagement.description') || 'Manage your upcoming consultations and patient appointments'}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Working Hours Display */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-700">
            <strong>{t('appointmentManagement.workingHours') || 'Working Hours'}:</strong> {workingHours.start} - {workingHours.end} | 
            <strong> {t('appointmentManagement.slotDuration') || 'Slot Duration'}:</strong> {slotDuration} {t('minutes') || 'minutes'}
          </div>
        </div>
        
        {/* View Switcher */}
        <div className="flex gap-2 mb-4">
          <button className={`px-3 py-1 rounded ${view === 'day' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-gray-700'}`} onClick={() => setView('day')}>{t('appointmentManagement.viewDay') || 'Day'}</button>
          <button className={`px-3 py-1 rounded ${view === 'week' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-gray-700'}`} onClick={() => setView('week')}>{t('appointmentManagement.viewWeek') || 'Week'}</button>
          <button className={`px-3 py-1 rounded ${view === 'month' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-gray-700'}`} onClick={() => setView('month')}>{t('appointmentManagement.viewMonth') || 'Month'}</button>
        </div>
        
        {/* Calendar Views */}
        {view === 'day' && (
          <div className="overflow-y-auto mb-8" style={{ maxHeight: 500 }} ref={tableContainerRef}>
            <table className="min-w-full border rounded-lg bg-white">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500">{t('time') || 'Time'}</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500">{t('status') || 'Status'}</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500">{t('patient') || 'Patient'}</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500">{t('type') || 'Type'}</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500">{t('details') || 'Details'}</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                    <td className="p-2 text-sm font-mono">{slot.time}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[slot.status]}`}>{getStatusLabel(slot.status)}</span>
                    </td>
                    <td className="p-2 text-sm">
                      {(slot.appointment && !['cancelled', 'no-show'].includes(slot.appointment.status))
                        ? `${slot.appointment.patientId?.firstName || ''} ${slot.appointment.patientId?.lastName || ''}`
                        : '-'}
                    </td>
                    <td className="p-2 text-sm">
                      {(slot.appointment && !['cancelled', 'no-show'].includes(slot.appointment.status))
                        ? slot.appointment.type
                        : '-'}
                    </td>
                    <td className="p-2 text-sm">
                      {(slot.appointment && !['cancelled', 'no-show'].includes(slot.appointment.status)) ? (
                        <>
                          <div className="text-xs text-gray-500">{slot.appointment.reason || slot.appointment.notes || ''}</div>
                          <button
                            className="text-blue-600 underline text-xs mt-1"
                            onClick={() => handleOpenAppointmentDetail(slot.appointment)}
                          >
                            {t('viewDetails') || 'View Details'}
                          </button>
                        </>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {view === 'week' && (
          <TooltipProvider>
            <div className="overflow-x-auto mb-8" style={{ maxHeight: 320 }}>
              <table className="min-w-full border rounded-lg bg-white">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-xs font-semibold text-gray-500">{t('appointmentManagement.time')}</th>
                    {[...Array(7)].map((_, i) => (
                      <th key={i} className="p-2 text-left text-xs font-semibold text-gray-500">{slots[i]?.date}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(Math.ceil((workEndMinutes - workStartMinutes) / slotDuration))].map((_, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-slate-50' : ''}>
                      <td className="p-2 text-sm font-mono">{format(addMinutes(today, workStartMinutes + rowIdx * slotDuration), 'HH:mm')}</td>
                      {slots.map((day, colIdx) => (
                        <td key={colIdx} className="p-2">
                          {(day.slots[rowIdx].appointment && !['cancelled', 'no-show'].includes(day.slots[rowIdx].appointment.status)) ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[day.slots[rowIdx].status]}`}>{getStatusLabel(day.slots[rowIdx].status)}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>
                                  <div className="font-semibold">{day.slots[rowIdx].appointment.patientId?.firstName} {day.slots[rowIdx].appointment.patientId?.lastName}</div>
                                  <div className="text-xs">{day.slots[rowIdx].appointment.type}</div>
                                  <div className="text-xs text-gray-500">{day.slots[rowIdx].appointment.reason || day.slots[rowIdx].appointment.notes || ''}</div>
                                  <button
                                    className="text-blue-600 underline text-xs mt-1"
                                    onClick={() => handleOpenAppointmentDetail(day.slots[rowIdx].appointment)}
                                  >
                                    {t('viewDetails') || 'View Details'}
                                  </button>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[day.slots[rowIdx].status]}`}>{getStatusLabel(day.slots[rowIdx].status)}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        )}
        
        {view === 'month' && (
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full border rounded-lg bg-white">
              <thead>
                <tr>
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((wd, i) => (
                    <th key={i} className="p-2 text-xs font-semibold text-gray-500">{wd}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((week, wIdx) => (
                  <tr key={wIdx}>
                    {week.map((day, dIdx) => (
                      <td key={dIdx} className="p-2 text-center align-top" style={{ minWidth: 60, height: 60 }}>
                        {day ? (
                          <div>
                            <div className="font-semibold text-xs">{day.date}</div>
                            {day.count > 0 ? (
                              <button
                                className="inline-block w-6 h-6 rounded-full bg-blue-200 text-blue-800 font-bold"
                                onClick={() => { setView('day'); setCurrentDate(new Date(today.getFullYear(), today.getMonth(), parseInt(day.date.split('/')[0]))); }}
                              >
                                {day.count}
                              </button>
                            ) : (
                              <span className="inline-block w-6 h-6 rounded-full bg-slate-100"></span>
                            )}
                            {day.count > 0 && (
                              <div className="text-xs text-gray-500 mt-1">{day.statuses[0]}</div>
                            )}
                          </div>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
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
                {t('appointmentManagement.details')}
              </DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-6">
                {/* Patient Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('appointmentManagement.patientInfo')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('appointmentManagement.name')}:</span> {selectedAppointment.patientId.firstName} {selectedAppointment.patientId.lastName}
                    </div>
                    <div>
                      <span className="font-medium">{t('appointmentManagement.email')}:</span> {selectedAppointment.patientId.email}
                    </div>
                    <div>
                      <span className="font-medium">{t('appointmentManagement.phone')}:</span> {selectedAppointment.patientId.phone}
                    </div>
                    <div>
                      <span className="font-medium">{t('appointmentManagement.cnamId')}:</span> {selectedAppointment.patientId.cnamId || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('appointmentManagement.appointmentInfo')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('appointmentManagement.date')}:</span> {new Date(selectedAppointment.scheduledDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">{t('appointmentManagement.time')}:</span> {selectedAppointment.scheduledTime}
                    </div>
                    <div>
                      <span className="font-medium">{t('appointmentManagement.duration')}:</span> {selectedAppointment.duration} {t('minutes')}
                    </div>
                    <div>
                      <span className="font-medium">{t('appointmentManagement.type')}:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${statusColors[selectedAppointment.status]}`}>
                        {getStatusLabel(selectedAppointment.status)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">{t('appointmentManagement.consultationType')}:</span> 
                      <span className="ml-2 flex items-center gap-1">
                        {selectedAppointment.appointmentType === 'video' ? (
                          <><Video className="h-3 w-3" /> {t('appointmentManagement.videoConsultation')}</>
                        ) : (
                          <><MapPin className="h-3 w-3" /> {t('appointmentManagement.inPerson')}</>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">{t('appointmentManagement.fee')}:</span> ${selectedAppointment.consultationFee}
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                {(selectedAppointment.reason || selectedAppointment.symptoms || selectedAppointment.notes) && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t('appointmentManagement.medicalInfo')}
                    </h3>
                    <div className="space-y-3 text-sm">
                      {selectedAppointment.reason && (
                        <div>
                          <span className="font-medium">{t('appointmentManagement.reasonForVisit')}:</span>
                          <p className="mt-1 text-gray-700">{selectedAppointment.reason}</p>
                        </div>
                      )}
                      {selectedAppointment.symptoms && (
                        <div>
                          <span className="font-medium">{t('appointmentManagement.symptoms')}:</span>
                          <p className="mt-1 text-gray-700">{selectedAppointment.symptoms}</p>
                        </div>
                      )}
                      {selectedAppointment.notes && (
                        <div>
                          <span className="font-medium">{t('appointmentManagement.notes')}:</span>
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
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          handleAppointmentStatusChange(selectedAppointment._id, 'confirmed');
                          handleCloseAppointmentDetail();
                        }}
                      >
                        {t('appointmentManagement.confirmAppointment')}
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          handleAppointmentStatusChange(selectedAppointment._id, 'cancelled');
                          handleCloseAppointmentDetail();
                        }}
                      >
                        {t('appointmentManagement.cancelAppointment')}
                      </Button>
                    </>
                  )}
                  {selectedAppointment.appointmentType === 'video' && selectedAppointment.status === 'confirmed' && (
                    <Button onClick={() => {
                      handleCloseAppointmentDetail();
                      handleJoinCall(selectedAppointment);
                    }}>
                      {t('appointmentManagement.joinCall')}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleCloseAppointmentDetail();
                      handleOpenPrescriptionModal(selectedAppointment);
                    }}
                  >
                    {t('appointmentManagement.createPrescription')}
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