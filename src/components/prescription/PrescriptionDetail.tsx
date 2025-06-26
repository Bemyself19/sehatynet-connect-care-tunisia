import React, { useEffect, useState } from 'react';
import { Prescription, Medication } from '@/types/prescription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Pill } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PrescriptionDetailProps {
  prescription: Prescription;
}

const PrescriptionDetail: React.FC<PrescriptionDetailProps> = ({ prescription }) => {
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

  const prescriptionId = prescription._id;

  useEffect(() => {
    api.getProvidersByType('pharmacy').then(setPharmacies);
    api.getProvidersByType('lab').then(setLabs);
    api.getProvidersByType('radiologist').then(setRadiologists);
    // Fetch all service requests for this prescription
    api.getMedicalRecordsByPrescriptionId(prescriptionId).then(setServiceRequests);
  }, [prescriptionId]);

  const refreshServiceRequests = () => {
    api.getMedicalRecordsByPrescriptionId(prescriptionId).then(setServiceRequests);
  };

  // Helper to get request status and provider for a group
  const getRequestForType = (type: 'prescription' | 'lab_result' | 'imaging') => {
    return serviceRequests.find((r) => r.type === type);
  };

  // Helper to get the active (non-cancelled) pharmacy request for this prescription
  const getActivePharmacyRequest = () => {
    return serviceRequests.find((r) => r.type === 'prescription' && r.status !== 'cancelled');
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
      if (type === 'prescription') details.medications = prescription.medications;
      if (type === 'lab_result') details.labTests = prescription.labTests;
      if (type === 'imaging') details.radiology = prescription.radiology;
      details.providerId = providerId;
      const patientIdToSend = typeof prescription.patientId === 'string' ? prescription.patientId : prescription.patientId._id;
      console.log('Patient ID:', patientIdToSend);
      console.log('Selected Pharmacy ID:', providerId);
      await api.createMedicalRecord({
        patientId: patientIdToSend,
        title: `${type === 'prescription' ? 'Pharmacy' : type === 'lab_result' ? 'Lab' : 'Radiology'} Request`,
        type,
        date: new Date().toISOString(),
        details,
        isPrivate: false,
        privacyLevel: 'patient_visible',
        prescriptionId,
      });
      refreshServiceRequests();
    } catch (err: any) {
      setOrderError(err.message || 'Failed to request pharmacy');
    } finally {
      setAssigning('');
    }
  };

  const handleCancelRequest = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to cancel this pharmacy request?')) return;
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

  const handleAcceptPartialOrder = async (recordId: string) => {
    setAcceptingId(recordId);
    setError(null);
    try {
      await api.acceptPartialPharmacyOrder(recordId);
      refreshServiceRequests();
    } catch (err: any) {
      setError(err.message || 'Failed to accept partial order');
    } finally {
      setAcceptingId(null);
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
      console.log('After reassignment, feedback is:', req?.details?.feedback);
    } catch (err: any) {
      setError(err.message || 'Failed to reassign pharmacy');
    } finally {
      setReassigningId(null);
    }
  };

  const getProviderName = (id: string, list: any[]) => {
    const found = list.find((p) => String(p._id) === String(id));
    return found ? `${found.firstName} ${found.lastName}` : '';
  };

  if (!prescription) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Prescription Details</CardTitle>
          <CardDescription>
            Prescribed on {new Date(prescription.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <strong>Patient:</strong> {prescription.patientId.firstName} {prescription.patientId.lastName}
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <strong>Doctor:</strong> Dr. {prescription.providerId.firstName} {prescription.providerId.lastName}
            </div>
          </div>
          {/* Medications Section */}
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medications
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Instructions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescription.medications.map((med: Medication, index: number) => (
                <TableRow key={index}>
                  <TableCell>{med.name}</TableCell>
                  <TableCell>{med.dosage}</TableCell>
                  <TableCell>{med.frequency}</TableCell>
                  <TableCell>{med.duration}</TableCell>
                  <TableCell>{med.instructions}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pharmacy Request Status/Action */}
          {prescription.medications.length > 0 && (
            <div className="mt-2 mb-4">
              {(() => {
                const req = getActivePharmacyRequest();
                if (req) {
                  // Handle partial/out_of_stock states
                  if (req.status === "partially_fulfilled") {
                    return (
                      <div className="text-yellow-700 space-y-2">
                        <div>
                          Pharmacy Request: {getProviderName(extractProviderId(req.providerId), pharmacies)}<br />
                          Status: {req.status.replace('_', ' ')}
                        </div>
                        <div className="font-medium">Pharmacist Feedback:</div>
                        <div className="border rounded p-2 bg-yellow-50 text-sm">{req.details.feedback || 'No feedback provided.'}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            onClick={() => handleAcceptPartialOrder(req._id)}
                            disabled={acceptingId === req._id}
                          >
                            {acceptingId === req._id ? 'Accepting...' : 'Accept Partial Order'}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelRequest(req._id)}
                            disabled={cancellingId === req._id}
                          >
                            {cancellingId === req._id ? 'Cancelling...' : 'Cancel Request'}
                          </Button>
                          <Select value={selectedNewPharmacy} onValueChange={setSelectedNewPharmacy}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Change Pharmacy" />
                            </SelectTrigger>
                            <SelectContent>
                              {pharmacies.filter(p => p._id !== extractProviderId(req.providerId)).map((pharm) => (
                                <SelectItem key={pharm._id} value={pharm._id}>
                                  {pharm.firstName} {pharm.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => handleReassignPharmacy(req._id)}
                            disabled={!selectedNewPharmacy || reassigningId === req._id}
                          >
                            {reassigningId === req._id ? 'Reassigning...' : 'Confirm Change'}
                          </Button>
                        </div>
                        {error && <div className="text-red-600 mt-2">{error}</div>}
                      </div>
                    );
                  }
                  if (req.status === "out_of_stock") {
                    return (
                      <div className="text-yellow-700 space-y-2">
                        <div>
                          Pharmacy Request: {getProviderName(extractProviderId(req.providerId), pharmacies)}<br />
                          Status: {req.status.replace('_', ' ')}
                        </div>
                        <div className="font-medium">Pharmacist Feedback:</div>
                        <div className="border rounded p-2 bg-yellow-50 text-sm">{req.details.feedback || 'No feedback provided.'}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelRequest(req._id)}
                            disabled={cancellingId === req._id}
                          >
                            {cancellingId === req._id ? 'Cancelling...' : 'Cancel Request'}
                          </Button>
                          <Select value={selectedNewPharmacy} onValueChange={setSelectedNewPharmacy}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Change Pharmacy" />
                            </SelectTrigger>
                            <SelectContent>
                              {pharmacies.filter(p => p._id !== extractProviderId(req.providerId)).map((pharm) => (
                                <SelectItem key={pharm._id} value={pharm._id}>
                                  {pharm.firstName} {pharm.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => handleReassignPharmacy(req._id)}
                            disabled={!selectedNewPharmacy || reassigningId === req._id}
                          >
                            {reassigningId === req._id ? 'Reassigning...' : 'Confirm Change'}
                          </Button>
                        </div>
                        {error && <div className="text-red-600 mt-2">{error}</div>}
                      </div>
                    );
                  }
                  return (
                    <div className="text-green-700">
                      Pharmacy Request: {getProviderName(extractProviderId(req.providerId), pharmacies)}<br />
                      Status: {req.status || 'Requested'}
                      {/* Cancel button for eligible statuses */}
                      {['pending', 'ready_for_pickup'].includes(req.status) && (
                        <Button
                          variant="destructive"
                          className="ml-4"
                          onClick={() => handleCancelRequest(req._id)}
                          disabled={cancellingId === req._id}
                        >
                          {cancellingId === req._id ? 'Cancelling...' : 'Cancel Request'}
                        </Button>
                      )}
                    </div>
                  );
                }
                return (
                  <>
                    <div className="text-gray-500 mb-2">Status: Not requested</div>
                    <div className="flex items-center gap-2">
                      <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select Pharmacy" />
                        </SelectTrigger>
                        <SelectContent>
                          {pharmacies
                            .filter(pharm => pharm._id !== (typeof prescription.patientId === 'string' ? prescription.patientId : prescription.patientId._id))
                            .map((pharm) => (
                              <SelectItem key={pharm._id} value={pharm._id}>
                                {pharm.firstName} {pharm.lastName}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => handleRequest('prescription', selectedPharmacy)} disabled={!selectedPharmacy || assigning === 'prescription'}>
                        {assigning === 'prescription' ? 'Requesting...' : 'Request Pharmacy'}
                      </Button>
                    </div>
                    {orderError && <div className="text-red-600 mt-2">{orderError}</div>}
                  </>
                );
              })()}
            </div>
          )}
          {/* Lab Tests Section */}
          {prescription.labTests && prescription.labTests.length > 0 && (
            <>
              <h3 className="font-semibold mt-6 mb-2">Lab Tests</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescription.labTests.map((test: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{test.testName}</TableCell>
                      <TableCell>{test.notes}</TableCell>
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
                      <div className="text-green-700">
                        Lab Request: {getProviderName(extractProviderId(req.details?.providerId), labs)}<br />
                        Status: {req.status || 'Requested'}
                      </div>
                    );
                  }
                  return (
                    <>
                      <div className="text-gray-500 mb-2">Status: Not requested</div>
                      <div className="flex items-center gap-2">
                        <Select value={selectedLab} onValueChange={setSelectedLab}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select Lab" />
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
                          {assigning === 'lab_result' ? 'Requesting...' : 'Request Lab'}
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}
          {/* Radiology Section */}
          {prescription.radiology && prescription.radiology.length > 0 && (
            <>
              <h3 className="font-semibold mt-6 mb-2">Radiology</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescription.radiology.map((exam: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{exam.examName}</TableCell>
                      <TableCell>{exam.notes}</TableCell>
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
                      <div className="text-green-700">
                        Radiology Request: {getProviderName(extractProviderId(req.details?.providerId), radiologists)}<br />
                        Status: {req.status || 'Requested'}
                      </div>
                    );
                  }
                  return (
                    <>
                      <div className="text-gray-500 mb-2">Status: Not requested</div>
                      <div className="flex items-center gap-2">
                        <Select value={selectedRadiologist} onValueChange={setSelectedRadiologist}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select Radiologist" />
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
                          {assigning === 'imaging' ? 'Requesting...' : 'Request Radiology'}
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}
          {prescription.notes && (
            <div className="mt-4">
              <h4 className="font-semibold">Notes from Doctor:</h4>
              <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{prescription.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionDetail; 