import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, MapPin, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/ui/modal';
import api from '@/lib/api';
import { Appointment } from '@/types/appointment';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '@/hooks/useAppointments';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';

const AppointmentsList: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { appointments: rawAppointments, isLoading, isError } = useAppointments();

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const appointments = useMemo(() => {
    if (!rawAppointments) return [];
    return rawAppointments.filter(apt => apt.status !== 'cancelled');
  }, [rawAppointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleJoinCall = (appointment: Appointment) => {
    if (appointment.appointmentType === 'video') {
      navigate(`/live-consultation/${appointment._id}`);
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsRescheduleModalOpen(true);
  };

  const confirmReschedule = async () => {
    if (newDate && newTime && selectedAppointment) {
      try {
        const updatedData = {
            scheduledDate: newDate,
            scheduledTime: newTime,
            status: 'pending' as const
        };
        await api.updateAppointment(selectedAppointment._id, updatedData);
        
        queryClient.invalidateQueries({ queryKey: ['appointments', user?._id] });
        toast.success('Appointment Rescheduled', {
          description: 'Your reschedule request has been sent.',
        });
      } catch (err) {
        toast.error('Error', {
          description: 'Could not reschedule the appointment.',
        });
      } finally {
        setIsRescheduleModalOpen(false);
        setSelectedAppointment(null);
      }
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      await api.cancelAppointment(appointmentId);
      queryClient.invalidateQueries({ queryKey: ['appointments', user?._id] });
      toast.success('Appointment Cancelled', {
        description: 'Your appointment has been successfully cancelled.',
      });
    } catch (err) {
      toast.error('Error', {
        description: 'Could not cancel the appointment.',
      });
    }
  };

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
  ];

  return (
    <>
        <div>
          {isLoading ? (
            <p className="text-gray-500 text-center py-4">{t('loadingAppointments') || 'Loading appointments...'}</p>
          ) : isError ? (
            <div className="text-red-500 text-center py-4 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {'Failed to load appointments. Please try again later.'}
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t('noAppointments') || 'No appointments scheduled.'}</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">{`${appointment.providerId.firstName} ${appointment.providerId.lastName}`}</h3>
                        <p className="text-sm text-gray-600">{appointment.providerId.specialization}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(appointment.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {appointment.scheduledTime}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            {appointment.appointmentType === 'video' ? (
                              <><Video className="h-4 w-4 mr-1" /> Video Call</>
                            ) : (
                              <><MapPin className="h-4 w-4 mr-1" /> In Person</>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{appointment.reason}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="flex justify-end space-x-2">
                    {appointment.appointmentType === 'video' && appointment.status === 'confirmed' && (
                       <Button size="sm" onClick={() => handleJoinCall(appointment)}>{t('joinCall') || 'Join Call'}</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleReschedule(appointment)}>{t('reschedule') || 'Reschedule'}</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleCancel(appointment._id)}>{t('cancel') || 'Cancel'}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      
      <Modal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} title="Reschedule Appointment">
        <div className="space-y-4">
            <div>
              <label htmlFor="newDate" className="block text-sm font-medium text-gray-700">New Date</label>
              <Input type="date" id="newDate" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="newTime" className="block text-sm font-medium text-gray-700">New Time</label>
              <select id="newTime" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                <option value="">Select a time</option>
                {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>Cancel</Button>
              <Button onClick={confirmReschedule}>Confirm Reschedule</Button>
            </div>
        </div>
      </Modal>
    </>
  );
};

export default AppointmentsList;

