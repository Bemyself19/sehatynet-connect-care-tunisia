
import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, MapPin, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Modal from '@/components/ui/modal';

const AppointmentsList: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      doctor: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      date: '2024-01-15',
      time: '10:00 AM',
      type: 'video',
      status: 'confirmed',
      reason: 'Follow-up consultation'
    },
    {
      id: 2,
      doctor: 'Dr. Ahmed Hassan',
      specialty: 'General Practitioner',
      date: '2024-01-18',
      time: '2:30 PM',
      type: 'in-person',
      status: 'pending',
      reason: 'General checkup'
    },
    {
      id: 3,
      doctor: 'Dr. Maria Rodriguez',
      specialty: 'Dermatologist',
      date: '2024-01-20',
      time: '11:00 AM',
      type: 'in-person',
      status: 'confirmed',
      reason: 'Skin examination'
    }
  ]);

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleJoinCall = (appointment: any) => {
    if (appointment.type === 'video') {
      // Open new window with WebRTC interface
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Video Call - ${appointment.doctor}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                .video-container { background: white; padding: 20px; border-radius: 8px; text-align: center; }
                .controls { margin-top: 20px; }
                button { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; }
                .mic-btn { background: #4CAF50; color: white; }
                .camera-btn { background: #2196F3; color: white; }
                .end-btn { background: #f44336; color: white; }
              </style>
            </head>
            <body>
              <div class="video-container">
                <h2>Video Call with ${appointment.doctor}</h2>
                <p>Appointment: ${appointment.date} at ${appointment.time}</p>
                <div style="background: #000; height: 300px; margin: 20px 0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;">
                  <p>Video feed will appear here</p>
                </div>
                <div class="controls">
                  <button class="mic-btn" onclick="toggleMic()">🎤 Microphone</button>
                  <button class="camera-btn" onclick="toggleCamera()">📹 Camera</button>
                  <button class="end-btn" onclick="window.close()">📞 End Call</button>
                </div>
              </div>
              <script>
                function toggleMic() { alert('Microphone toggled'); }
                function toggleCamera() { alert('Camera toggled'); }
                // Auto-enable mic and camera when joining
                navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                  .then(stream => console.log('Media access granted'))
                  .catch(err => console.log('Media access denied'));
              </script>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
      toast({
        title: 'Joining Video Call',
        description: `Starting video call with ${appointment.doctor}`,
      });
    } else {
      toast({
        title: 'In-Person Appointment',
        description: 'Please visit the clinic at the scheduled time',
      });
    }
  };

  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsRescheduleModalOpen(true);
  };

  const confirmReschedule = () => {
    if (newDate && newTime && selectedAppointment) {
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { ...apt, date: newDate, time: newTime, status: 'pending' }
          : apt
      ));
      
      toast({
        title: 'Appointment Rescheduled',
        description: `Appointment moved to ${newDate} at ${newTime}. Status: Pending confirmation`,
      });
      
      setIsRescheduleModalOpen(false);
      setNewDate('');
      setNewTime('');
      setSelectedAppointment(null);
    }
  };

  const handleCancel = (appointmentId: number) => {
    setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
    toast({
      title: 'Appointment Cancelled',
      description: 'Your appointment has been cancelled successfully',
    });
  };

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('appointments') || 'My Appointments'}</CardTitle>
          <CardDescription>
            {t('upcomingAppointments') || 'Your upcoming appointments'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No appointments scheduled</p>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">{appointment.doctor}</h3>
                        <p className="text-sm text-gray-600">{appointment.specialty}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {appointment.date}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {appointment.time}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            {appointment.type === 'video' ? (
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
                  
                  <div className="flex space-x-2">
                    {appointment.status === 'confirmed' && (
                      <Button size="sm" onClick={() => handleJoinCall(appointment)}>
                        {appointment.type === 'video' ? 'Join Call' : 'View Details'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleReschedule(appointment)}>
                      Reschedule
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleCancel(appointment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Appointment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Time</label>
            <select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Select time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button onClick={confirmReschedule} disabled={!newDate || !newTime}>
              Confirm Reschedule
            </Button>
            <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AppointmentsList;
