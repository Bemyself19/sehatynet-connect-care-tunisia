import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { MedicalRecord } from '@/types/medicalRecord';

const PharmacyPrescriptions: React.FC = () => {
  const { t } = useTranslation();
  const [assignedRequests, setAssignedRequests] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Per-record feedback and loading state
  const [feedbackMap, setFeedbackMap] = useState<{[id: string]: string}>({});
  const [actionLoadingMap, setActionLoadingMap] = useState<{[id: string]: boolean}>({});
  // Medication availability tracking
  const [medicationAvailability, setMedicationAvailability] = useState<{[recordId: string]: {[medName: string]: boolean}}>({});
  const { id: paramPrescriptionId } = useParams<{ id?: string }>();
  const location = useLocation();
  const queryPrescriptionId = new URLSearchParams(location.search).get('id');
  const selectedPrescriptionId = paramPrescriptionId || queryPrescriptionId;
  const highlightedRecordRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    api.getAssignedRequests()
      .then((data) => {
        console.log('API response from getAssignedRequests:', data);
        console.log('Original doctor data:', data.map(record => record.originalDoctor || 'No doctor data'));
        setAssignedRequests(data);
        
        // Initialize medication availability state from fetched data
        const initialAvailability = {};
        const initialFeedback = {};
        
        data.forEach(record => {
          if (record.details?.medications) {
            initialAvailability[record._id] = {};
            record.details.medications.forEach(med => {
              // Set availability based on medication status
              if (med.hasOwnProperty('available')) {
                initialAvailability[record._id][med.name] = med.available;
              } else {
                // If no availability info, default to true unless status is 'unavailable'
                initialAvailability[record._id][med.name] = med.status !== 'unavailable';
              }
            });
          }
          
          // Store feedback for partially fulfilled orders
          if ((record.status === 'partially_fulfilled' || record.status === 'out_of_stock')) {
            // Check both locations where feedback might be stored
            const feedback = record.feedback || record.details?.feedback;
            if (feedback) {
              initialFeedback[record._id] = feedback;
            }
          }
        });
        
        // Update states
        setMedicationAvailability(prev => ({...prev, ...initialAvailability}));
        setFeedbackMap(prev => ({...prev, ...initialFeedback}));
        
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to fetch prescriptions');
        setLoading(false);
      });
  }, [selectedPrescriptionId]);

  // Deduplicate by prescriptionId, show only latest non-cancelled record per prescription
  const dedupedRequests = useMemo(() => {
    const map = new Map<string, MedicalRecord>();
    assignedRequests.forEach((rec) => {
      // Use prescriptionId from top-level or details
      const pid = rec.prescriptionId || rec.details?.prescriptionId;
      if (!pid || rec.status === 'cancelled') return;
      const existing = map.get(pid);
      if (!existing || new Date(rec.updatedAt) > new Date(existing.updatedAt)) {
        map.set(pid, rec);
      }
    });
    return Array.from(map.values());
  }, [assignedRequests]);

  useEffect(() => {
    if (selectedPrescriptionId && highlightedRecordRef.current) {
      console.log('[PharmacyPrescriptions] Highlighting prescription with ID:', selectedPrescriptionId);
      highlightedRecordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Animation is handled via the CSS class in the JSX
    }
  }, [dedupedRequests, selectedPrescriptionId]);

  // Toggle medication availability
  const toggleMedicationAvailability = (recordId: string, medName: string) => {
    setMedicationAvailability(prev => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        [medName]: !(prev[recordId]?.[medName] ?? true)
      }
    }));
  };

  if (loading) return <div className="p-4">{t('loading')}</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('prescriptions')}</h1>
        <p className="text-gray-600">{t('managePrescriptionRequests')}</p>
      </div>

      {/* Prescriptions Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>{t('prescriptionManagement')}</span>
          </CardTitle>
          <CardDescription>
            {t('viewManagePrescriptionRequests')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : dedupedRequests.length === 0 ? (
            <div className="text-center py-12">{t('noAssignedPrescriptions') || 'No assigned prescriptions found.'}</div>
          ) : (
            <div className="space-y-4">
              {dedupedRequests.map((record) => {
                // Medication details
                const medications = record.details?.medications || [];
                // Status transitions
                const status = record.status || 'pending';
                const canMarkReady = status === 'partially_fulfilled';
                const canPartialFulfill = status === 'pending';
                const canOutOfStock = status === 'pending';
                const canComplete = status === 'ready_for_pickup';
                const canCancel = ['pending', 'ready_for_pickup', 'partially_fulfilled', 'out_of_stock', 'pending_patient_confirmation'].includes(status);
                const isWaitingPatientConfirmation = status === 'pending_patient_confirmation';

                // Per-record state
                const feedback = feedbackMap[record._id] || '';
                const actionLoading = actionLoadingMap[record._id] || false;
                const setFeedback = (val: string) => setFeedbackMap(prev => ({ ...prev, [record._id]: val }));
                const setActionLoading = (val: boolean) => setActionLoadingMap(prev => ({ ...prev, [record._id]: val }));
                const handleStatusChange = async (newStatus: string) => {
                  setActionLoading(true);
                  try {
                    const payload: any = { status: newStatus };
                    if (['partially_fulfilled', 'out_of_stock', 'pending_patient_confirmation'].includes(newStatus)) {
                      // If it's a partial fulfillment or out of stock, construct a detailed feedback message
                      const recordAvailability = medicationAvailability[record._id] || {};
                      const medications = record.details?.medications || [];
                      const unavailableMeds = medications
                        .filter(med => !(recordAvailability[med.name] ?? true))
                        .map(med => med.name);
                      
                      if (unavailableMeds.length > 0) {
                        // Set feedback to either the user-provided feedback or a list of unavailable medications
                        payload.feedback = feedback || `${t('unavailableMedications') || 'Unavailable medications'}: ${unavailableMeds.join(', ')}`;
                      } else if (feedback) {
                        payload.feedback = feedback;
                      }
                    }
                    
                    // Include medication availability data while preserving ALL original medication details
                    const recordAvailability = medicationAvailability[record._id] || {};
                    const medications = record.details?.medications || [];
                    const medicationFulfillment = medications.map((med: any) => {
                      // First, determine medication availability
                      const isAvailable = recordAvailability[med.name] ?? true;
                      
                      // Then determine status based on availability and the record's new status
                      let medStatus;
                      
                      if (!isAvailable) {
                        // Unavailable medications always have 'unavailable' status
                        medStatus = 'unavailable';
                      } else if (newStatus === 'confirmed') {
                        medStatus = 'confirmed';
                      } else if (newStatus === 'ready_for_pickup') {
                        medStatus = 'ready_for_pickup';
                      } else if (newStatus === 'completed') {
                        medStatus = 'collected';  // Change to 'collected' for better clarity in UI
                      } else if (med.status && med.status !== 'pending') {
                        // Preserve existing non-pending status if present
                        medStatus = med.status;
                      } else {
                        // Default for available medications
                        medStatus = 'confirmed';
                      }
                        
                      return {
                        ...med, // Keep ALL original fields (name, dosage, frequency, duration, instructions, etc)
                        available: recordAvailability[med.name] ?? true,
                        status: medStatus // Set appropriate status based on availability and overall record status
                      };
                    });
                    payload.medications = medicationFulfillment;
                    
                    await api.fulfillAssignedRequest(record._id, payload);
                    
                    // Send notification to patient when order is confirmed
                    if (newStatus === 'confirmed' && record) {
                      const availableMeds = medicationFulfillment.filter(med => med.available).map(med => med.name);
                      const originalDoctor = (record as any).originalDoctor;
                      const notificationData = {
                        recipientId: record.patientId,
                        type: 'prescription_confirmed',
                        title: t('prescriptionConfirmed') || 'Prescription Confirmed',
                        message: t('prescriptionConfirmedMessage', { 
                          medications: availableMeds.join(', '),
                          pharmacy: originalDoctor?.firstName && originalDoctor?.lastName 
                            ? `${originalDoctor.firstName} ${originalDoctor.lastName}` 
                            : 'pharmacy'
                        }) || `Your prescription has been confirmed by the pharmacy. All medications are available: ${availableMeds.join(', ')}. Your order is being prepared.`,
                        priority: 'high',
                        data: {
                          prescriptionId: record._id,
                          status: newStatus,
                          medications: medicationFulfillment,
                          providerId: originalDoctor?._id,
                          providerName: originalDoctor?.firstName && originalDoctor?.lastName 
                            ? `${originalDoctor.firstName} ${originalDoctor.lastName}` 
                            : 'Doctor'
                        }
                      };
                      
                      try {
                        await api.createNotification(notificationData);
                      } catch (notifError) {
                        console.error('Failed to send notification:', notifError);
                        // Don't fail the whole operation if notification fails
                      }
                    }
                    
                    // Send notification to patient when order is partially available and needs confirmation
                    if (newStatus === 'pending_patient_confirmation' && record) {
                      const unavailableMeds = medicationFulfillment.filter(med => !med.available).map(med => med.name);
                      const availableMeds = medicationFulfillment.filter(med => med.available).map(med => med.name);
                      const pharmacy = record.providerId?.firstName && record.providerId?.lastName 
                          ? `${record.providerId.firstName} ${record.providerId.lastName}` 
                          : 'Pharmacy';
                          
                      const notificationData = {
                        recipientId: record.patientId,
                        type: 'prescription_partial_confirmation',
                        title: t('partialPrescriptionConfirmation') || 'Partial Prescription Confirmation Needed',
                        message: t('partialPrescriptionConfirmationMessage', { 
                          availableMeds: availableMeds.join(', '),
                          unavailableMeds: unavailableMeds.join(', '),
                          pharmacy
                        }) || `Some medications are unavailable at ${pharmacy}: ${unavailableMeds.join(', ')}. Please confirm if you want to proceed with only the available medications: ${availableMeds.join(', ')}.`,
                        priority: 'high',
                        data: {
                          prescriptionId: record._id,
                          status: newStatus,
                          medications: medicationFulfillment
                        },
                        actionUrl: `/dashboard/patient/medical-records?open=${record._id}`
                      };
                      
                      try {
                        await api.createNotification(notificationData);
                      } catch (notifError) {
                        console.error('Failed to send notification:', notifError);
                        // Don't fail the whole operation if notification fails
                      }
                    }
                    
                    // Send notification to patient when order is completely out of stock
                    if (newStatus === 'out_of_stock' && record) {
                      const unavailableMeds = medicationFulfillment.filter(med => !med.available).map(med => med.name);
                      const pharmacy = record.providerId?.firstName && record.providerId?.lastName 
                          ? `${record.providerId.firstName} ${record.providerId.lastName}` 
                          : 'Pharmacy';
                          
                      const notificationData = {
                        recipientId: record.patientId,
                        type: 'prescription_out_of_stock',
                        title: t('prescriptionOutOfStock') || 'Prescription Out of Stock',
                        message: t('prescriptionOutOfStockMessage', { 
                          medications: unavailableMeds.join(', '),
                          pharmacy
                        }) || `All medications are unavailable at ${pharmacy}: ${unavailableMeds.join(', ')}. You can request these medications from another pharmacy.`,
                        priority: 'high',
                        data: {
                          prescriptionId: record._id,
                          status: newStatus,
                          medications: medicationFulfillment
                        },
                        actionUrl: `/dashboard/patient/medical-records?open=${record._id}`
                      };
                      
                      try {
                        await api.createNotification(notificationData);
                      } catch (notifError) {
                        console.error('Failed to send notification:', notifError);
                        // Don't fail the whole operation if notification fails
                      }
                    }
                    
                    // Send notification when ready for pickup
                    if (newStatus === 'ready_for_pickup' && record) {
                      const notificationData = {
                        recipientId: record.patientId,
                        type: 'prescription_ready',
                        title: t('prescriptionReady') || 'Prescription Ready',
                        message: t('prescriptionReadyMessage') || `Your prescription is ready for pickup at the pharmacy.`,
                        priority: 'high',
                        data: {
                          prescriptionId: record._id,
                          status: newStatus,
                          providerId: record.providerId?._id,
                          providerName: record.providerId?.firstName && record.providerId?.lastName 
                            ? `${record.providerId.firstName} ${record.providerId.lastName}` 
                            : 'Pharmacy'
                        },
                        actionUrl: `/dashboard/patient/medical-records?open=${record._id}`
                      };
                      
                      try {
                        await api.createNotification(notificationData);
                      } catch (notifError) {
                        console.error('Failed to send notification:', notifError);
                        // Don't fail the whole operation if notification fails
                      }
                    }
                    
                    // Send notification when completed
                    if (newStatus === 'completed' && record) {
                      const notificationData = {
                        recipientId: record.patientId,
                        type: 'prescription_completed',
                        title: t('prescriptionCompleted') || 'Prescription Completed',
                        message: t('prescriptionCompletedMessage') || `Your prescription has been marked as completed. Thank you for using our service.`,
                        priority: 'medium',
                        data: {
                          prescriptionId: record._id,
                          status: newStatus,
                          providerId: record.providerId?._id,
                          providerName: record.providerId?.firstName && record.providerId?.lastName 
                            ? `${record.providerId.firstName} ${record.providerId.lastName}` 
                            : 'Pharmacy'
                        },
                        actionUrl: `/dashboard/patient/medical-records?open=${record._id}`
                      };
                      
                      try {
                        await api.createNotification(notificationData);
                      } catch (notifError) {
                        console.error('Failed to send notification:', notifError);
                        // Don't fail the whole operation if notification fails
                      }
                    }
                    
                    // Refetch assigned requests after action
                    const updated = await api.getAssignedRequests();
                    
                    // Update medication availability state based on fetched data
                    // Find the updated record for the current prescription
                    const updatedRecord = updated.find(r => r._id === record._id);
                    if (updatedRecord && updatedRecord.details?.medications) {
                      // Update medication availability based on the 'available' property from the backend
                      const updatedAvailability = {};
                      updatedRecord.details.medications.forEach(med => {
                        // If the medication has an 'available' property, use it; otherwise keep the current state
                        if (med.hasOwnProperty('available')) {
                          if (!updatedAvailability[updatedRecord._id]) {
                            updatedAvailability[updatedRecord._id] = {};
                          }
                          updatedAvailability[updatedRecord._id][med.name] = med.available;
                        }
                      });
                      
                      // Merge with current availability state
                      setMedicationAvailability(prev => ({
                        ...prev,
                        ...updatedAvailability
                      }));
                    }
                    
                    setAssignedRequests(updated);
                    setFeedback('');
                  } catch (err: any) {
                    alert(err?.message || 'Failed to update status');
                  }
                  setActionLoading(false);
                };

                const pid = record.prescriptionId || record.details?.prescriptionId;
                const isSelected = (pid === selectedPrescriptionId) || (record._id === selectedPrescriptionId);
                return (
                  <Card
                    key={record._id}
                    ref={isSelected ? highlightedRecordRef : null}
                    className={`border p-4 ${isSelected ? 'ring-2 ring-blue-500 shadow-lg highlight-animation' : ''}`}
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-lg">{record.title || t('prescription')}</div>
                        <div className="text-sm text-gray-600">{record.patientId?.firstName} {record.patientId?.lastName}</div>
                        <div className="text-xs text-gray-500">{t('date')}: {new Date(record.date).toLocaleDateString()}</div>
                        {/* Doctor information - check both record.originalDoctor and record.details?.originalDoctor */}
                        {((record as any).originalDoctor || record.details?.originalDoctor) && (
                          <div className="text-sm text-blue-600 mt-1">
                            {t('prescribedBy', 'Prescribed by')}: Dr. {
                              (record as any).originalDoctor 
                                ? `${(record as any).originalDoctor.firstName} ${(record as any).originalDoctor.lastName}`
                                : record.details?.originalDoctor 
                                  ? `${record.details.originalDoctor.firstName} ${record.details.originalDoctor.lastName}`
                                  : ''
                            }
                            {((record as any).originalDoctor?.specialization || record.details?.originalDoctor?.specialization) && 
                              ` (${(record as any).originalDoctor?.specialization || record.details?.originalDoctor?.specialization})`
                            }
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {t(status)}
                      </Badge>
                    </div>
                    {/* Medication details with checkboxes */}
                    {medications.length > 0 && (
                      <div className="mt-4">
                        <div className="font-medium text-sm mb-2">{t('medications')}</div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-300 px-2 py-1 text-left">Available</th>
                                <th className="border border-gray-300 px-2 py-1 text-left">Medication</th>
                                <th className="border border-gray-300 px-2 py-1 text-left">Dosage</th>
                                <th className="border border-gray-300 px-2 py-1 text-left">Frequency</th>
                                <th className="border border-gray-300 px-2 py-1 text-left">Duration</th>
                                <th className="border border-gray-300 px-2 py-1 text-left">Instructions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {medications.map((med: any, idx: number) => {
                                const isAvailable = medicationAvailability[record._id]?.[med.name] ?? true;
                                return (
                                  <tr key={idx} className={!isAvailable ? 'bg-red-50' : ''}>
                                    <td className="border border-gray-300 px-2 py-1 text-center">
                                      <input
                                        type="checkbox"
                                        id={`med-${record._id}-${idx}`}
                                        checked={isAvailable}
                                        onChange={() => toggleMedicationAvailability(record._id, med.name)}
                                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1 font-medium">
                                      <div className="flex items-center">
                                        <span>{med.name}</span>
                                        {!isAvailable && (
                                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                            {t('unavailable') || 'Unavailable'}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      {med.dosage || '-'}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      {med.frequency || '-'}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      {med.duration || '-'}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      {med.instructions || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {/* Notes */}
                    <div className="mt-2 text-sm text-gray-700">{record.details?.notes || ''}</div>
                    
                    {/* Feedback display for partially fulfilled orders */}
                    {(status === 'partially_fulfilled' || status === 'out_of_stock') && (
                      <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 p-2 rounded">
                        <span className="font-medium text-amber-700">{t('feedback') || 'Feedback'}:</span> {record.feedback || record.details?.feedback || feedback}
                      </div>
                    )}
                    {/* Status actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(() => {
                        // Check medication availability
                        const recordAvailability = medicationAvailability[record._id] || {};
                        const allAvailable = medications.every((med: any) => recordAvailability[med.name] ?? true);
                        const allUnavailable = medications.every((med: any) => !(recordAvailability[med.name] ?? true));
                        const someAvailableSomeNot = !allAvailable && !allUnavailable;
                        
                        if (status === 'pending') {
                          return (
                            <>
                              {allAvailable && (
                                <Button 
                                  disabled={actionLoading} 
                                  onClick={() => handleStatusChange('confirmed')} 
                                  size="sm" 
                                  variant="default" 
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" /> {t('confirmOrder')}
                                </Button>
                              )}
                              {someAvailableSomeNot && (
                                <>
                                  <input
                                    type="text"
                                    placeholder={t('partialFulfillmentFeedback') || 'Unavailable medications...'}
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    className="border rounded px-2 py-1 text-sm"
                                    style={{ minWidth: 180 }}
                                  />
                                  <Button 
                                    disabled={actionLoading || !feedback.trim()} 
                                    onClick={() => handleStatusChange('pending_patient_confirmation')} 
                                    size="sm" 
                                    variant="outline"
                                  >
                                    <AlertCircle className="h-4 w-4 mr-1" /> {t('markPartiallyFulfilled')}
                                  </Button>
                                </>
                              )}
                              {allUnavailable && (
                                <>
                                  <input
                                    type="text"
                                    placeholder={t('outOfStockFeedback') || 'Out of stock medications...'}
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    className="border rounded px-2 py-1 text-sm"
                                    style={{ minWidth: 180 }}
                                  />
                                  <Button 
                                    disabled={actionLoading || !feedback.trim()} 
                                    onClick={() => handleStatusChange('out_of_stock')} 
                                    size="sm" 
                                    variant="destructive"
                                  >
                                    <AlertCircle className="h-4 w-4 mr-1" /> {t('markOutOfStock')}
                                  </Button>
                                </>
                              )}
                            </>
                          );
                        } else if (status === 'pending_patient_confirmation') {
                          return (
                            <>
                              <div className="text-amber-500 text-sm mt-2 flex items-center">
                                <Clock className="h-4 w-4 mr-1" /> {t('waitingForPatientConfirmation') || 'Waiting for patient confirmation'}
                              </div>
                              {(record.details?.feedback || record.feedback) && (
                                <div className="mt-2 text-sm p-2 bg-amber-50 border border-amber-200 rounded">
                                  <strong>{t('unavailableMedications') || 'Unavailable medications'}:</strong> {record.details?.feedback || record.feedback}
                                </div>
                              )}
                            </>
                          );
                        } else if (['confirmed', 'partially_fulfilled'].includes(status)) {
                          return (
                            <Button 
                              disabled={actionLoading} 
                              onClick={() => handleStatusChange('ready_for_pickup')} 
                              size="sm" 
                              variant="default"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> {t('markReadyForPickup')}
                            </Button>
                          );
                        } else if (status === 'ready_for_pickup') {
                          return (
                            <Button 
                              disabled={actionLoading} 
                              onClick={() => handleStatusChange('completed')} 
                              size="sm" 
                              variant="default"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> {t('markCompleted')}
                            </Button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyPrescriptions;