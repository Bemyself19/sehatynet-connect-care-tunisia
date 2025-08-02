
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { MedicalRecord } from '@/types/medicalRecord';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

const LabResults: React.FC = () => {
  const { t } = useTranslation();
  const [labRequests, setLabRequests] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingMap, setActionLoadingMap] = useState<{[id: string]: boolean}>({});
  const [feedbackMap, setFeedbackMap] = useState<{[id: string]: string}>({});
  const [testAvailability, setTestAvailability] = useState<{[recordId: string]: {[testName: string]: boolean}}>({});
  const location = useLocation();
  const highlightedRecordId = new URLSearchParams(location.search).get('id');
  const highlightedRecordRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    api.getAssignedRequests()
      .then((data) => {
        const labRequests = data.filter(r => r.type === 'lab_result');
        setLabRequests(labRequests);
        
        // Initialize test availability and feedback state from fetched data
        const initialAvailability = {};
        const initialFeedback = {};
        
        labRequests.forEach(record => {
          if (record.details?.labTests) {
            initialAvailability[record._id] = {};
            record.details.labTests.forEach(test => {
              // Set availability based on test status
              if (test.hasOwnProperty('available')) {
                initialAvailability[record._id][test.testName || test.name] = test.available;
              } else {
                // If no availability info, default to true unless status is 'unavailable'
                initialAvailability[record._id][test.testName || test.name] = test.status !== 'unavailable';
              }
            });
          }
          
          // Store feedback for partially fulfilled or other relevant statuses
          if (['partially_fulfilled', 'out_of_stock', 'pending_patient_confirmation'].includes(record.status)) {
            // Check both locations where feedback might be stored
            const feedback = record.feedback || record.details?.feedback;
            if (feedback) {
              initialFeedback[record._id] = feedback;
            }
          }
        });
        
        // Update states
        setTestAvailability(prev => ({...prev, ...initialAvailability}));
        setFeedbackMap(prev => ({...prev, ...initialFeedback}));
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to fetch lab requests');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (highlightedRecordId && highlightedRecordRef.current) {
      console.log('[LabResults] Highlighting record with ID:', highlightedRecordId);
      highlightedRecordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a highlight animation or styling
      highlightedRecordRef.current.classList.add('highlight-animation');
      setTimeout(() => {
        highlightedRecordRef.current?.classList.remove('highlight-animation');
      }, 2000);
    }
  }, [highlightedRecordId, labRequests]);

  // Toggle test availability
  const toggleTestAvailability = (recordId: string, testName: string) => {
    setTestAvailability(prev => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        [testName]: !(prev[recordId]?.[testName] ?? true)
      }
    }));
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoadingMap(prev => ({ ...prev, [id]: true }));
    try {
      const record = labRequests.find(r => r._id === id);
      const payload: any = { status: newStatus };
      if (['partially_fulfilled', 'out_of_stock', 'pending_patient_confirmation'].includes(newStatus)) {
        // If it's a partial fulfillment or out of stock, construct a detailed feedback message
        const record = labRequests.find(r => r._id === id);
        const recordAvailability = testAvailability[id] || {};
        const tests = record?.details?.labTests || [];
        const unavailableTests = tests
          .filter(test => !(recordAvailability[test.testName || test.name] ?? true))
          .map(test => test.testName || test.name);
        
        if (unavailableTests.length > 0) {
          // Set feedback to either the user-provided feedback or a list of unavailable tests
          payload.feedback = feedbackMap[id] || `${t('unavailableTests') || 'Unavailable tests'}: ${unavailableTests.join(', ')}`;
        } else if (feedbackMap[id]) {
          payload.feedback = feedbackMap[id];
        }
      }
      
      // Include test availability data
      const recordAvailability = testAvailability[id] || {};
      const labTests = record?.details?.labTests || [];
      const testFulfillment = labTests.map((test: any) => ({
        name: test.testName || test.name,
        available: recordAvailability[test.testName || test.name] ?? true
      }));
      payload.tests = testFulfillment;
      
      await api.fulfillAssignedRequest(id, payload);
      
      // Send notification to patient when order needs patient confirmation for partial fulfillment
      if (newStatus === 'pending_patient_confirmation' && record) {
        const unavailableTests = testFulfillment.filter(test => !test.available).map(test => test.name);
        const availableTests = testFulfillment.filter(test => test.available).map(test => test.name);
        const lab = record.providerId?.firstName && record.providerId?.lastName 
          ? `${record.providerId.firstName} ${record.providerId.lastName}` 
          : 'Laboratory';
            
        const notificationData = {
          recipientId: record.patientId,
          type: 'lab_partial_confirmation',
          title: t('partialLabConfirmation') || 'Partial Lab Test Confirmation Needed',
          message: t('partialLabConfirmationMessage', { 
            availableTests: availableTests.join(', '),
            unavailableTests: unavailableTests.join(', '),
            lab
          }) || `Some lab tests are unavailable at ${lab}: ${unavailableTests.join(', ')}. Please confirm if you want to proceed with only the available tests: ${availableTests.join(', ')}.`,
          priority: 'high',
          data: {
            labTestId: record._id,
            status: newStatus,
            tests: testFulfillment
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
      
      // Send notification to patient when order is confirmed
      if (newStatus === 'confirmed' && record) {
        const availableTests = testFulfillment.filter(test => test.available).map(test => test.name);
        const originalDoctor = (record as any).originalDoctor;
        const notificationData = {
          recipientId: record.patientId,
          type: 'lab_confirmed',
          title: t('labTestConfirmed') || 'Lab Test Confirmed',
          message: t('labTestConfirmedMessage', { 
            tests: availableTests.join(', '),
            lab: originalDoctor?.firstName && originalDoctor?.lastName 
              ? `Dr. ${originalDoctor.firstName} ${originalDoctor.lastName}` 
              : 'lab'
          }) || `Your lab test has been confirmed. All tests are available: ${availableTests.join(', ')}. Your tests are being prepared.`,
          priority: 'high',
          data: {
            labTestId: record._id,
            status: newStatus,
            tests: testFulfillment,
            providerId: originalDoctor?._id,
            providerName: originalDoctor?.firstName && originalDoctor?.lastName 
              ? `Dr. ${originalDoctor.firstName} ${originalDoctor.lastName}` 
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
      
      // Send notification when ready for pickup
      if (newStatus === 'ready_for_pickup' && record) {
        const notificationData = {
          recipientId: record.patientId,
          type: 'lab_ready',
          title: t('labTestReady') || 'Lab Test Ready',
          message: t('labTestReadyMessage') || `Your lab test results are ready for pickup.`,
          priority: 'high',
          data: {
            labTestId: record._id,
            status: newStatus,
            providerId: record.providerId?._id,
            providerName: record.providerId?.firstName && record.providerId?.lastName 
              ? `Dr. ${record.providerId.firstName} ${record.providerId.lastName}` 
              : 'Lab'
          }
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
          type: 'lab_completed',
          title: t('labTestCompleted') || 'Lab Test Completed',
          message: t('labTestCompletedMessage') || `Your lab test has been completed and results are available.`,
          priority: 'high',
          data: {
            labTestId: record._id,
            status: newStatus,
            providerId: record.providerId?._id,
            providerName: record.providerId?.firstName && record.providerId?.lastName 
              ? `Dr. ${record.providerId.firstName} ${record.providerId.lastName}` 
              : 'Lab'
          }
        };
        
        try {
          await api.createNotification(notificationData);
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't fail the whole operation if notification fails
        }
      }
      
      const updated = await api.getAssignedRequests();
      setLabRequests(updated.filter(r => r.type === 'lab_result'));
      setFeedbackMap(prev => ({ ...prev, [id]: '' }));
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    }
    setActionLoadingMap(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('testResults')}</h1>
        <p className="text-gray-600">{t('manageTestsResults')}</p>
      </div>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>{t('labTestRequests')}</span>
          </CardTitle>
          <CardDescription>
            {t('viewManageLabTestRequests')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : labRequests.length === 0 ? (
            <div className="text-center py-12">{t('noLabRequests') || 'No lab requests found.'}</div>
          ) : (
            <div className="space-y-4">
              {labRequests.map((record) => {
                const labTests = record.details?.labTests || [];
                const status = record.status || 'pending';
                const recordAvailability = testAvailability[record._id] || {};
                
                // Calculate test availability
                const allTestsAvailable = labTests.every((test: any) => {
                  const testName = test.testName || test.name;
                  return recordAvailability[testName] ?? true;
                });
                const someTestsAvailable = labTests.some((test: any) => {
                  const testName = test.testName || test.name;
                  return recordAvailability[testName] ?? true;
                });
                const noTestsAvailable = !someTestsAvailable;
                
                const canConfirmOrder = status === 'pending' && allTestsAvailable;
                const canPartialFulfill = status === 'pending' && someTestsAvailable && !allTestsAvailable;
                const canMarkOutOfStock = status === 'pending' && noTestsAvailable;
                const canMarkReady = status === 'confirmed' || status === 'partially_fulfilled';
                const canComplete = status === 'ready_for_pickup';
                const isWaitingPatientConfirmation = status === 'pending_patient_confirmation';
                const isPartiallyFulfilled = status === 'partially_fulfilled';
                const feedback = feedbackMap[record._id] || '';
                const actionLoading = actionLoadingMap[record._id] || false;
                const setFeedback = (val: string) => setFeedbackMap(prev => ({ ...prev, [record._id]: val }));

                return (
                  <Card 
                    key={record._id} 
                    className={`border p-4 ${highlightedRecordId === record._id ? 'ring-2 ring-blue-500 shadow-lg highlight-animation' : ''}`}
                    ref={highlightedRecordId === record._id ? highlightedRecordRef : null}
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-lg">{record.title || t('labRequest')}</div>
                        <div className="text-sm text-gray-600">{record.patientId?.firstName} {record.patientId?.lastName}</div>
                        <div className="text-xs text-gray-500">{t('date')}: {new Date(record.date).toLocaleDateString()}</div>
                        {/* Original prescribing doctor - check both record.originalDoctor and record.details?.originalDoctor */}
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
                    {/* Lab test details with checkboxes */}
                    {labTests.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-sm mb-1">{t('labTests')}</div>
                        <div className="space-y-1">
                          {labTests.map((test: any, idx: number) => {
                            const testName = test.testName || test.name;
                            const isAvailable = testAvailability[record._id]?.[testName] ?? true;
                            return (
                              <div key={idx} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`test-${record._id}-${idx}`}
                                  checked={isAvailable}
                                  onChange={() => toggleTestAvailability(record._id, testName)}
                                  disabled={['confirmed', 'ready_for_pickup', 'completed', 'partially_fulfilled', 'pending_patient_confirmation'].includes(status)}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                  title={test.available === false ? 'Test is unavailable' : ''}
                                />
                                <label 
                                  htmlFor={`test-${record._id}-${idx}`}
                                  className="text-sm cursor-pointer"
                                >
                                  <div className="font-medium flex items-center">
                                    <span>{testName}</span>
                                    {(!isAvailable || test.available === false) && (
                                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                        {t('unavailable') || 'Unavailable'}
                                      </span>
                                    )}
                                  </div>
                                  {test.notes && <div className="text-xs text-gray-600">Notes: {test.notes}</div>}
                                  {test.transactionId && <div className="text-xs text-gray-500">ID: {test.transactionId}</div>}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Notes */}
                    <div className="mt-2 text-sm text-gray-700">{record.details?.notes || ''}</div>
                    
                    {/* Feedback display for partially fulfilled orders */}
                    {(status === 'partially_fulfilled' || status === 'out_of_stock') && (record.details?.feedback || record.feedback) && (
                      <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 p-2 rounded">
                        <span className="font-medium text-amber-700">{t('feedback') || 'Feedback'}:</span> {record.feedback || record.details?.feedback || feedback}
                      </div>
                    )}
                    
                    {/* Show test availability summary in ready_for_pickup state */}
                    {status === 'ready_for_pickup' && labTests.some(test => test.available === false) && (
                      <div className="mt-2 text-sm bg-blue-50 border border-blue-200 p-2 rounded">
                        <span className="font-medium text-blue-700">{t('availabilityInfo') || 'Availability Info'}:</span> {' '}
                        <span className="text-green-600">{t('available') || 'Available'}: </span>
                        {labTests.filter(test => test.available !== false).map(test => test.testName || test.name).join(', ')}
                        {' | '}
                        <span className="text-red-600">{t('unavailable') || 'Unavailable'}: </span>
                        {labTests.filter(test => test.available === false).map(test => test.testName || test.name).join(', ')}
                      </div>
                    )}
                    {/* Status actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canConfirmOrder && (
                        <Button disabled={actionLoading} onClick={() => handleStatusChange(record._id, 'confirmed')} size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" /> {t('confirmOrder')}
                        </Button>
                      )}
                      {canMarkReady && (
                        <Button disabled={actionLoading} onClick={() => handleStatusChange(record._id, 'ready_for_pickup')} size="sm" variant="default">
                          <CheckCircle className="h-4 w-4 mr-1" /> {t('markReadyForPickup')}
                        </Button>
                      )}
                      {isWaitingPatientConfirmation && (
                        <>
                          <div className="text-amber-500 text-sm mt-2 flex items-center">
                            <Clock className="h-4 w-4 mr-1" /> {t('waitingForPatientConfirmation') || 'Waiting for patient confirmation'}
                          </div>
                          {(record.details?.feedback || record.feedback) && (
                            <div className="mt-2 text-sm p-2 bg-amber-50 border border-amber-200 rounded w-full">
                              <strong>{t('unavailableTests') || 'Unavailable tests'}:</strong> {record.details?.feedback || record.feedback}
                            </div>
                          )}
                        </>
                      )}
                      
                      {isPartiallyFulfilled && (
                        <div className="text-blue-500 text-sm mt-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" /> {t('patientConfirmedPartial') || 'Patient confirmed partial fulfillment'}
                        </div>
                      )}
                      {canPartialFulfill && (
                        <>
                          <input
                            type="text"
                            placeholder={t('partialFulfillmentFeedback') || 'Unavailable tests...'}
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            style={{ minWidth: 180 }}
                          />
                          <Button disabled={actionLoading || !feedback.trim()} onClick={() => handleStatusChange(record._id, 'pending_patient_confirmation')} size="sm" variant="outline">
                            <AlertCircle className="h-4 w-4 mr-1" /> {t('requestPatientConfirmation')}
                          </Button>
                        </>
                      )}
                      {canMarkOutOfStock && (
                        <>
                          <input
                            type="text"
                            placeholder={t('outOfStockFeedback') || 'Out of stock tests...'}
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            style={{ minWidth: 180 }}
                          />
                          <Button disabled={actionLoading || !feedback.trim()} onClick={() => handleStatusChange(record._id, 'out_of_stock')} size="sm" variant="destructive">
                            <AlertCircle className="h-4 w-4 mr-1" /> {t('markOutOfStock')}
                          </Button>
                        </>
                      )}
                      {canComplete && (
                        <Button disabled={actionLoading} onClick={() => handleStatusChange(record._id, 'completed')} size="sm" variant="default">
                          <CheckCircle className="h-4 w-4 mr-1" /> {t('markCompleted')}
                        </Button>
                      )}
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

export default LabResults;