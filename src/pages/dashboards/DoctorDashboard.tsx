import React, { useMemo, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppointments } from '@/hooks/useAppointments';
import { useUser } from '@/hooks/useUser';
import { format, startOfDay, addMinutes, isSameDay, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

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

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmed',
  scheduled: 'Scheduled',
  'in-progress': 'In Progress',
  completed: 'Completed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  'no-show': 'No-show',
  available: 'Available',
  'outside-hours': 'Outside Hours',
};

const getSlotStatus = (slotTime: Date, appointments: any[], workingHours: { start: string; end: string }) => {
  const slotMinutes = slotTime.getHours() * 60 + slotTime.getMinutes();
  const workStartMinutes = timeToMinutes(workingHours.start);
  const workEndMinutes = timeToMinutes(workingHours.end);
  
  // Check if slot is outside working hours
  if (slotMinutes < workStartMinutes || slotMinutes >= workEndMinutes) {
    return 'outside-hours';
  }
  
  for (const appt of appointments) {
    const apptStart = parseISO(appt.scheduledDate + 'T' + appt.scheduledTime);
    const apptEnd = addMinutes(apptStart, appt.duration || 30);
    if (slotTime >= apptStart && slotTime < apptEnd) {
      return appt.status;
    }
  }
  return 'available';
};

const DoctorDashboard: React.FC = () => {
  const { appointments = [], isLoading } = useAppointments();
  const { user } = useUser();
  const today = startOfDay(new Date());

  // Get doctor's working hours and slot duration
  const workingHours = (user as any)?.workingHours || { start: '09:00', end: '17:00' };
  const slotDuration = (user as any)?.slotDuration || 30;
  
  // Convert working hours to minutes for calculations
  const workStartMinutes = timeToMinutes(workingHours.start);
  const workEndMinutes = timeToMinutes(workingHours.end);

  // Filter today's appointments
  const todaysAppointments = appointments.filter(
    (appt) => isSameDay(parseISO(appt.scheduledDate), today)
  );

  // Quick stats
  const stats = useMemo(() => {
    return {
      total: todaysAppointments.length,
      pending: todaysAppointments.filter(a => a.status === 'pending').length,
      confirmed: todaysAppointments.filter(a => a.status === 'confirmed' || a.status === 'scheduled').length,
      completed: todaysAppointments.filter(a => a.status === 'completed').length,
      cancelled: todaysAppointments.filter(a => a.status === 'cancelled' || a.status === 'no-show').length,
    };
  }, [todaysAppointments]);

  // Tele-Expertise stats (placeholder)
  const [teleExpertiseStats, setTeleExpertiseStats] = useState({ pending: 2, upcoming: [
    { id: '1', patient: 'John Doe', date: '2024-06-10', status: 'pending' },
    { id: '2', patient: 'Jane Smith', date: '2024-06-12', status: 'scheduled' },
  ] });

  // Generate slots for the day
  const slots = useMemo(() => {
    const result = [];
    for (let mins = workStartMinutes; mins < workEndMinutes; mins += slotDuration) {
      const slotTime = addMinutes(today, mins);
      const status = getSlotStatus(slotTime, todaysAppointments, workingHours);
      result.push({
        time: format(slotTime, 'HH:mm'),
        status,
        appointment: todaysAppointments.find(appt => {
          const apptStart = parseISO(appt.scheduledDate + 'T' + appt.scheduledTime);
          return slotTime >= apptStart && slotTime < addMinutes(apptStart, appt.duration || slotDuration);
        })
      });
    }
    return result;
  }, [todaysAppointments, today, workingHours, workStartMinutes, workEndMinutes, slotDuration]);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Dashboard</h1>
        <p className="text-lg text-gray-600">Manage your patients, consultations, and medical records</p>
      </div>

      {/* Working Hours Display */}
      <div className="bg-blue-50 rounded-lg p-4 mb-8">
        <div className="text-sm text-blue-700">
          <strong>Working Hours:</strong> {workingHours.start} - {workingHours.end} | 
          <strong> Slot Duration:</strong> {slotDuration} minutes
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-700 font-semibold">Today's Appointments</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-sm text-yellow-700 font-semibold">Pending Requests</div>
          <div className="text-2xl font-bold">{stats.pending}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-700 font-semibold">Completed</div>
          <div className="text-2xl font-bold">{stats.completed}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm text-red-700 font-semibold">Cancelled/No-show</div>
          <div className="text-2xl font-bold">{stats.cancelled}</div>
        </div>
        {/* Tele-Expertise Card */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-700 font-semibold">Tele-Expertise Requests</div>
          <div className="text-2xl font-bold">{teleExpertiseStats.pending}</div>
          <div className="mt-2">
            {teleExpertiseStats.upcoming.length === 0 ? (
              <span className="text-xs text-gray-500">No upcoming requests</span>
            ) : (
              <ul className="text-xs text-gray-700 space-y-1">
                {teleExpertiseStats.upcoming.slice(0, 2).map(req => (
                  <li key={req.id} className="flex items-center justify-between">
                    <span>{req.patient}</span>
                    <span className="ml-2 text-gray-400">{req.date}</span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-purple-200 text-purple-800 text-xs">{req.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Appointments Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Upcoming Appointments Today</h2>
        {todaysAppointments.length === 0 ? (
          <div className="text-gray-500">No appointments scheduled for today.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {todaysAppointments
              .filter(a => ['confirmed', 'scheduled', 'pending'].includes(a.status))
              .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
              .slice(0, 3)
              .map((appt, idx) => (
                <li key={appt._id} className="py-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-mono text-blue-700 font-semibold">{appt.scheduledTime}</span>
                    <span className="text-gray-900 font-medium">{appt.patientId?.firstName} {appt.patientId?.lastName}</span>
                    <span className="text-xs text-gray-500">{appt.type}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[appt.status]}`}>{statusLabels[appt.status]}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;


