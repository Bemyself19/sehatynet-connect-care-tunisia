import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileText, Pill, Microscope, Camera, Syringe, Scissors, Eye, EyeOff, Lock, Unlock, 
  Calendar, User, Stethoscope, Download, BarChart2, Clock, Plus, AlertTriangle, Shield
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import api from '@/lib/api';
import { MedicalRecord } from '@/types/medicalRecord';
import { Appointment } from '@/types/appointment';
import { Prescription } from '@/types/prescription';
import { LabResult } from '@/types/labResult';
import { MedicationHistory as Medication } from '@/types/medication';
import { Allergy } from '@/types/allergy';
import { Immunization } from '@/types/immunization';
import { toast } from 'sonner';
import Modal from '@/components/ui/modal';
import PrescriptionDetail from '@/components/prescription/PrescriptionDetail';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from 'react-i18next';

type DashboardData = {
  stats: {
    totalConsultations: number;
    totalPrescriptions: number;
    totalRecords: number;
  };
  consultationHistory: {
    appointment: Appointment;
    medicalRecords: MedicalRecord[];
    prescriptions: Prescription[];
    totalRecords: number;
  }[];
  recentRecords: MedicalRecord[];
};

type ViewableRecord = MedicalRecord | Prescription;

const MedicalRecords: React.FC = () => {
  const { user: currentUser } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ViewableRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Enhanced medical records data
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);

  const isDoctor = currentUser?.role === 'doctor';

  const { t, i18n } = useTranslation();

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPatientDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnhancedMedicalRecords = async () => {
    if (!currentUser?._id) return;
    
    try {
      setIsLoadingEnhanced(true);
      const [labResultsData, medicationsData, allergiesData, immunizationsData] = await Promise.all([
        api.getLabResults(),
        api.getMedicationHistory(),
        api.getAllergies(),
        api.getImmunizations()
      ]);
      
      setLabResults(labResultsData);
      setMedications(medicationsData);
      setAllergies(allergiesData);
      setImmunizations(immunizationsData);
    } catch (err) {
      console.error('Failed to fetch enhanced medical records:', err);
      toast.error('Failed to load some medical records');
    } finally {
      setIsLoadingEnhanced(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchEnhancedMedicalRecords();
  }, [currentUser?._id]);

  const handleView = (item: ViewableRecord) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleDownload = async (item: ViewableRecord) => {
    const isPrescription = !('type' in item);
    if (isPrescription) {
      try {
        const response = await fetch(`/api/prescriptions/${item._id}/pdf`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to download prescription PDF');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `prescription-${item._id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        toast.error('Failed to download prescription PDF');
      }
      return;
    }
    // Fallback for other records (text file)
    let pdfContent = `SehatyNet Medical Record\n\n`;
    pdfContent += `Record: ${item.title}\n`;
    pdfContent += `Date: ${new Date(item.date).toLocaleDateString()}\n`;
    pdfContent += `Type: ${item.type}\n`;
    pdfContent += `Provider: ${item.providerId.firstName} ${item.providerId.lastName}\n\n`;
    pdfContent += `Details:\n${JSON.stringify(item.details, null, 2)}`;
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `medical_record-${item._id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrivacyChange = async (recordId: string, newPrivacyLevel: string) => {
    try {
      await api.updateMedicalRecordPrivacy(recordId, newPrivacyLevel);
      toast.success('Privacy settings updated');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to update privacy:', error);
      toast.error('Failed to update privacy settings');
    }
  };
  
  const canManagePrivacy = (record: MedicalRecord) => {
    return currentUser?.role === 'doctor' && record.providerId._id === currentUser._id;
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactElement } = {
      consultation: <Stethoscope className="h-5 w-5 text-blue-500" />,
      prescription: <Pill className="h-5 w-5 text-orange-500" />,
      lab_result: <Microscope className="h-5 w-5 text-purple-500" />,
      imaging: <Camera className="h-5 w-5 text-green-500" />,
      vaccination: <Syringe className="h-5 w-5 text-yellow-500" />,
      surgery: <Scissors className="h-5 w-5 text-red-500" />,
    };
    return icons[type] || <FileText className="h-5 w-5" />;
  };
  
  const getPrivacyIcon = (level: string) => {
    const icons: { [key: string]: React.ReactElement } = {
      doctor_only: <Lock className="h-3 w-3" />,
      patient_visible: <Eye className="h-3 w-3" />,
      shared: <Unlock className="h-3 w-3" />,
      private: <Lock className="h-3 w-3" />,
    };
    return icons[level] || <Lock className="h-3 w-3" />;
  };

  const getPrivacyLabel = (level: string) => {
    const labels: { [key: string]: string } = {
        doctor_only: "Doctor Only",
        patient_visible: "Patient Visible",
        shared: "Shared",
        private: "Private",
    };
    return labels[level] || "Private";
  };
  
  const getPrivacyColor = (level: string) => {
    const colors: { [key: string]: string } = {
      doctor_only: 'bg-red-100 text-red-800',
      patient_visible: 'bg-green-100 text-green-800',
      shared: 'bg-blue-100 text-blue-800',
      private: 'bg-gray-100 text-gray-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const renderConsultationHistory = () => {
    const sortedHistory = [...(dashboardData?.consultationHistory ?? [])].sort((a, b) => new Date(b.appointment.scheduledDate).getTime() - new Date(a.appointment.scheduledDate).getTime());
    if (sortedHistory.length === 0) {
      return <div className="text-gray-500 text-center py-8">{t('noConsultationHistory')}</div>;
    }
    return (
      <Accordion type="single" collapsible className="w-full">
        {sortedHistory.map((consultation, idx) => (
          <AccordionItem value={String(idx)} key={consultation.appointment._id}>
            <AccordionTrigger className="hover:bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between w-full items-center">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-base">
                      {t('consultation')}: {new Date(consultation.appointment.scheduledDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 text-left">
                      Dr. {consultation.appointment.providerId.firstName} {consultation.appointment.providerId.lastName}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={consultation.totalRecords > 0 ? "default" : "secondary"}
                  {...(i18n.language === 'ar' ? { dir: 'rtl' } : {})}
                >
                  {i18n.language === 'ar'
                    ? `${t('record', { count: consultation.totalRecords })} ${consultation.totalRecords}`
                    : `${consultation.totalRecords} ${t('record', { count: consultation.totalRecords })}`
                  }
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 bg-gray-50">
              {consultation.totalRecords === 0 ? (
                <p className="text-gray-500 text-center py-4">No records found for this consultation.</p>
              ) : (
                <div className="space-y-4 pl-4 border-l-2 ml-2 border-blue-200">
                  {/* Prescriptions */}
                  {consultation.prescriptions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-orange-600">
                        <Pill className="h-4 w-4" />
                        {t('prescriptions')} ({consultation.prescriptions.length})
                      </h4>
                      {consultation.prescriptions.map((prescription: Prescription) => (
                        <div key={prescription._id} className="p-3 bg-white rounded-lg border flex justify-between items-center">
                          <p className="text-sm font-medium">
                            {prescription.medications.length} medication(s)
                            {prescription.labTests && `, ${prescription.labTests.length} lab test(s)`}
                            {prescription.radiology && `, ${prescription.radiology.length} radiology exam(s)`}
                            prescribed
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleView(prescription)}><Eye className="h-4 w-4 mr-1" />{t('view')}</Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownload(prescription)}><Download className="h-4 w-4 mr-1" />{t('download')}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Medical Records */}
                  {consultation.medicalRecords.filter(record => !isDoctor || record.title !== 'Pharmacy Request').length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-600">
                        <FileText className="h-4 w-4" />
                        {t('otherRecords')} ({consultation.medicalRecords.filter(record => !isDoctor || record.title !== 'Pharmacy Request').length})
                      </h4>
                      {consultation.medicalRecords.filter(record => !isDoctor || record.title !== 'Pharmacy Request').map((record: MedicalRecord) => (
                        <div key={record._id} className="p-3 bg-white rounded-lg border flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 flex-grow">
                            {getTypeIcon(record.type)}
                            <span className="font-medium text-sm">{record.title}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={`${getPrivacyColor(record.privacyLevel)} text-xs`}>
                              <div className="flex items-center gap-1">
                                {getPrivacyIcon(record.privacyLevel)}
                                {getPrivacyLabel(record.privacyLevel)}
                              </div>
                            </Badge>
                            {canManagePrivacy(record) && (
                              <Select value={record.privacyLevel} onValueChange={(value) => handlePrivacyChange(record._id, value)}>
                                <SelectTrigger className="w-auto h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="doctor_only">Doctor Only</SelectItem>
                                  <SelectItem value="patient_visible">Patient Visible</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleView(record)}><Eye className="h-4 w-4" />{t('view')}</Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownload(record)}><Download className="h-4 w-4" />{t('download')}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  const renderRecentRecords = () => {
    const records = dashboardData?.recentRecords ?? [];
    if (records.length === 0) {
      return <div className="text-gray-500 text-center py-8">{t('noRecentRecords')}</div>;
    }
    return (
      <div className="space-y-3">
        {records.map(record => (
          <Card key={record._id} className="p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
                {getTypeIcon(record.type)}
                <div>
                  <p className="font-semibold">{record.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(record.date).toLocaleDateString()} &bull; {record.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleView(record)}>{t('view')}</Button>
          </Card>
        ))}
      </div>
    );
  };

  const renderLabResults = () => {
    if (isLoadingEnhanced) return <div className="text-center py-8">Loading lab results...</div>;
    
    if (labResults.length === 0) {
      return (
        <div className="text-center py-8">
          <Microscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No lab results found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {labResults.map((result) => (
          <Card key={result._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{result.labName}</CardTitle>
                  <p className="text-sm text-gray-600">
                    Ordered: {new Date(result.orderDate).toLocaleDateString()}
                    {result.resultDate && ` • Results: ${new Date(result.resultDate).toLocaleDateString()}`}
                  </p>
                </div>
                <Badge 
                  variant={result.overallStatus === 'normal' ? 'default' : 
                          result.overallStatus === 'critical' ? 'destructive' : 'secondary'}
                >
                  {result.overallStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.tests.map((test, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{test.testName}</p>
                      <p className="text-sm text-gray-600">{test.value} {test.unit}</p>
                    </div>
                    <div className="text-right">
                      {test.referenceRange && (
                        <p className="text-xs text-gray-500">
                          Ref: {test.referenceRange.min}-{test.referenceRange.max} {test.unit}
                        </p>
                      )}
                      <Badge 
                        variant={test.status === 'normal' ? 'default' : 
                                test.status === 'critical' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {test.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {result.clinicalNotes && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm font-medium text-blue-900">Clinical Notes:</p>
                  <p className="text-sm text-blue-800">{result.clinicalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderMedications = () => {
    if (isLoadingEnhanced) return <div className="text-center py-8">Loading medications...</div>;
    
    if (medications.length === 0) {
      return (
        <div className="text-center py-8">
          <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No medications found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {medications.map((medication) => (
          <Card key={medication._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{medication.medicationName}</CardTitle>
                  {medication.genericName && (
                    <p className="text-sm text-gray-600">Generic: {medication.genericName}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Started: {new Date(medication.startDate).toLocaleDateString()}
                    {medication.endDate && ` • Ended: ${new Date(medication.endDate).toLocaleDateString()}`}
                  </p>
                </div>
                <Badge 
                  variant={medication.status === 'active' ? 'default' : 
                          medication.status === 'discontinued' ? 'destructive' : 'secondary'}
                >
                  {medication.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm">Dosage:</p>
                  <p className="text-sm text-gray-600">
                    {medication.dosage.amount} {medication.dosage.unit} {medication.dosage.frequency}
                    {medication.dosage.timing && ` (${medication.dosage.timing})`}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Type:</p>
                  <p className="text-sm text-gray-600 capitalize">{medication.medicationType.replace('_', ' ')}</p>
                </div>
              </div>
              {medication.reason && (
                <div className="mt-3">
                  <p className="font-medium text-sm">Reason:</p>
                  <p className="text-sm text-gray-600">{medication.reason}</p>
                </div>
              )}
              {medication.sideEffects.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-sm">Side Effects:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {medication.sideEffects.map((effect, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {effect}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {medication.notes && (
                <div className="mt-3 p-2 bg-yellow-50 rounded">
                  <p className="text-sm text-yellow-800">{medication.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderAllergies = () => {
    if (isLoadingEnhanced) return <div className="text-center py-8">Loading allergies...</div>;
    
    if (allergies.length === 0) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No allergies found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {allergies.map((allergy) => (
          <Card key={allergy._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{allergy.allergenName}</CardTitle>
                  <p className="text-sm text-gray-600 capitalize">
                    {allergy.allergenType.replace('_', ' ')}
                    {allergy.category && ` • ${allergy.category}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    variant={allergy.status === 'active' ? 'destructive' : 'secondary'}
                  >
                    {allergy.status}
                  </Badge>
                  {allergy.isHighRisk && (
                    <Badge variant="destructive">High Risk</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allergy.reactions.map((reaction, index) => (
                  <div key={index} className="p-2 bg-red-50 rounded">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{reaction.reaction}</p>
                      <Badge 
                        variant={reaction.severity === 'life_threatening' ? 'destructive' : 
                                reaction.severity === 'severe' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {reaction.severity.replace('_', ' ')}
                      </Badge>
                    </div>
                    {reaction.notes && (
                      <p className="text-sm text-red-700 mt-1">{reaction.notes}</p>
                    )}
                  </div>
                ))}
              </div>
              {allergy.emergencyInstructions && (
                <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-sm font-medium text-red-900">Emergency Instructions:</p>
                  <p className="text-sm text-red-800">{allergy.emergencyInstructions}</p>
                </div>
              )}
              {allergy.avoidanceInstructions && (
                <div className="mt-3 p-3 bg-yellow-50 rounded">
                  <p className="text-sm font-medium text-yellow-900">Avoidance Instructions:</p>
                  <p className="text-sm text-yellow-800">{allergy.avoidanceInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderImmunizations = () => {
    if (isLoadingEnhanced) return <div className="text-center py-8">Loading immunizations...</div>;
    
    if (immunizations.length === 0) {
      return (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No immunizations found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {immunizations.map((immunization) => (
          <Card key={immunization._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{immunization.vaccineName}</CardTitle>
                  {immunization.vaccineType && (
                    <p className="text-sm text-gray-600">{immunization.vaccineType}</p>
                  )}
                  <p className="text-sm text-gray-600 capitalize">
                    {immunization.category.replace('_', ' ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    variant={immunization.status === 'up_to_date' ? 'default' : 
                            immunization.status === 'overdue' ? 'destructive' : 'secondary'}
                  >
                    {immunization.status.replace('_', ' ')}
                  </Badge>
                  {immunization.isRequired && (
                    <Badge variant="outline">Required</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm">Doses ({immunization.doses.length}/{immunization.totalDosesRequired}):</p>
                  <div className="space-y-2 mt-2">
                    {immunization.doses.map((dose, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <div>
                          <p className="text-sm font-medium">Dose {dose.doseNumber}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(dose.date).toLocaleDateString()}
                            {dose.site && ` • ${dose.site}`}
                          </p>
                        </div>
                        {dose.lotNumber && (
                          <p className="text-xs text-gray-500">Lot: {dose.lotNumber}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {immunization.nextDueDate && (
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-sm font-medium text-blue-900">Next Due:</p>
                    <p className="text-sm text-blue-800">
                      {new Date(immunization.nextDueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {immunization.contraindications.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-sm">Contraindications:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {immunization.contraindications.map((contraindication, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {contraindication}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {immunization.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">{immunization.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderStats = () => {
    const stats = dashboardData?.stats;
    if (!stats) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center">
          <Stethoscope className="h-8 w-8 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{stats.totalConsultations}</p>
          <p className="text-sm text-gray-500">{t('consultations')}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <Pill className="h-8 w-8 text-orange-500 mb-2" />
          <p className="text-2xl font-bold">{stats.totalPrescriptions}</p>
          <p className="text-sm text-gray-500">{t('prescriptions')}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <FileText className="h-8 w-8 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{stats.totalRecords}</p>
          <p className="text-sm text-gray-500">{t('medicalRecordsLabel')}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <Microscope className="h-8 w-8 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{labResults.length}</p>
          <p className="text-sm text-gray-500">{t('labResults')}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <Pill className="h-8 w-8 text-indigo-500 mb-2" />
          <p className="text-2xl font-bold">{medications.filter(m => m.status === 'active').length}</p>
          <p className="text-sm text-gray-500">{t('activeMedications')}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-2xl font-bold">{allergies.filter(a => a.status === 'active').length}</p>
          <p className="text-sm text-gray-500">{t('activeAllergies')}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <Shield className="h-8 w-8 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{immunizations.filter(i => i.status === 'up_to_date').length}</p>
          <p className="text-sm text-gray-500">{t('upToDateVaccines')}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <BarChart2 className="h-8 w-8 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold">{immunizations.filter(i => i.status === 'overdue').length}</p>
          <p className="text-sm text-gray-500">{t('overdueVaccines')}</p>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return <div>Loading records...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!dashboardData) return <div>No records found.</div>;

    return (
      <Tabs defaultValue="consultations" className="w-full">
        <div className="w-full overflow-x-auto max-w-full">
          <TabsList>
            <TabsTrigger value="consultations" className="flex-1 min-w-[160px] max-w-full">
              <Calendar className="h-4 w-4 mr-2" style={{ color: '#2563eb' }} />
              {t('medicalRecords.tabs.consultations')}
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1 min-w-[120px] max-w-full">
              <Calendar className="h-4 w-4 mr-2" style={{ color: '#334155' }} />
              {t('medicalRecords.tabs.recent')}
            </TabsTrigger>
            <TabsTrigger value="lab-results" className="flex-1 min-w-[120px] max-w-full">
              <Microscope className="h-4 w-4 mr-2" style={{ color: '#7c3aed' }} />
              {t('medicalRecords.tabs.labResults')}
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex-1 min-w-[120px] max-w-full">
              <Pill className="h-4 w-4 mr-2" style={{ color: '#0ea5e9' }} />
              {t('medicalRecords.tabs.medications')}
            </TabsTrigger>
            <TabsTrigger value="allergies" className="flex-1 min-w-[120px] max-w-full">
              <AlertTriangle className="h-4 w-4 mr-2" style={{ color: '#f59e42' }} />
              {t('medicalRecords.tabs.allergies')}
            </TabsTrigger>
            <TabsTrigger value="immunizations" className="flex-1 min-w-[120px] max-w-full">
              <Syringe className="h-4 w-4 mr-2" style={{ color: '#64748b' }} />
              {t('medicalRecords.tabs.immunizations')}
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 min-w-[100px] max-w-full">
              <BarChart2 className="h-4 w-4 mr-2" style={{ color: '#eab308' }} />
              {t('medicalRecords.tabs.statistics')}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="consultations" className="mt-4">{renderConsultationHistory()}</TabsContent>
        <TabsContent value="recent" className="mt-4">{renderRecentRecords()}</TabsContent>
        <TabsContent value="lab-results" className="mt-4">{renderLabResults()}</TabsContent>
        <TabsContent value="medications" className="mt-4">{renderMedications()}</TabsContent>
        <TabsContent value="allergies" className="mt-4">{renderAllergies()}</TabsContent>
        <TabsContent value="immunizations" className="mt-4">{renderImmunizations()}</TabsContent>
        <TabsContent value="stats" className="mt-4">{renderStats()}</TabsContent>
      </Tabs>
    );
  };

  return (
    <>
      {renderContent()}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedItem && 'title' in selectedItem ? selectedItem.title : 'Prescription Details'}
      >
        {selectedItem && !('type' in selectedItem) ? (
          // Prescription view with tabs
          <Tabs defaultValue="prescription" className="w-full">
            <TabsList className="w-full flex flex-wrap gap-2 overflow-x-auto whitespace-nowrap bg-muted p-1 rounded-md mb-4">
              <TabsTrigger value="prescription" className="flex-1 min-w-[120px] max-w-full">
                {t('medicalRecords.tabs.prescription')}
              </TabsTrigger>
              <TabsTrigger value="lab" className="flex-1 min-w-[120px] max-w-full">
                {t('medicalRecords.tabs.lab')}
              </TabsTrigger>
              <TabsTrigger value="radiology" className="flex-1 min-w-[120px] max-w-full">
                {t('medicalRecords.tabs.radiology')}
              </TabsTrigger>
              <TabsTrigger value="pharmacy" className="flex-1 min-w-[120px] max-w-full">
                {t('medicalRecords.tabs.pharmacy')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="prescription" className="mt-2">
              <PrescriptionDetail prescription={selectedItem as Prescription} />
            </TabsContent>
            <TabsContent value="lab" className="mt-2">
              {/* Find and display lab_result records linked to this prescription */}
              {(dashboardData?.recentRecords ?? []).filter(r => r.type === 'lab_result' && r.prescriptionId === selectedItem._id).length === 0 ? (
                <div className="text-gray-500">No lab results for this prescription.</div>
              ) : (dashboardData?.recentRecords ?? []).filter(r => r.type === 'lab_result' && r.prescriptionId === selectedItem._id).map(record => (
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
                      {record.files.map((file, idx) => (
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
              {/* Find and display imaging records linked to this prescription */}
              {(dashboardData?.recentRecords ?? []).filter(r => r.type === 'imaging' && r.prescriptionId === selectedItem._id).length === 0 ? (
                <div className="text-gray-500">No radiology results for this prescription.</div>
              ) : (dashboardData?.recentRecords ?? []).filter(r => r.type === 'imaging' && r.prescriptionId === selectedItem._id).map(record => (
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
                      {record.files.map((file, idx) => (
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
              {/* Pharmacy fulfillment info (if any) */}
              <div className="text-gray-500">Pharmacy fulfillment details coming soon.</div>
            </TabsContent>
          </Tabs>
        ) : (
          // Fallback for other records
          <div className="space-y-4 p-1">
            {'type' in (selectedItem || {}) ? (
              // MedicalRecord fallback
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong className="font-semibold">Date:</strong> {new Date((selectedItem as any).date).toLocaleDateString()}</div>
                  <div><strong className="font-semibold">Provider:</strong> {(selectedItem as any).providerId.firstName} {(selectedItem as any).providerId.lastName}</div>
                  <div><strong className="font-semibold">Type:</strong> {(selectedItem as any).type.replace('_', ' ')}</div>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-base mb-2">Details</h4>
                  <div className="p-3 bg-gray-50 rounded-lg border text-sm space-y-2">
                    {Object.entries((selectedItem as any).details).map(([key, value]) => (
                      <div key={key} className="flex flex-col mb-2">
                        <strong className="capitalize font-medium text-gray-700 mb-1">{key.replace(/_/g, ' ')}:</strong>
                        {Array.isArray(value) ? (
                          value.length === 0 ? (
                            <span className="text-gray-500">None</span>
                          ) : (
                            <ul className="list-disc list-inside ml-4">
                              {value.map((item: any, idx: number) => (
                                typeof item === 'object' && item !== null ? (
                                  <li key={idx}>
                                    <ul className="list-none ml-0">
                                      {Object.entries(item).map(([k, v]) => (
                                        <li key={k}><span className="font-semibold text-gray-600">{k.replace(/_/g, ' ')}:</span> {String(v)}</li>
                                      ))}
                                    </ul>
                                  </li>
                                ) : (
                                  <li key={idx}>{String(item)}</li>
                                )
                              ))}
                            </ul>
                          )
                        ) : typeof value === 'object' && value !== null ? (
                          <ul className="list-none ml-0">
                            {Object.entries(value).map(([k, v]) => (
                              <li key={k}><span className="font-semibold text-gray-600">{k.replace(/_/g, ' ')}:</span> {String(v)}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-900">{String(value)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {(selectedItem as any).fileUrl && (
                  <div className="mt-4">
                    <Button asChild variant="outline">
                      <a href={(selectedItem as any).fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" /> Download/View File
                      </a>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              // Prescription fallback (should rarely be hit)
              <div className="text-gray-500">No additional details available for this record.</div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default MedicalRecords;
