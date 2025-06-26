import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Heart, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Pill, 
  FileText, 
  User, 
  Shield,
  Download,
  Activity,
  Stethoscope,
  BarChart3,
  MessageSquare,
  Bell
} from 'lucide-react';
import api from '@/lib/api';
import { Provider, Patient } from '@/types/user';
import { Appointment } from '@/types/appointment';
import { Prescription } from '@/types/prescription';
import { MedicalRecord } from '@/types/medicalRecord';
import { useNavigate, Link } from 'react-router-dom';
import DoctorAppointmentsList from '@/components/doctor/DoctorAppointmentsList';
import { PrescriptionModal } from '@/components/prescription/PrescriptionModal';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { useAppointments } from '@/hooks/useAppointments';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Modal from '@/components/ui/modal';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/ui/layout';

const DoctorDashboard: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const { user, isLoading: isUserLoading } = useUser();
  const { appointments, isLoading: isAppointmentsLoading } = useAppointments();
  const { prescriptions, isLoading: isPrescriptionsLoading } = usePrescriptions();
  const { logout } = useAuth();
  
  const navigate = useNavigate();
  const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [teleExpertiseRequests, setTeleExpertiseRequests] = useState<any[]>([]);
  const [loadingTeleExpertise, setLoadingTeleExpertise] = useState(true);
  const [showTeleExpertiseNotification, setShowTeleExpertiseNotification] = useState(false);
  
  // New state for Patients tab
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientMedicalRecords, setPatientMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loadingMedicalRecords, setLoadingMedicalRecords] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState<any[]>([]);
  const [patientConsultationHistory, setPatientConsultationHistory] = useState<any[]>([]);

  // Add state for respond modal
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [respondingRequest, setRespondingRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [isResponding, setIsResponding] = useState(false);

  const stats = useMemo(() => {
    if (!appointments || !prescriptions) {
      return { today: 0, totalPatients: 0, satisfaction: 98, earnings: 1200, prescriptions: 0 };
    }

    const activeAppointments = appointments.filter(
      (apt) => apt.status !== 'cancelled' && apt.status !== 'no-show'
    );

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = activeAppointments.filter(
      (apt: Appointment) => apt.scheduledDate.startsWith(today)
    ).length;

    const totalPatients = new Set(activeAppointments.map((apt: Appointment) => apt.patientId._id)).size;

    return { 
      today: todayAppointments, 
      totalPatients,
      satisfaction: 98, // Placeholder
      earnings: 1200,   // Placeholder
      prescriptions: prescriptions.length
    };
  }, [appointments, prescriptions]);

  useEffect(() => {
    setLoadingTeleExpertise(true);
    api.getTeleExpertiseRequests()
      .then((data) => {
        // Only show requests where the doctor is the recipient
        const doctorRequests = data.filter((req: any) => req.doctorId && req.doctorId._id === user?._id);
        setTeleExpertiseRequests(doctorRequests);
        setShowTeleExpertiseNotification(doctorRequests.some((req: any) => req.status === 'pending'));
      })
      .catch(() => toast.error('Failed to fetch tele-expertise requests'))
      .finally(() => setLoadingTeleExpertise(false));
  }, [user?._id]);

  const handleAppointmentStatusChange = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      await api.updateAppointment(id, { status });
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
    toast.success("Prescription created successfully!");
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

  // New function to handle patient selection
  const handlePatientSelect = async (patient: Patient) => {
    setLoadingMedicalRecords(true);
    try {
      // Fetch full patient profile
      const fullProfile = await api.getUserById(patient._id);
      setSelectedPatient(fullProfile as Patient);
      // Fetch consultation-centric dashboard data
      const dashboardData = await api.getPatientDashboard(patient._id);
      setPatientConsultationHistory(dashboardData.consultationHistory || []);
      // Optionally, set patientMedicalRecords if still needed elsewhere
      setPatientMedicalRecords(dashboardData.recentMedicalRecords || []);
    } catch (error) {
      toast.error('Failed to fetch patient profile or medical records');
    } finally {
      setLoadingMedicalRecords(false);
    }
  };

  // Function to toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleViewRecord = async (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsRecordModalOpen(true);
    // Fetch doctor's notes for the patient
    if (selectedPatient) {
      const notes = await api.getDoctorNotes(selectedPatient._id);
      setDoctorNotes(notes);
    }
  };

  const closeRecordModal = () => {
    setIsRecordModalOpen(false);
    setSelectedRecord(null);
    setDoctorNotes([]);
  };

  // Fetch doctor's notes when a patient is selected
  useEffect(() => {
    if (selectedPatient) {
      api.getDoctorNotes(selectedPatient._id).then(setDoctorNotes).catch(() => setDoctorNotes([]));
    }
  }, [selectedPatient]);

  const isLoading = isUserLoading || isAppointmentsLoading || isPrescriptionsLoading;

  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    navigate('/login');
    return null;
  }

  // Sidebar navigation items for doctor
  const sidebarItems = [
    {
      label: 'Dashboard',
      icon: <Activity className="h-5 w-5" />,
      href: '/dashboard/doctor'
    },
    {
      label: 'Appointments',
      icon: <Calendar className="h-5 w-5" />,
      href: '#'
    },
    {
      label: 'Patients',
      icon: <Users className="h-5 w-5" />,
      href: '#'
    },
    {
      label: 'Medical Records',
      icon: <FileText className="h-5 w-5" />,
      href: '#'
    },
    {
      label: 'Tele-Expertise',
      icon: <MessageSquare className="h-5 w-5" />,
      href: '#'
    },
    {
      label: 'Profile',
      icon: <User className="h-5 w-5" />,
      href: '/profile'
    }
  ];

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  return (
    <Layout
      title="Doctor Dashboard"
      subtitle="Manage your patients, consultations, and medical records"
      sidebarItems={sidebarItems}
    >
      <div className="space-y-8">
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="appointments" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Calendar className="h-4 w-4 mr-2" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="tele-expertise" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Tele-Expertise
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="h-4 w-4 mr-2" />
              Patients
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-xl">Appointment Management</CardTitle>
                <CardDescription>Manage your upcoming consultations and patient appointments</CardDescription>
              </CardHeader>
              <CardContent>
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
          </TabsContent>

          <TabsContent value="tele-expertise" className="space-y-6">
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-xl">Tele-Expertise Requests</CardTitle>
                <CardDescription>Requests from patients for your expertise and second opinions</CardDescription>
              </CardHeader>
              <CardContent>
                {showTeleExpertiseNotification && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">You have new tele-expertise requests!</span>
                    </div>
                  </div>
                )}
                {loadingTeleExpertise ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading tele-expertise requests...</span>
                  </div>
                ) : teleExpertiseRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tele-expertise requests at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teleExpertiseRequests.map((req) => (
                      <Card key={req._id} className="border-l-4 border-blue-500">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <User className="h-5 w-5 text-gray-500" />
                                <span className="font-semibold">
                                  {req.patientId?.firstName} {req.patientId?.lastName}
                                </span>
                                <Badge variant={req.status === 'pending' ? 'default' : 'secondary'}>
                                  {req.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Specialty:</strong> {req.specialty}</p>
                                <p><strong>Details:</strong> {req.details}</p>
                                <p><strong>Requested:</strong> {new Date(req.createdAt).toLocaleString()}</p>
                              </div>
                              {req.response && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm"><strong>Your Response:</strong> {req.response}</p>
                                </div>
                              )}
                              {req.patientFileUrl && (
                                <div className="mt-2">
                                  <a 
                                    href={`${BACKEND_URL}${req.patientFileUrl}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:underline text-sm"
                                  >
                                    📄 Patient's Submitted File
                                  </a>
                                </div>
                              )}
                              {req.reportUrl && (
                                <div className="mt-2">
                                  <a 
                                    href={`${BACKEND_URL}${req.reportUrl}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-green-700 hover:underline text-sm"
                                  >
                                    📝 Expert Report (Your Upload)
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              {req.status === 'pending' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={async () => {
                                      await api.updateTeleExpertiseRequest(req._id, { status: 'accepted' });
                                      toast.success('Request accepted');
                                      setTeleExpertiseRequests((prev) => prev.map(r => r._id === req._id ? { ...r, status: 'accepted' } : r));
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={async () => {
                                      await api.updateTeleExpertiseRequest(req._id, { status: 'rejected' });
                                      toast.success('Request rejected');
                                      setTeleExpertiseRequests((prev) => prev.map(r => r._id === req._id ? { ...r, status: 'rejected' } : r));
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {req.status === 'accepted' && (
                                <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => {
                                    setRespondingRequest(req);
                                    setRespondModalOpen(true);
                                    setResponseMessage('');
                                    setResponseFile(null);
                                  }}
                                >
                                  Respond
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient List */}
              <div className="lg:col-span-1">
                <Card className="bg-white shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="text-xl">My Patients</CardTitle>
                    <CardDescription>Select a patient to view their details and medical history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const uniquePatients = Array.from(
                        new Map(
                          (appointments || [])
                            .filter(apt => apt.patientId)
                            .map(apt => [apt.patientId._id, apt.patientId])
                        ).values()
                      );
                      if (uniquePatients.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No patients found.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          {uniquePatients.map((patient: any) => (
                            <div 
                              key={patient._id} 
                              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                selectedPatient?._id === patient._id 
                                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => handlePatientSelect(patient)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                  {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold">{patient.firstName} {patient.lastName}</div>
                                  <div className="text-sm text-gray-500">{patient.email}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Patient Details */}
              <div className="lg:col-span-2">
                {selectedPatient ? (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <Card className="bg-white shadow-sm border-0">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Patient Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                              <div className="text-sm text-gray-500 space-y-1 mt-2">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {selectedPatient.email}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {selectedPatient.phone}
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {selectedPatient.address}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {selectedPatient.dateOfBirth}
                                </div>
                              </div>
                            </div>
                            {/* Emergency Contact */}
                            {selectedPatient.emergencyContact && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h4 className="font-semibold text-red-800 mb-2">Emergency Contact</h4>
                                <div className="text-sm text-red-700 space-y-1">
                                  <p>{selectedPatient.emergencyContact.name} {selectedPatient.emergencyContact.relationship && `(${selectedPatient.emergencyContact.relationship})`}</p>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {selectedPatient.emergencyContact.phone}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            {((selectedPatient as any).gender) && (
                              <div className="text-sm text-gray-500">Gender: {(selectedPatient as any).gender}</div>
                            )}
                            {selectedPatient.cnamId && (
                              <div className="text-sm text-gray-500">CNAM ID: {selectedPatient.cnamId}</div>
                            )}
                            {selectedPatient.insurance && (
                              <div className="text-sm text-gray-500">
                                Insurance: {selectedPatient.insurance.provider} - {selectedPatient.insurance.policyNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Medical Information */}
                    <Card className="bg-white shadow-sm border-0">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Medical Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* Allergies */}
                          {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Allergies
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedPatient.allergies.map((allergy, index) => (
                                  <Badge key={index} variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                                    {allergy}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Current Medications */}
                          {selectedPatient.currentMedications && selectedPatient.currentMedications.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                                <Pill className="h-4 w-4" />
                                Current Medications
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedPatient.currentMedications.map((medication, index) => (
                                  <Badge key={index} className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                    {medication}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Medical History */}
                          {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-green-600 mb-3">Medical History</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedPatient.medicalHistory.map((condition, index) => (
                                  <Badge key={index} className="bg-green-100 text-green-800 hover:bg-green-200">
                                    {condition}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Consultation-Centric Medical Records */}
                    <Card className="bg-white shadow-sm border-0">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Consultations & Medical Records
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingMedicalRecords ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Loading medical records...</span>
                          </div>
                        ) : patientConsultationHistory.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No consultation history found.</p>
                          </div>
                        ) : (
                          <Accordion type="single" collapsible className="w-full">
                            {patientConsultationHistory.map((consultation: any, idx: number) => (
                              <AccordionItem value={String(idx)} key={consultation.appointment._id}>
                                <AccordionTrigger className="hover:bg-gray-50 p-4 rounded-lg">
                                  <div className="flex justify-between w-full items-center">
                                    <div className="flex items-center gap-3">
                                      <Calendar className="h-6 w-6 text-blue-600" />
                                      <div>
                                        <p className="font-semibold text-base">
                                          Consultation: {new Date(consultation.appointment.scheduledDate || consultation.appointment.date).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-gray-600 text-left">
                                          Dr. {consultation.appointment.providerId?.firstName} {consultation.appointment.providerId?.lastName}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant={consultation.totalRecords > 0 ? "default" : "secondary"}>
                                      {consultation.totalRecords} record{consultation.totalRecords !== 1 && 's'}
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 bg-gray-50">
                                  {consultation.totalRecords === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No records found for this consultation.</p>
                                  ) : (
                                    <Tabs defaultValue="prescriptions" className="w-full">
                                      <TabsList className="w-full flex flex-wrap gap-2 overflow-x-auto whitespace-nowrap bg-muted p-1 rounded-md mb-4">
                                        <TabsTrigger value="prescriptions" className="flex-1 min-w-[120px] max-w-full">Prescriptions</TabsTrigger>
                                        <TabsTrigger value="labs" className="flex-1 min-w-[120px] max-w-full">Lab Results</TabsTrigger>
                                        <TabsTrigger value="radiology" className="flex-1 min-w-[120px] max-w-full">Radiology</TabsTrigger>
                                        <TabsTrigger value="pharmacy" className="flex-1 min-w-[120px] max-w-full">Pharmacy</TabsTrigger>
                                        <TabsTrigger value="notes" className="flex-1 min-w-[120px] max-w-full">Doctor's Notes</TabsTrigger>
                                      </TabsList>
                                      <TabsContent value="prescriptions" className="mt-2">
                                        {consultation.prescriptions.length === 0 ? (
                                          <div className="text-gray-500">No prescriptions for this consultation.</div>
                                        ) : consultation.prescriptions.map((prescription: any) => (
                                          <div key={prescription._id} className="mb-4 p-3 bg-white rounded-lg border flex flex-col gap-2">
                                            <div className="font-semibold mb-2">Prescription: {prescription.medications?.length} medication(s)</div>
                                            {prescription.medications && prescription.medications.length > 0 && (
                                              <div className="overflow-x-auto">
                                                <table className="min-w-full text-sm border">
                                                  <thead>
                                                    <tr className="bg-gray-100">
                                                      <th className="px-2 py-1 border">Name</th>
                                                      <th className="px-2 py-1 border">Dosage</th>
                                                      <th className="px-2 py-1 border">Frequency</th>
                                                      <th className="px-2 py-1 border">Duration</th>
                                                      <th className="px-2 py-1 border">Instructions</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {prescription.medications.map((med: any, idx: number) => (
                                                      <tr key={idx}>
                                                        <td className="px-2 py-1 border">{med.name}</td>
                                                        <td className="px-2 py-1 border">{med.dosage}</td>
                                                        <td className="px-2 py-1 border">{med.frequency}</td>
                                                        <td className="px-2 py-1 border">{med.duration}</td>
                                                        <td className="px-2 py-1 border">{med.instructions}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                            {prescription.notes && (
                                              <div className="mt-2 text-gray-700"><strong>Notes:</strong> {prescription.notes}</div>
                                            )}
                                          </div>
                                        ))}
                                      </TabsContent>
                                      <TabsContent value="labs" className="mt-2">
                                        {consultation.medicalRecords.filter((r: any) => r.type === 'lab_result').length === 0 ? (
                                          <div className="text-gray-500">No lab results for this consultation.</div>
                                        ) : consultation.medicalRecords.filter((r: any) => r.type === 'lab_result').map((record: any) => (
                                          <div key={record._id} className="mb-4 p-3 bg-gray-50 rounded-lg border">
                                            <div className="font-semibold mb-2">Lab Result: {record.title}</div>
                                            {/* Structured report fields */}
                                            {record.report && (
                                              <div className="mb-2">
                                                {record.report?.resultSummary && <div><strong>Result Summary:</strong> {record.report.resultSummary}</div>}
                                                {record.report?.referenceRange && <div><strong>Reference Range:</strong> {record.report.referenceRange}</div>}
                                              </div>
                                            )}
                                            {/* Files */}
                                            {record.files?.length ? (
                                              <div className="flex flex-col gap-2 mt-2">
                                                {record.files.map((file: any, idx: number) => (
                                                  <div key={idx} className="flex items-center gap-2">
                                                    {file.mimetype?.startsWith('image/') ? <img src={file.url} alt={file.filename} className="h-8 w-8 object-cover rounded" /> : <FileText className="h-6 w-6 text-blue-500" />}
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{file.filename}</a>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : <div className="text-gray-400">No files uploaded.</div>}
                                          </div>
                                        ))}
                                      </TabsContent>
                                      <TabsContent value="radiology" className="mt-2">
                                        {consultation.medicalRecords.filter((r: any) => r.type === 'imaging').length === 0 ? (
                                          <div className="text-gray-500">No radiology results for this consultation.</div>
                                        ) : consultation.medicalRecords.filter((r: any) => r.type === 'imaging').map((record: any) => (
                                          <div key={record._id} className="mb-4 p-3 bg-gray-50 rounded-lg border">
                                            <div className="font-semibold mb-2">Radiology Result: {record.title}</div>
                                            {/* Structured report fields */}
                                            {record.report && (
                                              <div className="mb-2">
                                                {record.report?.impression && <div><strong>Impression:</strong> {record.report.impression}</div>}
                                                {record.report?.findings && <div><strong>Findings:</strong> {record.report.findings}</div>}
                                              </div>
                                            )}
                                            {/* Files */}
                                            {record.files?.length ? (
                                              <div className="flex flex-col gap-2 mt-2">
                                                {record.files.map((file: any, idx: number) => (
                                                  <div key={idx} className="flex items-center gap-2">
                                                    {file.mimetype?.startsWith('image/') ? <img src={file.url} alt={file.filename} className="h-8 w-8 object-cover rounded" /> : <FileText className="h-6 w-6 text-blue-500" />}
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{file.filename}</a>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : <div className="text-gray-400">No files uploaded.</div>}
                                          </div>
                                        ))}
                                      </TabsContent>
                                      <TabsContent value="pharmacy" className="mt-2">
                                        <div className="text-gray-500">Pharmacy fulfillment details coming soon.</div>
                                      </TabsContent>
                                      <TabsContent value="notes" className="mt-2">
                                        <div className="space-y-3">
                                          {doctorNotes.length === 0 ? (
                                            <div className="text-gray-400">No notes found for this patient.</div>
                                          ) : (
                                            doctorNotes
                                              .filter(note => note.appointmentId && note.appointmentId === consultation.appointment._id)
                                              .map((note, idx) => (
                                                <div key={idx} className="p-3 bg-white rounded-lg border shadow-sm flex gap-3 items-start">
                                                  <User className="h-6 w-6 text-blue-400 mt-1" />
                                                  <div>
                                                    <div className="text-xs text-gray-500 mb-1">{new Date(note.createdAt).toLocaleString()}</div>
                                                    <div className="text-gray-800 whitespace-pre-line">{note.details?.content || note.details || note.content}</div>
                                                  </div>
                                                </div>
                                              ))
                                          )}
                                        </div>
                                      </TabsContent>
                                    </Tabs>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="bg-white shadow-sm border-0">
                    <CardContent className="flex items-center justify-center h-64">
                      <div className="text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <div>Select a patient to view their details</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Today's Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.today}</div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Total Patients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.totalPatients}</div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Prescriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.prescriptions}</div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                  <CardTitle>Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{stats.satisfaction}%</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tabbed Modal for Medical Record */}
      <Modal isOpen={isRecordModalOpen} onClose={closeRecordModal} title={selectedRecord?.title || 'Record Details'}>
        {selectedRecord && (
          <Tabs defaultValue="prescription" className="w-full">
            <TabsList className="w-full flex flex-wrap gap-2 overflow-x-auto whitespace-nowrap bg-muted p-1 rounded-md mb-4">
              <TabsTrigger value="prescription" className="flex-1 min-w-[120px] max-w-full">Prescription</TabsTrigger>
              <TabsTrigger value="lab" className="flex-1 min-w-[120px] max-w-full">Lab Results</TabsTrigger>
              <TabsTrigger value="radiology" className="flex-1 min-w-[120px] max-w-full">Radiology Results</TabsTrigger>
              <TabsTrigger value="pharmacy" className="flex-1 min-w-[120px] max-w-full">Pharmacy</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 min-w-[120px] max-w-full">Doctor's Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="prescription" className="mt-2">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="font-semibold mb-2">Prescription Details</div>
                <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded border">
                  {JSON.stringify(selectedRecord.details, null, 2)}
                </pre>
              </div>
            </TabsContent>
            <TabsContent value="lab" className="mt-2">
              {selectedRecord.type === 'lab_result' && selectedRecord.files?.length ? (
                <div className="flex flex-col gap-2 mt-2">
                  {selectedRecord.files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {file.mimetype?.startsWith('image/') ? <img src={file.url} alt={file.filename} className="h-8 w-8 object-cover rounded" /> : <FileText className="h-6 w-6 text-blue-500" />}
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{file.filename}</a>
                    </div>
                  ))}
                </div>
              ) : <div className="text-gray-400">No lab files uploaded.</div>}
              {selectedRecord.report && (
                <div className="mt-4">
                  {selectedRecord.report.resultSummary && <div><strong>Result Summary:</strong> {selectedRecord.report.resultSummary}</div>}
                  {selectedRecord.report.referenceRange && <div><strong>Reference Range:</strong> {selectedRecord.report.referenceRange}</div>}
                </div>
              )}
            </TabsContent>
            <TabsContent value="radiology" className="mt-2">
              {selectedRecord.type === 'imaging' && selectedRecord.files?.length ? (
                <div className="flex flex-col gap-2 mt-2">
                  {selectedRecord.files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {file.mimetype?.startsWith('image/') ? <img src={file.url} alt={file.filename} className="h-8 w-8 object-cover rounded" /> : <FileText className="h-6 w-6 text-blue-500" />}
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{file.filename}</a>
                    </div>
                  ))}
                </div>
              ) : <div className="text-gray-400">No radiology files uploaded.</div>}
              {selectedRecord.report && (
                <div className="mt-4">
                  {selectedRecord.report.impression && <div><strong>Impression:</strong> {selectedRecord.report.impression}</div>}
                  {selectedRecord.report.findings && <div><strong>Findings:</strong> {selectedRecord.report.findings}</div>}
                </div>
              )}
            </TabsContent>
            <TabsContent value="pharmacy" className="mt-2">
              <div className="text-gray-500">Pharmacy fulfillment details coming soon.</div>
            </TabsContent>
            <TabsContent value="notes" className="mt-2">
              <div className="space-y-3">
                {doctorNotes.length === 0 ? (
                  <div className="text-gray-400">No notes found for this patient.</div>
                ) : doctorNotes.map((note, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border shadow-sm flex gap-3 items-start">
                    <User className="h-6 w-6 text-blue-400 mt-1" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">{new Date(note.createdAt).toLocaleString()}</div>
                      <div className="text-gray-800 whitespace-pre-line">{note.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </Modal>

      {/* Respond Modal */}
      <Modal isOpen={respondModalOpen} onClose={() => setRespondModalOpen(false)} title="Respond to Tele-Expertise Request">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!respondingRequest) return;
            setIsResponding(true);
            try {
              // 1. Send the response message
              await api.updateTeleExpertiseRequest(respondingRequest._id, { response: responseMessage });
              // 2. Upload the report file if present
              let reportUrl = respondingRequest.reportUrl;
              if (responseFile) {
                const result = await api.uploadTeleExpertiseReport(respondingRequest._id, responseFile);
                reportUrl = result.url;
              }
              // 3. Mark as completed if file uploaded
              await api.updateTeleExpertiseRequest(respondingRequest._id, { reportUrl, status: 'completed' });
              toast.success('Response and report submitted');
              setTeleExpertiseRequests((prev) => prev.map(r => r._id === respondingRequest._id ? { ...r, response: responseMessage, reportUrl, status: 'completed' } : r));
              setRespondModalOpen(false);
            } catch (err) {
              toast.error('Failed to submit response or report');
            } finally {
              setIsResponding(false);
            }
          }}
        >
          <div className="mb-4">
            <label className="block font-medium mb-1">Message to Patient</label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={responseMessage}
              onChange={e => setResponseMessage(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Upload Report (PDF or image)</label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={e => setResponseFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRespondModalOpen(false)} disabled={isResponding}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isResponding}>
              {isResponding ? 'Submitting...' : 'Submit Response'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default DoctorDashboard;


