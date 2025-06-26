import React from 'react';
import { Appointment } from '@/types/appointment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Check, X, Video, FilePlus } from 'lucide-react';

interface DoctorAppointmentsListProps {
  appointments: Appointment[];
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onJoinCall: (appointment: Appointment) => void;
  onCreatePrescription: (appointment: Appointment) => void;
}

const DoctorAppointmentsList: React.FC<DoctorAppointmentsListProps> = ({ 
  appointments, 
  onConfirm, 
  onCancel, 
  onJoinCall, 
  onCreatePrescription 
}) => {
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const upcomingAppointments = appointments.filter(apt => apt.status === 'confirmed');

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Pending Appointments</CardTitle>
          <CardDescription>Review and confirm new appointment requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingAppointments.length === 0 ? (
            <p className="text-gray-500">No pending appointments.</p>
          ) : (
            <div className="space-y-4">
              {pendingAppointments.map(apt => (
                <div key={apt._id} className="border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{apt.patientId.firstName} {apt.patientId.lastName}</div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(apt.scheduledDate).toLocaleDateString()}
                      <Clock className="w-4 h-4 ml-4 mr-2" />
                      {apt.scheduledTime}
                    </div>
                     <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Video className="w-4 h-4 mr-2" />
                      {apt.appointmentType}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onConfirm(apt._id)}>
                      <Check className="w-4 h-4 mr-2" /> Confirm
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onCancel(apt._id)}>
                       <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your confirmed appointments for today and the future.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-gray-500">No upcoming appointments.</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map(apt => (
                <div key={apt._id} className="border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{apt.patientId.firstName} {apt.patientId.lastName}</div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(apt.scheduledDate).toLocaleDateString()}
                      <Clock className="w-4 h-4 ml-4 mr-2" />
                      {apt.scheduledTime}
                    </div>
                     <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Video className="w-4 h-4 mr-2" />
                      {apt.appointmentType}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {apt.appointmentType === 'video' && (
                       <Button size="sm" onClick={() => onJoinCall(apt)}>Join Call</Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onCreatePrescription(apt)}
                    >
                      <FilePlus className="w-4 h-4 mr-2" />
                      Prescription
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAppointmentsList;
