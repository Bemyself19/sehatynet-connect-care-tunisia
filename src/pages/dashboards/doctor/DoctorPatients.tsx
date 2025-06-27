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

const DoctorPatients: React.FC = () => {
  const { user } = useUser();
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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Patients</h2>
      <div className="mb-6 flex items-center gap-2 max-w-md relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </span>
        <Input
          type="text"
          placeholder="Search patients by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search patients"
          className="pl-10 pr-8 py-2 rounded shadow-sm focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            tabIndex={0}
          >
            ×
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">No patients found.</div>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient._id} className="mb-4">
              <CardHeader>
                <CardTitle>{`${patient.firstName} ${patient.lastName}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <span>Email: {patient.email}</span>
                  <span>Phone: {patient.phone}</span>
                  <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => handleViewMedicalRecords(patient)}
                  >
                    View Medical Records
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
          <h3 className="text-xl font-semibold mb-2">Medical Records for {`${selectedPatient.firstName} ${selectedPatient.lastName}`}</h3>
          {loadingMedicalRecords ? (
            <div>Loading...</div>
          ) : (
            <Accordion type="multiple">
              {patientMedicalRecords.map((record) => (
                <AccordionItem key={record._id} value={record._id}>
                  <AccordionTrigger onClick={() => handleAccordionToggle(record._id)}>
                    {record.title}
                    <Badge className="ml-2">{record.status}</Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-2">
                      <div>Date: {new Date(record.date).toLocaleDateString()}</div>
                      <div>Details: {JSON.stringify(record.details)}</div>
                      {/* Add more record details as needed */}
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