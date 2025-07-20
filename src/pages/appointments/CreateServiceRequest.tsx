import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MedicalRecord } from '@/types/medicalRecord';
import { Prescription } from '@/types/prescription';
import { User } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

const REQUEST_TYPES = [
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'lab_result', label: 'Lab' },
  { value: 'imaging', label: 'Radiology' },
];

const PROVIDER_TYPE_MAP: Record<string, string> = {
  pharmacy: 'pharmacy',
  lab_result: 'lab',
  imaging: 'radiologist',
};

const CreateServiceRequest: React.FC = () => {
  const { t } = useTranslation();
  const [requestType, setRequestType] = useState('pharmacy');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<string>('');
  const [providers, setProviders] = useState<User[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch patient prescriptions
    api.getPrescriptions().then(setPrescriptions);
  }, []);

  useEffect(() => {
    // Fetch providers for the selected type
    const providerType = PROVIDER_TYPE_MAP[requestType];
    if (providerType) {
      api.getProvidersByType(providerType).then(setProviders);
    }
  }, [requestType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const prescription = prescriptions.find(p => p._id === selectedPrescription);
      if (!prescription) throw new Error('Prescription not found');
      const patientId = typeof prescription.patientId === 'string' ? prescription.patientId : (prescription.patientId as any)._id;
      const providerId = String(selectedProvider);
      // Compose record type and details
      let recordType: 'lab_result' | 'imaging' | 'prescription';
      if (requestType === 'pharmacy') recordType = 'prescription';
      else if (requestType === 'lab_result') recordType = 'lab_result';
      else recordType = 'imaging';
      const details: any = { notes };
      // Add medications/lab/radiology details if needed
      if (recordType === 'prescription') details.medications = prescription.medications;
      if (recordType === 'lab_result') details.labTests = prescription.labTests;
      if (recordType === 'imaging') details.radiology = prescription.radiology;
      // Add providerId to details
      details.providerId = providerId;
      // Create the medical record
      await api.createMedicalRecord({
        patientId,
        title: `${recordType.charAt(0).toUpperCase() + recordType.slice(1)} Request`,
        type: recordType,
        date: new Date().toISOString(),
        details,
        isPrivate: false,
        privacyLevel: 'patient_visible',
      });
      setSuccess(t('serviceRequestCreatedSuccessfully'));
      setSelectedProvider('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || t('failedToCreateServiceRequest'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('createServiceRequest')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">{t('requestType')}</label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectRequestType')} />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{t(type.label.toLowerCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">{t('prescription')}</label>
              <Select value={selectedPrescription} onValueChange={setSelectedPrescription}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectPrescription')} />
                </SelectTrigger>
                <SelectContent>
                  {prescriptions.map(p => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.prescriptionId || p._id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">{t('provider')}</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectProvider')} />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(p => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">{t('notesOptional')}</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('addAnyNotes')} />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !selectedPrescription || !selectedProvider}>
              {loading ? t('submitting') : t('createRequest')}
            </Button>
            {success && <div className="text-green-600 mt-2">{success}</div>}
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateServiceRequest; 