import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Patient } from '@/types/user';
import { MedicalRecord } from '@/types/medicalRecord';
import { useUser } from '@/hooks/useUser';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DoctorPatients: React.FC = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientMedicalRecords, setPatientMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loadingMedicalRecords, setLoadingMedicalRecords] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch patients for the doctor
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientsData = await api.getPatients();
        setPatients(patientsData);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
        setPatients([]);
      }
    };

    if (user?.role === 'doctor') {
      fetchPatients();
    }
  }, [user]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Filter patients by name, email, or phone
  const filteredPatients = useMemo(() => {
    if (!debouncedSearch) return patients;
    const q = debouncedSearch.toLowerCase();
    return patients.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q)
    );
  }, [patients, debouncedSearch]);

  // Handler to fetch and show medical records for a patient
  const handleViewMedicalRecords = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoadingMedicalRecords(true);
    try {
      const res = await api.getPatientMedicalHistory(patient._id);
      setPatientMedicalRecords(res);
    } catch (error) {
      setPatientMedicalRecords([]);
    }
    setLoadingMedicalRecords(false);
  };

  // Handler to toggle accordion sections
  const handleAccordionToggle = (recordId: string) => {
    setExpandedSections((prev) => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  // Helper: filter out Pharmacy Request records
  const filteredMedicalRecords = patientMedicalRecords.filter(
    (record) => record.title !== 'Pharmacy Request'
  );

  // Helper: group lab/radiology results by prescriptionId
  const prescriptions = filteredMedicalRecords.filter(r => r.type === 'prescription');
  const labResults = filteredMedicalRecords.filter(r => r.type === 'lab_result');
  const imagingResults = filteredMedicalRecords.filter(r => r.type === 'imaging');
  const otherRecords = filteredMedicalRecords.filter(r => !['prescription', 'lab_result', 'imaging'].includes(r.type));

  // Helper: get results for a prescription
  const getResultsForPrescription = (prescriptionId: string) => ({
    lab: labResults.filter(r => r.prescriptionId === prescriptionId),
    imaging: imagingResults.filter(r => r.prescriptionId === prescriptionId),
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('patientsSectionTitle')}</h2>
      <div className="mb-6 flex items-center gap-2 max-w-md relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </span>
        <Input
          type="text"
          placeholder={t('searchPatientsPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label={t('searchPatientsAriaLabel')}
          className="pl-10 pr-8 py-2 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearch('')}
            aria-label={t('clearSearch')}
            tabIndex={0}
          >
            ×
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">{t('noPatientsFound')}</div>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient._id} className="mb-4">
              <CardHeader>
                <CardTitle>{`${patient.firstName} ${patient.lastName}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <span>{t('emailLabel')}: {patient.email}</span>
                  <span>{t('phoneLabel')}: {patient.phone}</span>
                  <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => handleViewMedicalRecords(patient)}
                  >
                    {t('viewMedicalRecordsBtn')}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* Medical Records Accordion */}
      {selectedPatient && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">{t('medicalRecordsFor', { name: `${selectedPatient.firstName} ${selectedPatient.lastName}` })}</h3>
          {loadingMedicalRecords ? (
            <div>{t('loading')}</div>
          ) : (
            <Accordion type="multiple">
              {/* Grouped by prescription */}
              {prescriptions.map((prescription) => {
                const results = getResultsForPrescription(prescription._id);
                return (
                  <AccordionItem key={prescription._id} value={prescription._id}>
                    <AccordionTrigger onClick={() => handleAccordionToggle(prescription._id)}>
                      {t('prescriptionLabel')}
                      <Badge className="ml-2">{t(prescription.status)}</Badge>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-2">
                        <div><strong>{t('dateLabel')}:</strong> {new Date(prescription.date).toLocaleDateString()}</div>
                        <div><strong>{t('medicationsLabel')}:</strong>
                          <ul className="list-disc ml-6">
                            {prescription.details.medications?.map((med: any, idx: number) => (
                              <li key={idx}>{med.name} - {med.dosage}, {med.frequency}, {med.duration} {med.instructions && `(${med.instructions})`}</li>
                            ))}
                          </ul>
                        </div>
                        {prescription.details.labTests && (
                          <div><strong>{t('labTestsLabel')}:</strong>
                            <ul className="list-disc ml-6">
                              {prescription.details.labTests.map((test: any, idx: number) => (
                                <li key={idx}>{test.testName} {test.notes && `(${test.notes})`}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {prescription.details.radiologyExams && (
                          <div><strong>{t('radiologyExamsLabel')}:</strong>
                            <ul className="list-disc ml-6">
                              {prescription.details.radiologyExams.map((exam: any, idx: number) => (
                                <li key={idx}>{exam.examName} {exam.notes && `(${exam.notes})`}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Nested lab results */}
                        {results.lab.length > 0 && (
                          <div className="mt-4">
                            <strong>{t('labResultsLabel')}:</strong>
                            {results.lab.map((lab) => (
                              <div key={lab._id} className="border rounded p-2 my-2 bg-gray-50">
                                <div><strong>{t('titleLabel')}:</strong> {lab.title}</div>
                                <div><strong>{t('dateLabel')}:</strong> {new Date(lab.date).toLocaleDateString()}</div>
                                <div><strong>{t('detailsLabel')}:</strong> {JSON.stringify(lab.details)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Nested imaging results */}
                        {results.imaging.length > 0 && (
                          <div className="mt-4">
                            <strong>{t('radiologyResultsLabel')}:</strong>
                            {results.imaging.map((img) => (
                              <div key={img._id} className="border rounded p-2 my-2 bg-gray-50">
                                <div><strong>{t('titleLabel')}:</strong> {img.title}</div>
                                <div><strong>{t('dateLabel')}:</strong> {new Date(img.date).toLocaleDateString()}</div>
                                <div><strong>{t('detailsLabel')}:</strong> {JSON.stringify(img.details)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
              {/* Other records */}
              {otherRecords.map((record) => (
                <AccordionItem key={record._id} value={record._id}>
                  <AccordionTrigger onClick={() => handleAccordionToggle(record._id)}>
                    {t(record.title)}
                    <Badge className="ml-2">{t(record.status)}</Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-2">
                      <div>{t('dateLabel')}: {new Date(record.date).toLocaleDateString()}</div>
                      <div>{t('detailsLabel')}: {JSON.stringify(record.details)}</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;