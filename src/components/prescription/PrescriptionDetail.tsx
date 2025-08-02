// Unified fulfillment handler for all request types
function useUnifiedFulfill() {
  const { setItemReadyForPickup, setItemCompleted } = usePrescriptions();
  return async function handleFulfillItem(recordId: string, type: MedicalRecordType, index: number, status: string, itemData?: any) {
    if (type === 'medication') {
      await setItemReadyForPickup(recordId, 'medication', index);
      if (status === 'ready_for_pickup') {
        await setItemCompleted(recordId, 'medication', index);
      }
    } else if (type === 'lab_result') {
      await setItemReadyForPickup(recordId, 'lab', index);
      if (status === 'ready_for_pickup') {
        await setItemCompleted(recordId, 'lab', index);
      }
    } else if (type === 'imaging') {
      await setItemReadyForPickup(recordId, 'radiology', index);
      if (status === 'ready_for_pickup') {
        await setItemCompleted(recordId, 'radiology', index);
      }
    }
  };
}
// Normalizes items for medication, lab, and imaging requests
function getNormalizedItems(medicalRecord: any, type: string) {
  if (type === 'medication') {
    return medicalRecord.medications?.map((med: any) => ({
      name: med.name,
      status: med.status,
      ...med
    })) || [];
  }
  if (type === 'lab_result') {
    return medicalRecord.labTests?.map((test: any) => ({
      name: test.name,
      status: test.status,
      ...test
    })) || [];
  }
  if (type === 'imaging') {
    return medicalRecord.radiology?.map((exam: any) => ({
      name: exam.name,
      status: exam.status,
      ...exam
    })) || [];
  }
  return [];
}
import React, { useEffect, useState } from 'react';
import { Prescription, Medication, MedicationFulfillment } from '@/types/prescription';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Pill } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/hooks/useUser';

type MedicalRecordType = 'medication' | 'lab_result' | 'imaging';

interface PrescriptionDetailProps {
  medicalRecord: any; // Will be normalized later, use MedicalRecord if possible
  type: MedicalRecordType;
  // ...existing code...
}

