
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AppointmentsList: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const appointments = [
    {
      id: 1,
      doctor: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      date: '2024-01-15',
      time: '10:00 AM',
      type: 'video',
      status: 'confirmed'
    },
    {
      id: 2,
      doctor: 'Dr. Ahmed Hassan',
      specialty: 'General Practitioner',
      date: '2024-01-18',
      time: '2:30 PM',
      type: 'in-person',
      status: 'pending'
    },
    {
      id: 3,
      doctor: 'Central Lab',
      specialty: 'Blood Test',
      date: '2024-01-20',
      time: '9:00 AM',
      type: 'in-person',
      status: 'confirmed'
    }
  ];

  const handleJoinCall = (appointment: any) => {
    console.log('Joining call for:', appointment);
    toast({
      title: 'Joining Video Call',
      description: `Connecting to ${appointment.doctor}`,
    });
    // In a real app, this would open a video call interface
  };

  const handleReschedule = (appointment: any) => {
    console.log('Rescheduling:', appointment);
    toast({
      title: 'Reschedule Request',
      description: `Reschedule request sent for appointment with ${appointment.doctor}`,
    });
    // In a real app, this would open a rescheduling interface
  };

  const handleCancel = (appointment: any) => {
    console.log('Cancelling:', appointment);
    toast({
      title: 'Appointment Cancelled',
      description: `Appointment with ${appointment.doctor} has been cancelled`,
      variant: 'destructive',
    });
    // In a real app, this would send a cancellation request
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('upcomingAppointments') || 'Upcoming Appointments'}</CardTitle>
        <CardDescription>
          {t('manageAppointments') || 'View and manage your appointments'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{appointment.doctor}</h3>
                  <p className="text-sm text-gray-600">{appointment.specialty}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  appointment.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.status}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {appointment.date}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {appointment.time}
                </div>
                <div className="flex items-center">
                  {appointment.type === 'video' ? (
                    <Video className="h-4 w-4 mr-1" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-1" />
                  )}
                  {appointment.type === 'video' ? 'Video Call' : 'In Person'}
                </div>
              </div>
              
              <div className="flex space-x-2">
                {appointment.type === 'video' && (
                  <Button size="sm" variant="default" onClick={() => handleJoinCall(appointment)}>
                    {t('joinCall') || 'Join Call'}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleReschedule(appointment)}>
                  {t('reschedule') || 'Reschedule'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleCancel(appointment)}>
                  {t('cancel') || 'Cancel'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentsList;
