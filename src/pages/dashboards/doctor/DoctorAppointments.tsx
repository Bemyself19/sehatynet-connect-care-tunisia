import React, { useState, useMemo } from 'react';
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

const SLOT_DURATION = 30; // minutes
const SLOTS_PER_DAY = 24 * 60 / SLOT_DURATION; // 48 slots
const WORK_START = 0; // 00:00
const WORK_END = 24 * 60; // 24:00

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-blue-200 text-blue-900',
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-red-100 text-red-700',
  available: 'bg-slate-100 text-slate-400',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmed',
  scheduled: 'Scheduled',
  'in-progress': 'In Progress',
  completed: 'Completed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  'no-show': 'No-show',
  available: 'Available',
};

const getSlotStatus = (slotTime: Date, appointments: any[]) => {
  for (const appt of appointments) {
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
  const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const today = currentDate;
  const slotDuration =
    user && (user as any).role === 'doctor' && typeof (user as any).slotDuration === 'number'
      ? (user as any).slotDuration
      : 30;

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
      for (let mins = WORK_START; mins < WORK_END; mins += slotDuration) {
        const slotTime = addMinutes(today, mins);
        const status = getSlotStatus(slotTime, filteredAppointments);
        result.push({
          time: format(slotTime, 'HH:mm'),
          status,
          appointment: filteredAppointments.find(appt => {
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
        for (let mins = WORK_START; mins < WORK_END; mins += slotDuration) {
          const slotTime = addMinutes(dayDate, mins);
          const status = getSlotStatus(slotTime, filteredAppointments);
          daySlots.push({
            time: format(slotTime, 'HH:mm'),
            status,
            appointment: filteredAppointments.find(appt => {
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
  }, [filteredAppointments, view, today, slotDuration]);

  const handleAppointmentStatusChange = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      // Replace with your API call
      // await api.updateAppointment(id, { status });
      toast.success(`Appointment ${status}`);
      queryClient.invalidateQueries({ queryKey: ['appointments', user?._id] });
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="text-xl">Appointment Management</CardTitle>
        <CardDescription>Manage your upcoming consultations and patient appointments</CardDescription>
      </CardHeader>
      <CardContent>
        {/* View Switcher */}
        <div className="flex gap-2 mb-4">
          <button className={`px-3 py-1 rounded ${view === 'day' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-gray-700'}`} onClick={() => setView('day')}>Day</button>
          <button className={`px-3 py-1 rounded ${view === 'week' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-gray-700'}`} onClick={() => setView('week')}>Week</button>
          <button className={`px-3 py-1 rounded ${view === 'month' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-gray-700'}`} onClick={() => setView('month')}>Month</button>
        </div>
        {/* Calendar Views */}
        {view === 'day' && (
          <div className="overflow-y-auto mb-8" style={{ maxHeight: 500 }}>
            <table className="min-w-full border rounded-lg bg-white">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500">Time</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500">Patient</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500">Type</th>
                  <th className="p-2 text-left text-xs font-semibold text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                    <td className="p-2 text-sm font-mono">{slot.time}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[slot.status]}`}>{statusLabels[slot.status]}</span>
                    </td>
                    <td className="p-2 text-sm">
                      {slot.appointment ? `${slot.appointment.patientId?.firstName || ''} ${slot.appointment.patientId?.lastName || ''}` : '-'}
                    </td>
                    <td className="p-2 text-sm">
                      {slot.appointment ? slot.appointment.type : '-'}
                    </td>
                    <td className="p-2 text-sm">
                      {slot.appointment ? (
                        <>
                          <div className="text-xs text-gray-500">{slot.appointment.reason || slot.appointment.notes || ''}</div>
                          <button
                            className="text-blue-600 underline text-xs mt-1"
                            onClick={() => navigate(`/appointments/${slot.appointment._id}`)}
                          >
                            View Details
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
            <div className="overflow-x-auto mb-8" style={{ maxHeight: 500 }}>
              <table className="min-w-full border rounded-lg bg-white">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-xs font-semibold text-gray-500">Time</th>
                    {[...Array(7)].map((_, i) => (
                      <th key={i} className="p-2 text-left text-xs font-semibold text-gray-500">{slots[i]?.date}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(Math.ceil((WORK_END - WORK_START) / slotDuration))].map((_, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-slate-50' : ''}>
                      <td className="p-2 text-sm font-mono">{format(addMinutes(today, WORK_START + rowIdx * slotDuration), 'HH:mm')}</td>
                      {slots.map((day, colIdx) => (
                        <td key={colIdx} className="p-2">
                          {day.slots[rowIdx].appointment ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[day.slots[rowIdx].status]}`}>{statusLabels[day.slots[rowIdx].status]}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>
                                  <div className="font-semibold">{day.slots[rowIdx].appointment.patientId?.firstName} {day.slots[rowIdx].appointment.patientId?.lastName}</div>
                                  <div className="text-xs">{day.slots[rowIdx].appointment.type}</div>
                                  <div className="text-xs text-gray-500">{day.slots[rowIdx].appointment.reason || day.slots[rowIdx].appointment.notes || ''}</div>
                                  <button
                                    className="text-blue-600 underline text-xs mt-1"
                                    onClick={() => navigate(`/appointments/${day.slots[rowIdx].appointment._id}`)}
                                  >
                                    View Details
                                  </button>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[day.slots[rowIdx].status]}`}>{statusLabels[day.slots[rowIdx].status]}</span>
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