import React from 'react';
import { Appointment } from '@/types/appointment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Check, X, Video, FilePlus } from 'lucide-react';
import { isAfter, isEqual, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const now = new Date();
  const upcomingAppointments = appointments.filter(apt => {
    if (apt.status !== 'confirmed') return false;
    const apptDateTime = parseISO(`${apt.scheduledDate}T${apt.scheduledTime}`);
    // Show if appointment is today or in the future
    return isAfter(apptDateTime, now) || isEqual(apptDateTime, now);
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('pendingAppointments')}</CardTitle>
          <CardDescription>{t('reviewAndConfirmRequests')}</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingAppointments.length === 0 ? (
            <p className="text-gray-500">{t('noPendingAppointments')}</p>
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
                      {t(apt.appointmentType)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onConfirm(apt._id)}>
                      <Check className="w-4 h-4 mr-2" /> {t('confirm')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onCancel(apt._id)}>
                       <X className="w-4 h-4 mr-2" /> {t('cancel')}
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
          <CardTitle>{t('upcomingAppointments')}</CardTitle>
          <CardDescription>{t('confirmedAppointmentsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-gray-500">{t('noUpcomingAppointments')}</p>
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
                      {t(apt.appointmentType)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {apt.appointmentType === 'video' && (
                       <Button size="sm" onClick={() => onJoinCall(apt)}>{t('joinCall')}</Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onCreatePrescription(apt)}
                    >
                      <FilePlus className="w-4 h-4 mr-2" />
                      {t('prescription')}
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
