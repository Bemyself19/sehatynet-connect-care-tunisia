import 'jspdf-autotable';
import jsPDF from 'jspdf';
// TypeScript declaration for jsPDF autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

function isPrescription(record: MedicalRecord | Prescription): record is Prescription {
  return (
    (record as Prescription).medications !== undefined &&
    Array.isArray((record as Prescription).medications)
  );
}

const MedicalRecords = () => {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedItem, setSelectedItem] = useState<ViewableRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('consultations');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!user?._id) return;
        const response = await api.getPatientDashboard(user._id); // Adjust this to your actual API method
        setDashboardData(response);
      } catch (error) {
        setError('Failed to fetch dashboard data.');
        toast.error(t('error.fetchingData'));
      } finally {
        setLoading(false);
      }
    };
    if (user && user._id) {
      fetchData();
    }
  }, [user, t]);

  // Auto-open modal if 'open' query param is present and dashboardData is loaded
  useEffect(() => {
    if (!dashboardData) return;
    const openId = searchParams.get('open');
    console.log('[Auto-open modal] openId:', openId);
    if (openId && !modalOpen) {
      let found: ViewableRecord | undefined;
      let foundType: 'consultation' | 'prescription' | undefined;
      const allConsultationIds = dashboardData.consultationHistory.flatMap(entry => entry.medicalRecords.map(r => r._id));
      const allPrescriptionIds = dashboardData.consultationHistory.flatMap(entry => entry.prescriptions.map(p => p._id));
      const allRecentRecordIds = dashboardData.recentRecords ? dashboardData.recentRecords.map(r => r._id) : [];
      console.log('[Auto-open modal] All consultation IDs:', allConsultationIds);
      console.log('[Auto-open modal] All prescription IDs:', allPrescriptionIds);
      console.log('[Auto-open modal] All recent record IDs:', allRecentRecordIds);
      for (const entry of dashboardData.consultationHistory) {
        found = entry.medicalRecords.find(r => r._id === openId);
        if (found) {
          foundType = 'consultation';
          break;
        }
        found = entry.prescriptions.find(p => p._id === openId);
        if (found) {
          foundType = 'prescription';
          break;
        }
      }
      if (!found && dashboardData.recentRecords) {
        found = dashboardData.recentRecords.find(r => r._id === openId);
        if (found) foundType = 'consultation';
      }
      console.log('[Auto-open modal] Found:', found, 'Type:', foundType);
      if (found) {
        if (foundType === 'prescription') setActiveTab('prescriptions');
        else setActiveTab('consultations');
        openModal(found);
      } else {
        console.warn('[Auto-open modal] No matching record or prescription found for openId:', openId);
      }
    }
  }, [dashboardData, searchParams, modalOpen]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  const openModal = (item: ViewableRecord) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const downloadPDF = () => {
    try {
      console.log('downloadPDF called', selectedItem);
      if (!selectedItem) return;
      const doc = new jsPDF();
      doc.setFontSize(12);
      if (isPrescription(selectedItem)) {
        const prescription = selectedItem;
        doc.text('Prescription Details', 14, 22);
        doc.text(`Patient: ${prescription.patientId?.firstName || ''} ${prescription.patientId?.lastName || ''}`, 14, 32);
        doc.text(`Doctor: Dr. ${prescription.providerId?.firstName || ''} ${prescription.providerId?.lastName || ''}`, 14, 40);
        doc.text(`Date: ${prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString('fr-TN') : ''}`, 14, 48);

        // Medications Section
        if (prescription.medications && prescription.medications.length > 0) {
          doc.addPage();
          doc.text('Medications', 14, 22);
          (doc as any).autoTable({
            startY: 28,
            head: [['Name', 'Dosage', 'Frequency', 'Duration', 'Instructions', 'Transaction ID']],
            body: prescription.medications.map(med => [
              med.name,
              med.dosage,
              med.frequency,
              med.duration,
              med.instructions,
              med.transactionId || '-'
            ])
          });
        }

        // Lab Tests Section
        if (prescription.labTests && prescription.labTests.length > 0) {
          doc.addPage();
          doc.text('Lab Tests', 14, 22);
          (doc as any).autoTable({
            startY: 28,
            head: [['Test Name', 'Notes', 'Transaction ID']],
            body: prescription.labTests.map(lab => [
              lab.testName,
              lab.notes || '-',
              lab.transactionId || '-'
            ])
          });
        }

        // Radiology Section
        if (prescription.radiology && prescription.radiology.length > 0) {
          doc.addPage();
          doc.text('Radiology Exams', 14, 22);
          (doc as any).autoTable({
            startY: 28,
            head: [['Exam Name', 'Notes', 'Transaction ID']],
            body: prescription.radiology.map(rad => [
              rad.examName,
              rad.notes || '-',
              rad.transactionId || '-'
            ])
          });
        }
      } else {
        doc.text('Medical Record Details', 14, 22);
        // Add more medical record-specific content here if needed
      }
      doc.save('document.pdf');
      console.log('doc.save called');
    } catch (err) {
      alert('Error in downloadPDF: ' + (err instanceof Error ? err.message : String(err)));
      console.error(err);
    }
  };

  if (!user) {
    return <div style={{ padding: 32, color: 'red', textAlign: 'center' }}>User not loaded. Please log in again.</div>;
  }

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: 32, color: 'red', textAlign: 'center' }}>{error}</div>;
  }

  if (!dashboardData) {
    return <div style={{ padding: 32, color: 'orange', textAlign: 'center' }}>No dashboard data found.<br/><pre>{JSON.stringify(dashboardData, null, 2)}</pre></div>;
  }

  // Defensive: check for missing arrays, but allow dashboard to render if either has data
  const hasConsultations = dashboardData.consultationHistory && dashboardData.consultationHistory.length > 0;
  const hasRecentRecords = dashboardData.recentRecords && dashboardData.recentRecords.length > 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-2">
      <Card className="shadow-lg border border-gray-200">
        <CardHeader className="bg-blue-50 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-blue-900">{t('medicalRecords.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-between mb-6">
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-semibold">
              {t('medicalRecords.stats.totalConsultations')}: {dashboardData.stats.totalConsultations}
            </Badge>
            <Badge className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-base font-semibold">
              {t('medicalRecords.stats.totalPrescriptions')}: {dashboardData.stats.totalPrescriptions}
            </Badge>
            <Badge className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-base font-semibold">
              {t('medicalRecords.stats.totalRecords')}: {dashboardData.stats.totalRecords}
            </Badge>
          </div>
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full flex gap-2 mb-4 bg-gray-100 rounded-md p-1">
              <TabsTrigger value="consultations" className="flex-1 min-w-[120px] text-base">
                {t('medicalRecords.tabs.consultations')}
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex-1 min-w-[120px] text-base">
                {t('medicalRecords.tabs.prescriptions')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="consultations">
              {hasConsultations ? (
                <div className="space-y-4">
                  {dashboardData.consultationHistory.map((entry) => (
                    <React.Fragment key={entry.appointment._id}>
                      {entry.medicalRecords.map(record => (
                        <div key={record._id} className="border rounded-lg p-4 flex justify-between items-center bg-white hover:shadow-md transition-shadow">
                          <div>
                            <span className="font-semibold text-lg text-blue-800">{new Date(entry.appointment.scheduledDate).toLocaleDateString('fr-TN')}</span>
                            <span className="ml-2 text-gray-700">- {entry.appointment.providerId?.firstName} {entry.appointment.providerId?.lastName}</span>
                          </div>
                          <Button variant="outline" onClick={() => openModal(record)}>
                            {t('medicalRecords.actions.viewDetails')}
                          </Button>
                        </div>
                      ))}
                      {entry.prescriptions.map(prescription => (
                        <div key={prescription._id} className="border rounded-lg p-4 flex justify-between items-center bg-white hover:shadow-md transition-shadow">
                          <div>
                            <span className="font-semibold text-lg text-blue-800">{new Date(entry.appointment.scheduledDate).toLocaleDateString('fr-TN')}</span>
                            <span className="ml-2 text-gray-700">- {entry.appointment.providerId?.firstName} {entry.appointment.providerId?.lastName}</span>
                          </div>
                          <Button variant="outline" onClick={() => openModal(prescription)}>
                            {t('medicalRecords.actions.viewDetails')}
                          </Button>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="text-center text-orange-600 py-8 text-lg font-medium">
                  {t('medicalRecords.noConsultations')}
                </div>
              )}
            </TabsContent>
            <TabsContent value="prescriptions">
              {dashboardData.consultationHistory && dashboardData.consultationHistory.some(entry => entry.prescriptions && entry.prescriptions.length > 0) ? (
                <div className="space-y-4">
                  {dashboardData.consultationHistory.flatMap(entry =>
                    (entry.prescriptions || []).map(prescription => (
                      <div key={prescription._id} className="border rounded-lg p-4 flex justify-between items-center bg-white hover:shadow-md transition-shadow">
                        <div>
                          <span className="font-semibold text-lg text-blue-800">{new Date(entry.appointment.scheduledDate).toLocaleDateString('fr-TN')}</span>
                          <span className="ml-2 text-gray-700">- {entry.appointment.providerId?.firstName} {entry.appointment.providerId?.lastName}</span>
                        </div>
                        <Button variant="outline" onClick={() => openModal(prescription)}>
                          {t('medicalRecords.actions.viewDetails', 'View Details')}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center text-orange-600 py-8 text-lg font-medium">
                  {t('medicalRecords.noPrescriptions')}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={selectedItem ? (isPrescription(selectedItem) ? t('dashboard.modal.prescriptionTitle') : t('dashboard.modal.recordTitle')) : ''}
      >
        {/* Debug block removed for production */}
        {selectedItem && isPrescription(selectedItem) ? (
          <PrescriptionDetail medicalRecord={selectedItem} type="medication" />
        ) : selectedItem ? (
          <div>
            <h2>{t('dashboard.modal.title')}</h2>
            {/* Add more content for medical records here */}
          </div>
        ) : null}
        {/* Debug removed */}
        <Button onClick={downloadPDF} disabled={!selectedItem}>
          {t('dashboard.actions.downloadPDF')}
        </Button>
      </Modal>
    </div>
  );
};

export default MedicalRecords;