const PrescriptionDetail: React.FC<PrescriptionDetailProps> = ({ medicalRecord, type }) => {
  const handleFulfillItem = useUnifiedFulfill();
  const { user } = useUser();
  // Debug: Log prescriptionId at runtime
  const prescriptionId = medicalRecord?._id;
  console.log('PrescriptionDetail: medicalRecord._id =', prescriptionId);
  // Per-medication availability state for pharmacy fulfillment
  const [medicationAvailability, setMedicationAvailability] = useState<MedicationFulfillment[]>(
    Array.isArray(medicalRecord?.medications)
      ? medicalRecord.medications.map((med: any) => ({ name: med.name, available: true }))
      : []
  );
  const [fulfillmentFeedback, setFulfillmentFeedback] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('pending');

  // Toggle medication availability
  const handleToggleAvailability = (index: number) => {
    setMedicationAvailability((prev) => {
      const updated = [...prev];
      updated[index].available = !updated[index].available;
      return updated;
    });
  };

  // Submit fulfillment to backend
  const handlePharmacyFulfill = async () => {
    const unavailableMeds = medicationAvailability.filter((m) => !m.available).map((m) => m.name);
    let newStatus = 'pending';
    if (medicationAvailability.every((m) => m.available)) {
      newStatus = 'confirmed';
    } else if (medicationAvailability.every((m) => !m.available)) {
      newStatus = 'out_of_stock';
    } else {
      newStatus = 'partially_fulfilled';
    }
    setFulfillmentStatus(newStatus);
    setFulfillmentFeedback(unavailableMeds.join(', '));
    await api.fulfillAssignedRequest(medicalRecord._id, {
      medications: medicationAvailability as MedicationFulfillment[],
      status: newStatus,
      feedback: unavailableMeds.join(', '),
    });
    refreshServiceRequests                                    ();
  };
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [radiologists, setRadiologists] = useState<any[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [selectedRadiologist, setSelectedRadiologist] = useState<string>('');
  const [assigning, setAssigning] = useState<string>('');
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [selectedNewPharmacy, setSelectedNewPharmacy] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { setItemReadyForPickup, setItemCompleted } = usePrescriptions();
  const [itemActionLoading, setItemActionLoading] = useState<{ [key: string]: boolean }>({});
  const [refreshCount, setRefreshCount] = useState(0);

  // ...existing code...

  useEffect(() => {
    if (!prescriptionId) return;
    api.getProvidersByType('pharmacy').then(setPharmacies);
    api.getProvidersByType('lab').then(setLabs);
    api.getProvidersByType('radiologist').then(setRadiologists);
    // Fetch all service requests for this prescription
    api.getMedicalRecordsByPrescriptionId(prescriptionId).then(data => {
      console.log('Fetched serviceRequests:', data);
      setServiceRequests(data);
    });
  }, [prescriptionId, refreshCount]);

  const refreshServiceRequests = () => {
    if (!prescriptionId) return;
    api.getMedicalRecordsByPrescriptionId(prescriptionId).then((data) => {
      setServiceRequests(data);
      setRefreshCount((c) => c + 1); // force re-render
      // ...existing code...
    });
  };

  // Helper to get request status and provider for a group
  const getRequestForType = (type: 'prescription' | 'lab_result' | 'imaging') => {
    return serviceRequests.find((r) => r.type === type);
  };

  // Helper to get the active (non-cancelled) pharmacy request for this prescription
  const getActivePharmacyRequest = () => {
    const requests = serviceRequests.filter((r) =>
      r.type === 'medication' &&
      r.details && String(r.details.prescriptionId) === String(medicalRecord._id) &&
      r.status !== 'cancelled' &&
      r.title === 'Pharmacy Request'
    );
    if (requests.length === 0) return undefined;
    return requests.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
    }, requests[0]);
  };

  // Helper to safely extract provider ID (handles string or object)
  const extractProviderId = (providerId: any) => {
    if (!providerId) return '';
    if (typeof providerId === 'string') return providerId;
    if (typeof providerId === 'object' && providerId._id) return providerId._id;
    return '';
  };

  const handleRequest = async (type: 'prescription' | 'lab_result' | 'imaging', providerId: string) => {
    setAssigning(type);
    setOrderError(null);
    try {
      // Compose details for the request
      const details: any = { prescriptionId };
      let requestType: 'medication' | 'lab_result' | 'imaging' = type === 'prescription' ? 'medication' : type;
      if (requestType === 'medication') details.medications = medicalRecord.medications;
      if (requestType === 'lab_result') details.labTests = medicalRecord.labTests;
      if (requestType === 'imaging') details.radiology = medicalRecord.radiology;
      details.providerId = providerId;
      const patientIdToSend = typeof medicalRecord.patientId === 'string' ? medicalRecord.patientId : medicalRecord.patientId._id;
      await api.createMedicalRecord({
        type: requestType,
        patientId: patientIdToSend,
        title:
          requestType === 'medication'
            ? 'Pharmacy Request'
            : requestType === 'lab_result'
            ? 'Lab Request'
            : 'Radiology Request',
        date: new Date().toISOString(),
        details,
        isPrivate: false,
        privacyLevel: 'patient_visible',
        prescriptionId,
      });
      refreshServiceRequests();
    } catch (err: any) {
      setOrderError(err.message || t('failedToRequestPharmacy') || 'Failed to request service');
    } finally {
      setAssigning('');
    }
  };

  const handleCancelRequest = async (recordId: string) => {
    if (!window.confirm(t('confirmCancelPharmacyRequest') || 'Are you sure you want to cancel this pharmacy request?')) return;
    setCancellingId(recordId);
    try {
      await api.cancelMedicalRecordRequest(recordId);
      refreshServiceRequests();
    } catch (err) {
      // handle error (toast, etc.)
    } finally {
      setCancellingId(null);
    }
  };

  const handleReassignPharmacy = async (recordId: string) => {
    if (!selectedNewPharmacy) return;
    setReassigningId(recordId);
    setError(null);
    try {
      await api.reassignPharmacy(recordId, selectedNewPharmacy);
      setSelectedNewPharmacy('');
      await refreshServiceRequests();
      // Debug: log feedback value after reassignment
      const req = getActivePharmacyRequest();
      // ...existing code...
    } catch (err: any) {
      setError(err.message || t('failedToReassignPharmacy') || 'Failed to reassign pharmacy');
    } finally {
      setReassigningId(null);
    }
  };

  const getProviderName = (id: string, list: any[]) => {
    const found = list.find((p) => String(p._id) === String(id));
    return found ? `${found.firstName} ${found.lastName}` : '';
  };

  if (!medicalRecord) return null;

  // Check if current user is a pharmacy provider
  const isPharmacy = user?.role === 'pharmacy';
  const isProvider = user?.role && ['pharmacy', 'lab', 'radiologist'].includes(user.role);

  // Use active pharmacy request for status and medications if available
  const activePharmacyRequest = getActivePharmacyRequest();
  // ...existing code...

  const medicationsToDisplay = activePharmacyRequest && activePharmacyRequest.details && Array.isArray(activePharmacyRequest.details.medications)
    ? activePharmacyRequest.details.medications.map((med: any) => ({
        ...med, // Keep existing fields from pharmacy request
        // Merge with additional details from original prescription if available
        dosage: med.dosage || medicalRecord?.medications?.find((m: any) => m.name === med.name)?.dosage || '-',
        frequency: med.frequency || medicalRecord?.medications?.find((m: any) => m.name === med.name)?.frequency || '-',
        duration: med.duration || medicalRecord?.medications?.find((m: any) => m.name === med.name)?.duration || '-',
        instructions: med.instructions || medicalRecord?.medications?.find((m: any) => m.name === med.name)?.instructions || '-',
        status: med.status || 'pending' // Ensure status is always available
      }))
    : Array.isArray(medicalRecord?.medications) ? medicalRecord.medications.map((med: any) => ({
        ...med, // Keep all original fields
        status: med.status || 'pending' // Add default status if not present
      })) : [];

  // Show lab tests from active lab request if present
  const activeLabRequest = getRequestForType('lab_result');
  const labTestsToDisplay = activeLabRequest && activeLabRequest.details && Array.isArray(activeLabRequest.details.labTests)
    ? activeLabRequest.details.labTests
    : Array.isArray(medicalRecord?.labTests) ? medicalRecord.labTests : [];

  // Show radiology items from active radiology request if present
  const activeRadiologyRequest = getRequestForType('imaging');
  const radiologyToDisplay = activeRadiologyRequest && activeRadiologyRequest.details && Array.isArray(activeRadiologyRequest.details.radiology)
    ? activeRadiologyRequest.details.radiology
    : Array.isArray(medicalRecord?.radiology) ? medicalRecord.radiology : [];

  // Helper to get overall status: show request status for current type if present, else prescription status
  const getOverallStatus = () => {
    if (type === 'medication' && activePharmacyRequest && activePharmacyRequest.status) {
      return t(activePharmacyRequest.status) !== activePharmacyRequest.status
        ? t(activePharmacyRequest.status)
        : activePharmacyRequest.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    if (type === 'lab_result') {
      const labRequest = getRequestForType('lab_result');
      if (labRequest && labRequest.status) {
        return t(labRequest.status) !== labRequest.status
          ? t(labRequest.status)
          : labRequest.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    }
    if (type === 'imaging') {
      const radRequest = getRequestForType('imaging');
      if (radRequest && radRequest.status) {
        return t(radRequest.status) !== radRequest.status
          ? t(radRequest.status)
          : radRequest.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    }
    if (medicalRecord.status) {
      return t(medicalRecord.status) !== medicalRecord.status
        ? t(medicalRecord.status)
        : medicalRecord.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    return t('notRequested') || 'Not requested';
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('prescriptionDetails') || 'Prescription Details'}</CardTitle>
          <CardDescription>
            {t('prescribedOn') || 'Prescribed on'} {new Date(medicalRecord.createdAt).toLocaleDateString('fr-TN')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <strong>{t('patient') || 'Patient'}:</strong> {medicalRecord.patientId.firstName} {medicalRecord.patientId.lastName}
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <strong>{t('doctor') || 'Doctor'}:</strong> Dr. {medicalRecord.providerId.firstName} {medicalRecord.providerId.lastName}
            </div>
          </div>
          {/* Medications Section */}
          {/* Conditional rendering for medication, lab, and radiology */}
          {type === 'medication' && (
            <>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Pill className="h-5 w-5" />
                {t('medications')}
              </h3>
              {medicationsToDisplay.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('medicationName') || 'Medication Name'}</TableHead>
                      <TableHead>{t('dosage') || 'Dosage'}</TableHead>
                      <TableHead>{t('frequency') || 'Frequency'}</TableHead>
                      <TableHead>{t('duration') || 'Duration'}</TableHead>
                      <TableHead>{t('instructions') || 'Instructions'}</TableHead>
                      <TableHead>{t('status') || 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicationsToDisplay.map((med: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{med.name || med.medicationName}</TableCell>
                        <TableCell>{med.dosage || '-'}</TableCell>
                        <TableCell>{med.frequency || '-'}</TableCell>
                        <TableCell>{med.duration || '-'}</TableCell>
                        <TableCell>{med.instructions || '-'}</TableCell>
                        <TableCell>{t(med.status || 'pending') || med.status || 'pending'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-gray-500">{t('noMedications') || 'No medications found.'}</div>
              )}
            </>
          )}
          {type === 'lab_result' && (
            <>
              <h3 className="font-semibold mt-6 mb-2">{t('labTests')}</h3>
              {/* Lab Table */}
              {/* All table headers and actions use t() for translation compliance */}
            </>
          )}
          {type === 'imaging' && (
            <>
              <h3 className="font-semibold mt-6 mb-2">{t('radiology')}</h3>
              {/* Radiology Table */}
              {/* All table headers and actions use t() for translation compliance */}
            </>
          )}
          {/* Fulfillment UI for pharmacy - only show to pharmacy providers */}
          {isPharmacy && (
            <div className="mt-4">
              <Button onClick={handlePharmacyFulfill}>
                {t('fulfillRequest') || 'Fulfill Request'}
              </Button>
              <span className="ml-4">
                {t('currentStatus') || 'Current Status'}: {fulfillmentStatus}
              </span>
              {fulfillmentFeedback && (
                <div className="text-red-600 mt-2">
                  {t('unavailableMedications') || 'Unavailable medications'}: {fulfillmentFeedback}
                </div>
              )}
            </div>
          )}
          {/* Pharmacy Request Status/Action */}
          {Array.isArray(medicalRecord.medications) && medicalRecord.medications.length > 0 && (
            <div className="mt-2 mb-4">
              {/* Pharmacy Request Provider and Status */}
              {activePharmacyRequest && (
                <div className="mb-2">
                  <div className="text-green-700">
                    {t('pharmacyRequest') || 'Pharmacy Request'}: {getProviderName(extractProviderId(activePharmacyRequest.details?.providerId), pharmacies)}<br />
                    {t('status') || 'Status'}: {activePharmacyRequest.status || t('requested') || 'Requested'}
                  </div>
                  
                  
                  {/* Display pharmacy feedback for statuses other than pending_patient_confirmation */}
                  {(activePharmacyRequest.details?.feedback || activePharmacyRequest.feedback) && 
                    ['partially_fulfilled', 'out_of_stock'].includes(activePharmacyRequest.status) && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 text-red-600 text-sm">
                      <strong>{t('pharmacyFeedback') || 'Pharmacy Feedback'}:</strong> {
                        // Display the unavailable medications
                        `${t('unavailableMedications') || 'Unavailable medications'}: ${activePharmacyRequest.details?.feedback || activePharmacyRequest.feedback}`
                      }
                    </div>
                  )}
                </div>
              )}
              
              {/* Partial Fulfillment Confirmation UI */}
              {activePharmacyRequest && activePharmacyRequest.status === 'pending_patient_confirmation' && (
                <Card className="mt-4 mb-4 border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-amber-800">{t('partialFulfillmentConfirmation') || 'Partial Fulfillment Confirmation'}</h3>
                    <p className="text-amber-700 mb-2">
                      {t('partialFulfillmentConfirmationMessage') || 'Some medications are unavailable. Would you like to proceed with the available medications?'}
                    </p>
                    
                    {(activePharmacyRequest.details?.feedback || activePharmacyRequest.feedback) && (
                      <div className="bg-white p-2 rounded mb-4 text-red-600 text-sm">
                        <strong>{t('unavailableMedications') || 'Unavailable Medications'}:</strong> {activePharmacyRequest.details?.feedback || activePharmacyRequest.feedback}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={async () => {
                          try {
                            setAcceptingId(activePharmacyRequest._id);
                            await api.confirmPartialFulfillment(activePharmacyRequest._id);
                            refreshServiceRequests();
                          } catch (err) {
                            console.error('Failed to confirm partial fulfillment', err);
                            setError('Failed to confirm. Please try again.');
                          } finally {
                            setAcceptingId(null);
                          }
                        }}
                        disabled={acceptingId === activePharmacyRequest._id}
                        variant="default"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {acceptingId === activePharmacyRequest._id ? (
                          t('confirming') || 'Confirming...'
                        ) : (
                          t('confirmPartialOrder') || 'Confirm Partial Order'
                        )}
                      </Button>
                      <Button 
                        onClick={async () => {
                          try {
                            setCancellingId(activePharmacyRequest._id);
                            await api.cancelMedicalRecordRequest(activePharmacyRequest._id);
                            refreshServiceRequests();
                          } catch (err) {
                            console.error('Failed to cancel', err);
                            setError('Failed to cancel. Please try again.');
                          } finally {
                            setCancellingId(null);
                          }
                        }}
                        disabled={cancellingId === activePharmacyRequest._id}
                        variant="outline"
                      >
                        {cancellingId === activePharmacyRequest._id ? (
                          t('cancelling') || 'Cancelling...'
                        ) : (
                          t('cancelRequest') || 'Cancel Request'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Out of Stock UI */}
              {activePharmacyRequest && activePharmacyRequest.status === 'out_of_stock' && (
                <Card className="mt-4 mb-4 border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-red-800">{t('medicationsOutOfStock') || 'Medications Out of Stock'}</h3>
                    
                    {(activePharmacyRequest.details?.feedback || activePharmacyRequest.feedback) && (
                      <div className="bg-white p-2 rounded mb-4 text-red-600 text-sm">
                        <strong>{t('unavailableMedications') || 'Unavailable Medications'}:</strong> {activePharmacyRequest.details?.feedback || activePharmacyRequest.feedback}
                      </div>
                    )}
                    
                    <p className="text-red-700 mb-4">{t('selectAnotherPharmacyMessage') || 'Please select another pharmacy for your prescription.'}</p>
                    
                    <div className="flex items-center gap-2">
                      <Select value={selectedNewPharmacy} onValueChange={setSelectedNewPharmacy}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder={t('selectNewPharmacy') || 'Select New Pharmacy'} />
                        </SelectTrigger>
                        <SelectContent>
                          {pharmacies
                            .filter(pharm => pharm._id !== extractProviderId(activePharmacyRequest.providerId))
                            .map((pharm) => (
                              <SelectItem key={pharm._id} value={pharm._id}>
                                {pharm.firstName} {pharm.lastName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={async () => {
                          try {
                            setReassigningId(activePharmacyRequest._id);
                            await api.reassignPharmacy(activePharmacyRequest._id, selectedNewPharmacy);
                            refreshServiceRequests();
                          } catch (err) {
                            console.error('Failed to reassign pharmacy', err);
                            setError('Failed to reassign pharmacy. Please try again.');
                          } finally {
                            setReassigningId(null);
                          }
                        }}
                        disabled={!selectedNewPharmacy || reassigningId === activePharmacyRequest._id}
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {reassigningId === activePharmacyRequest._id ? (
                          t('reassigning') || 'Reassigning...'
                        ) : (
                          t('selectAnotherPharmacy') || 'Select Another Pharmacy'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Only show request button if no active pharmacy request */}
              {!activePharmacyRequest && (
                <div className="flex items-center gap-2">
                  <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder={t('selectPharmacy') || 'Select Pharmacy'} />
                    </SelectTrigger>
                    <SelectContent>
                      {pharmacies
                        .filter(pharm => pharm._id !== (typeof medicalRecord.patientId === 'string' ? medicalRecord.patientId : medicalRecord.patientId._id))
                        .map((pharm) => (
                          <SelectItem key={pharm._id} value={pharm._id}>
                            {pharm.firstName} {pharm.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleRequest('prescription', selectedPharmacy)}
                    disabled={!selectedPharmacy || assigning === 'prescription'}
                  >
                    {assigning === 'prescription' ? t('requesting') || 'Requesting...' : t('requestPharmacy') || 'Request Pharmacy'}
                  </Button>
                </div>
              )}
            </div>
          )}
          {/* Lab Tests Section */}
          {labTestsToDisplay.length > 0 && (
            <>
              <h3 className="font-semibold mt-6 mb-2">{t('labTests') || 'Lab Tests'}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('testName') || 'Test Name'}</TableHead>
                    <TableHead>{t('notes') || 'Notes'}</TableHead>
                    <TableHead>{t('status') || 'Status'}</TableHead>
                    <TableHead>{t('transactionId') || 'Transaction ID'}</TableHead>
                    {isProvider && <TableHead>{t('actions') || 'Actions'}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labTestsToDisplay.map((test: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{test.testName}</TableCell>
                      <TableCell>{test.notes}</TableCell>
                      <TableCell>{test.status || '-'}</TableCell>
                      <TableCell>{test.transactionId || '-'}</TableCell>
                      {isProvider && (
                        <TableCell>
                          {test.status === 'confirmed' || test.status === 'partial_accepted' ? (
                            <Button
                              size="sm"
                              disabled={itemActionLoading[`lab-ready-${index}`]}
                              onClick={async () => {
                                setItemActionLoading((prev) => ({ ...prev, [`lab-ready-${index}`]: true }));
                                try {
                                  await setItemReadyForPickup(medicalRecord._id, 'lab', index);
                                } finally {
                                  setItemActionLoading((prev) => ({ ...prev, [`lab-ready-${index}`]: false }));
                                }
                              }}
                            >
                              {itemActionLoading[`lab-ready-${index}`]
                                ? t('markingReady') || 'Marking...'
                                : t('markReadyForPickup') || 'Mark as Ready for Pickup'}
                            </Button>
                          ) : null}
                          {test.status === 'ready_for_pickup' ? (
                            <Button
                              size="sm"
                              disabled={itemActionLoading[`lab-complete-${index}`]}
                              onClick={async () => {
                                setItemActionLoading((prev) => ({ ...prev, [`lab-complete-${index}`]: true }));
                                try {
                                  await setItemCompleted(medicalRecord._id, 'lab', index);
                                } finally {
                                  setItemActionLoading((prev) => ({ ...prev, [`lab-complete-${index}`]: false }));
                                }
                              }}
                            >
                              {itemActionLoading[`lab-complete-${index}`]
                                ? t('markingCompleted') || 'Marking...'
                                : t('markCompleted') || 'Mark as Completed'}
                            </Button>
                          ) : null}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Lab Request Status/Action */}
              <div className="mt-2 mb-4">
                {(() => {
                  const req = getRequestForType('lab_result');
                  if (req) {
                    return (
                      <div className="mb-2">
                        <div className="text-green-700">
                          {t('labRequest') || 'Lab Request'}: {getProviderName(extractProviderId(req.details?.providerId), labs)}<br />
                          {t('status') || 'Status'}: {req.status || t('requested') || 'Requested'}
                        </div>
                        
                        
                        {/* Display lab feedback for statuses other than pending_patient_confirmation */}
                        {(req.details?.feedback || req.feedback) && 
                          ['partially_fulfilled', 'out_of_stock'].includes(req.status) && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 text-red-600 text-sm">
                            <strong>{t('labFeedback') || 'Lab Feedback'}:</strong> {req.details?.feedback || req.feedback}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <>
                      <div className="text-gray-500 mb-2">{t('status') || 'Status'}: {t('notRequested') || 'Not requested'}</div>
                      <div className="flex items-center gap-2">
                        <Select value={selectedLab} onValueChange={setSelectedLab}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder={t('selectLab') || 'Select Lab'} />
                          </SelectTrigger>
                          <SelectContent>
                            {labs.map((lab) => (
                              <SelectItem key={lab._id} value={lab._id}>
                                {lab.firstName} {lab.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={() => handleRequest('lab_result', selectedLab)} disabled={!selectedLab || assigning === 'lab_result'}>
                          {assigning === 'lab_result' ? t('requesting') || 'Requesting...' : t('requestLab') || 'Request Lab'}
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Partial Fulfillment Confirmation UI for Lab */}
              {activeLabRequest && activeLabRequest.status === 'pending_patient_confirmation' && (
                <Card className="mt-4 mb-4 border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-amber-800">{t('partialLabFulfillmentConfirmation') || 'Partial Lab Tests Confirmation'}</h3>
                    <p className="text-amber-700 mb-2">
                      {t('partialLabFulfillmentConfirmationMessage') || 'Some lab tests are unavailable. Would you like to proceed with the available tests?'}
                    </p>
                    
                    {(activeLabRequest.details?.feedback || activeLabRequest.feedback) && (
                      <div className="bg-white p-2 rounded mb-4 text-red-600 text-sm">
                        <strong>{t('unavailableLabTests') || 'Unavailable Lab Tests'}:</strong> {activeLabRequest.details?.feedback || activeLabRequest.feedback}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={async () => {
                          try {
                            setAcceptingId(activeLabRequest._id);
                            await api.confirmPartialFulfillment(activeLabRequest._id);
                            refreshServiceRequests();
                          } catch (err) {
                            console.error('Failed to confirm partial fulfillment', err);
                            setError('Failed to confirm. Please try again.');
                          } finally {
                            setAcceptingId(null);
                          }
                        }}
                        disabled={acceptingId === activeLabRequest._id}
                        variant="default"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {acceptingId === activeLabRequest._id ? (
                          t('confirming') || 'Confirming...'
                        ) : (
                          t('confirmPartialOrder') || 'Confirm Partial Order'
                        )}
                      </Button>
                      <Button 
                        onClick={async () => {
                          try {
                            setCancellingId(activeLabRequest._id);
                            await api.cancelMedicalRecordRequest(activeLabRequest._id);
                            refreshServiceRequests();
                          } catch (err) {
                            console.error('Failed to cancel', err);
                            setError('Failed to cancel. Please try again.');
                          } finally {
                            setCancellingId(null);
                          }
                        }}
                        disabled={cancellingId === activeLabRequest._id}
                        variant="outline"
                      >
                        {cancellingId === activeLabRequest._id ? (
                          t('cancelling') || 'Cancelling...'
                        ) : (
                          t('cancelRequest') || 'Cancel Request'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          {/* Radiology Section */}
          {radiologyToDisplay.length > 0 && (
            <>
              <h3 className="font-semibold mt-6 mb-2">{t('radiology') || 'Radiology'}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('examName') || 'Exam Name'}</TableHead>
                    <TableHead>{t('notes') || 'Notes'}</TableHead>
                    <TableHead>{t('status') || 'Status'}</TableHead>
                    <TableHead>{t('transactionId') || 'Transaction ID'}</TableHead>
                    {isProvider && <TableHead>{t('actions') || 'Actions'}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {radiologyToDisplay.map((exam: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{exam.examName}</TableCell>
                      <TableCell>{exam.notes}</TableCell>
                      <TableCell>{exam.status || '-'}</TableCell>
                      <TableCell>{exam.transactionId || '-'}</TableCell>
                      {isProvider && (
                        <TableCell>
                          {exam.status === 'confirmed' || exam.status === 'partial_accepted' ? (
                            <Button
                              size="sm"
                              disabled={itemActionLoading[`rad-ready-${index}`]}
                              onClick={async () => {
                                setItemActionLoading((prev) => ({ ...prev, [`rad-ready-${index}`]: true }));
                                try {
                                  await setItemReadyForPickup(medicalRecord._id, 'radiology', index);
                                } finally {
                                  setItemActionLoading((prev) => ({ ...prev, [`rad-ready-${index}`]: false }));
                                }
                              }}
                            >
                              {itemActionLoading[`rad-ready-${index}`]
                                ? t('markingReady') || 'Marking...'
                                : t('markReadyForPickup') || 'Mark as Ready for Pickup'}
                            </Button>
                          ) : null}
                          {exam.status === 'ready_for_pickup' ? (
                            <Button
                              size="sm"
                              disabled={itemActionLoading[`rad-complete-${index}`]}
                              onClick={async () => {
                                setItemActionLoading((prev) => ({ ...prev, [`rad-complete-${index}`]: true }));
                                try {
                                  await setItemCompleted(medicalRecord._id, 'radiology', index);
                                } finally {
                                  setItemActionLoading((prev) => ({ ...prev, [`rad-complete-${index}`]: false }));
                                }
                              }}
                            >
                              {itemActionLoading[`rad-complete-${index}`]
                                ? t('markingCompleted') || 'Marking...'
                                : t('markCompleted') || 'Mark as Completed'}
                            </Button>
                          ) : null}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Radiology Request Status/Action */}
              <div className="mt-2 mb-4">
                {(() => {
                  const req = getRequestForType('imaging');
                  if (req) {
                    return (
                      <div className="mb-2">
                        <div className="text-green-700">
                          {t('radiologyRequest') || 'Radiology Request'}: {getProviderName(extractProviderId(req.details?.providerId), radiologists)}<br />
                          {t('status') || 'Status'}: {req.status || t('requested') || 'Requested'}
                        </div>
                        
                        
                        {/* Display radiology feedback for all statuses that have feedback */}
                        {(req.details?.feedback || req.feedback) && 
                          ['partially_fulfilled', 'pending_patient_confirmation', 'out_of_stock'].includes(req.status) && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 text-red-600 text-sm">
                            <strong>{t('radiologyFeedback') || 'Radiology Feedback'}:</strong> {req.details?.feedback || req.feedback}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <>
                      <div className="text-gray-500 mb-2">{t('status') || 'Status'}: {t('notRequested') || 'Not requested'}</div>
                      <div className="flex items-center gap-2">
                        <Select value={selectedRadiologist} onValueChange={setSelectedRadiologist}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder={t('selectRadiologist') || 'Select Radiologist'} />
                          </SelectTrigger>
                          <SelectContent>
                            {radiologists.map((rad) => (
                              <SelectItem key={rad._id} value={rad._id}>
                                {rad.firstName} {rad.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={() => handleRequest('imaging', selectedRadiologist)} disabled={!selectedRadiologist || assigning === 'imaging'}>
                          {assigning === 'imaging' ? t('requesting') || 'Requesting...' : t('requestRadiology') || 'Request Radiology'}
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Partial Fulfillment Confirmation UI for Radiology */}
              {activeRadiologyRequest && activeRadiologyRequest.status === 'pending_patient_confirmation' && (
                <Card className="mt-4 mb-4 border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-amber-800">{t('partialRadiologyFulfillmentConfirmation') || 'Partial Radiology Exams Confirmation'}</h3>
                    <p className="text-amber-700 mb-2">
                      {t('partialRadiologyFulfillmentConfirmationMessage') || 'Some radiology exams are unavailable. Would you like to proceed with the available exams?'}
                    </p>
                    
                    {(activeRadiologyRequest.details?.feedback || activeRadiologyRequest.feedback) && (
                      <div className="bg-white p-2 rounded mb-4 text-red-600 text-sm">
                        <strong>{t('unavailableRadiologyExams') || 'Unavailable Radiology Exams'}:</strong> {activeRadiologyRequest.details?.feedback || activeRadiologyRequest.feedback}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={async () => {
                          try {
                            setAcceptingId(activeRadiologyRequest._id);
                            await api.confirmPartialFulfillment(activeRadiologyRequest._id);
                            refreshServiceRequests();
                          } catch (err) {
                            console.error('Failed to confirm partial fulfillment', err);
                            setError('Failed to confirm. Please try again.');
                          } finally {
                            setAcceptingId(null);
                          }
                        }}
                        disabled={acceptingId === activeRadiologyRequest._id}
                        variant="default"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {acceptingId === activeRadiologyRequest._id ? (
                          t('confirming') || 'Confirming...'
                        ) : (
                          t('confirmPartialOrder') || 'Confirm Partial Order'
                        )}
                      </Button>
                      <Button 
                        onClick={async () => {
                          try {
                            setCancellingId(activeRadiologyRequest._id);
                            await api.cancelMedicalRecordRequest(activeRadiologyRequest._id);
                            refreshServiceRequests();
                          } catch (err) {
                            console.error('Failed to cancel', err);
                            setError('Failed to cancel. Please try again.');
                          } finally {
                            setCancellingId(null);
                          }
                        }}
                        disabled={cancellingId === activeRadiologyRequest._id}
                        variant="outline"
                      >
                        {cancellingId === activeRadiologyRequest._id ? (
                          t('cancelling') || 'Cancelling...'
                        ) : (
                          t('cancelRequest') || 'Cancel Request'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          {medicalRecord.notes && (
            <div className="mt-4">
              <h4 className="font-semibold">{t('notesFromDoctor') || 'Notes from Doctor'}:</h4>
              <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{medicalRecord.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionDetail;