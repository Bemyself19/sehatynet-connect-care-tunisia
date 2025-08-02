
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scan, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { MedicalRecord } from '@/types/medicalRecord';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

const RadiologistReports: React.FC = () => {
  const { t } = useTranslation();
  const [imagingRequests, setImagingRequests] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingMap, setActionLoadingMap] = useState<{[id: string]: boolean}>({});
  const [feedbackMap, setFeedbackMap] = useState<{[id: string]: string}>({});
  const [examAvailability, setExamAvailability] = useState<{[recordId: string]: {[examName: string]: boolean}}>({});
  const location = useLocation();
  const highlightedRecordId = new URLSearchParams(location.search).get('id');
  const highlightedRecordRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    api.getAssignedRequests()
      .then((data) => {
        const imagingRequests = data.filter(r => r.type === 'imaging');
        setImagingRequests(imagingRequests);
        
        // Initialize exam availability and feedback state from fetched data
        const initialAvailability = {};
        const initialFeedback = {};
        
        imagingRequests.forEach(record => {
          if (record.details?.radiology) {
            initialAvailability[record._id] = {};
            record.details.radiology.forEach(exam => {
              // Set availability based on exam status
              if (exam.hasOwnProperty('available')) {
                initialAvailability[record._id][exam.examName || exam.name] = exam.available;
              } else {
                // If no availability info, default to true unless status is 'unavailable'
                initialAvailability[record._id][exam.examName || exam.name] = exam.status !== 'unavailable';
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
        setExamAvailability(prev => ({...prev, ...initialAvailability}));
        setFeedbackMap(prev => ({...prev, ...initialFeedback}));
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to fetch imaging requests');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (highlightedRecordId && highlightedRecordRef.current) {
      console.log('[RadiologistReports] Highlighting record with ID:', highlightedRecordId);
      highlightedRecordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a highlight animation or styling
      highlightedRecordRef.current.classList.add('highlight-animation');
      setTimeout(() => {
        highlightedRecordRef.current?.classList.remove('highlight-animation');
      }, 2000);
    }
  }, [highlightedRecordId, imagingRequests]);

  // Toggle exam availability
  const toggleExamAvailability = (recordId: string, examName: string) => {
    setExamAvailability(prev => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        [examName]: !(prev[recordId]?.[examName] ?? true)
      }
    }));
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoadingMap(prev => ({ ...prev, [id]: true }));
    try {
      const record = imagingRequests.find(r => r._id === id);
      const payload: any = { status: newStatus };
      if (['partially_fulfilled', 'out_of_stock', 'pending_patient_confirmation'].includes(newStatus)) {
        // If it's a partial fulfillment or out of stock, construct a detailed feedback message
        const record = imagingRequests.find(r => r._id === id);
        const recordAvailability = examAvailability[id] || {};
        const exams = record?.details?.radiology || [];
        const unavailableExams = exams
          .filter(exam => !(recordAvailability[exam.examName || exam.name] ?? true))
          .map(exam => exam.examName || exam.name);
        
        if (unavailableExams.length > 0) {
          // Set feedback to either the user-provided feedback or a list of unavailable exams
          payload.feedback = feedbackMap[id] || `${t('unavailableExams') || 'Unavailable exams'}: ${unavailableExams.join(', ')}`;
        } else if (feedbackMap[id]) {
          payload.feedback = feedbackMap[id];
        }
      }
      
      // Include exam availability data
      const recordAvailability = examAvailability[id] || {};
      const exams = record?.details?.radiology || [];
      const examFulfillment = exams.map((exam: any) => ({
        name: exam.examName || exam.name,
        available: recordAvailability[exam.examName || exam.name] ?? true
      }));
      payload.exams = examFulfillment;
      
      await api.fulfillAssignedRequest(id, payload);
      
      // Send notification to patient when order needs patient confirmation for partial fulfillment
      if (newStatus === 'pending_patient_confirmation' && record) {
        const unavailableExams = examFulfillment.filter(exam => !exam.available).map(exam => exam.name);
        const availableExams = examFulfillment.filter(exam => exam.available).map(exam => exam.name);
        const radiology = record.providerId?.firstName && record.providerId?.lastName 
          ? `${record.providerId.firstName} ${record.providerId.lastName}` 
          : 'Radiology';
            
        const notificationData = {
          recipientId: record.patientId,
          type: 'imaging_partial_confirmation',
          title: t('partialImagingConfirmation') || 'Partial Imaging Confirmation Needed',
          message: t('partialImagingConfirmationMessage', { 
            availableExams: availableExams.join(', '),
            unavailableExams: unavailableExams.join(', '),
            radiology
          }) || `Some imaging exams are unavailable at ${radiology}: ${unavailableExams.join(', ')}. Please confirm if you want to proceed with only the available exams: ${availableExams.join(', ')}.`,
          priority: 'high',
          data: {
            imagingId: record._id,
            status: newStatus,
            exams: examFulfillment
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
        const availableExams = examFulfillment.filter(exam => exam.available).map(exam => exam.name);
        const originalDoctor = (record as any).originalDoctor;
        const notificationData = {
          recipientId: record.patientId,
          type: 'imaging_confirmed',
          title: t('imagingConfirmed') || 'Imaging Confirmed',
          message: t('imagingConfirmedMessage', { 
            exams: availableExams.join(', '),
            radiology: originalDoctor?.firstName && originalDoctor?.lastName 
              ? `Dr. ${originalDoctor.firstName} ${originalDoctor.lastName}` 
              : 'radiology'
          }) || `Your imaging has been confirmed. All exams are available: ${availableExams.join(', ')}. Your imaging is being prepared.`,
          priority: 'high',
          data: {
            imagingId: record._id,
            status: newStatus,
            exams: examFulfillment,
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
          type: 'imaging_ready',
          title: t('imagingReady') || 'Imaging Ready',
          message: t('imagingReadyMessage') || `Your imaging results are ready for pickup.`,
          priority: 'high',
          data: {
            imagingId: record._id,
            status: newStatus,
            providerId: record.providerId?._id,
            providerName: record.providerId?.firstName && record.providerId?.lastName 
              ? `Dr. ${record.providerId.firstName} ${record.providerId.lastName}` 
              : 'Radiology'
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
          type: 'imaging_completed',
          title: t('imagingCompleted') || 'Imaging Completed',
          message: t('imagingCompletedMessage') || `Your imaging study has been completed and results are available.`,
          priority: 'high',
          data: {
            imagingId: record._id,
            status: newStatus,
            providerId: record.providerId?._id,
            providerName: record.providerId?.firstName && record.providerId?.lastName 
              ? `Dr. ${record.providerId.firstName} ${record.providerId.lastName}` 
              : 'Radiology'
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
      setImagingRequests(updated.filter(r => r.type === 'imaging'));
      setFeedbackMap(prev => ({ ...prev, [id]: '' }));
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    }
    setActionLoadingMap(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('imagingReports')}</h1>
        <p className="text-gray-600">{t('manageImagingStudiesReports')}</p>
      </div>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>{t('imagingReportsManagement', 'Imaging Reports Management')}</span>
          </CardTitle>
          <CardDescription>
            {t('viewManageAllImagingReports', 'View and manage all radiological imaging reports')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : imagingRequests.length === 0 ? (
            <div className="text-center py-12">{t('noImagingRequests') || 'No imaging requests found.'}</div>
          ) : (
            <div className="space-y-4">
              {imagingRequests.map((record) => {
                const exams = record.details?.radiology || [];
                const status = record.status || 'pending';
                const recordAvailability = examAvailability[record._id] || {};
                
                // Calculate exam availability
                const allExamsAvailable = exams.every((exam: any) => {
                  const examName = exam.examName || exam.name;
                  return recordAvailability[examName] ?? true;
                });
                const someExamsAvailable = exams.some((exam: any) => {
                  const examName = exam.examName || exam.name;
                  return recordAvailability[examName] ?? true;
                });
                const noExamsAvailable = !someExamsAvailable;
                
                const canConfirmOrder = status === 'pending' && allExamsAvailable;
                const canPartialFulfill = status === 'pending' && someExamsAvailable && !allExamsAvailable;
                const canMarkOutOfStock = status === 'pending' && noExamsAvailable;
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
                        <div className="font-semibold text-lg">{record.title || t('imagingRequest')}</div>
                        <div className="text-sm text-gray-600">{record.patientId?.firstName} {record.patientId?.lastName}</div>
                        <div className="text-xs text-gray-500">{t('date')}: {new Date(record.date).toLocaleDateString()}</div>
                        {/* Original prescribing doctor */}
                        {(record as any).originalDoctor && (
                          <div className="text-xs text-blue-600 mt-1">
                            {t('requestedBy')}: Dr. {(record as any).originalDoctor.firstName} {(record as any).originalDoctor.lastName}
                            {(record as any).originalDoctor.specialization && ` (${(record as any).originalDoctor.specialization})`}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {t(status)}
                      </Badge>
                    </div>
                    {/* Exam details with checkboxes */}
                    {exams.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-sm mb-1">{t('exams')}</div>
                        <div className="space-y-1">
                          {exams.map((exam: any, idx: number) => {
                            const examName = exam.examName || exam.name;
                            const isAvailable = examAvailability[record._id]?.[examName] ?? true;
                            return (
                              <div key={idx} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`exam-${record._id}-${idx}`}
                                  checked={isAvailable}
                                  onChange={() => toggleExamAvailability(record._id, examName)}
                                  disabled={['confirmed', 'ready_for_pickup', 'completed', 'partially_fulfilled', 'pending_patient_confirmation'].includes(status)}
                                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                  title={exam.available === false ? 'Exam is unavailable' : ''}
                                />
                                <label 
                                  htmlFor={`exam-${record._id}-${idx}`}
                                  className="text-sm cursor-pointer"
                                >
                                  <div className="font-medium flex items-center">
                                    <span>{examName}</span>
                                    {(!isAvailable || exam.available === false) && (
                                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                        {t('unavailable') || 'Unavailable'}
                                      </span>
                                    )}
                                  </div>
                                  {exam.notes && <div className="text-xs text-gray-600">Notes: {exam.notes}</div>}
                                  {exam.transactionId && <div className="text-xs text-gray-500">ID: {exam.transactionId}</div>}
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
                    
                    {/* Show exam availability summary in ready_for_pickup state */}
                    {status === 'ready_for_pickup' && exams.some(exam => exam.available === false) && (
                      <div className="mt-2 text-sm bg-blue-50 border border-blue-200 p-2 rounded">
                        <span className="font-medium text-blue-700">{t('availabilityInfo') || 'Availability Info'}:</span> {' '}
                        <span className="text-green-600">{t('available') || 'Available'}: </span>
                        {exams.filter(exam => exam.available !== false).map(exam => exam.examName || exam.name).join(', ')}
                        {' | '}
                        <span className="text-red-600">{t('unavailable') || 'Unavailable'}: </span>
                        {exams.filter(exam => exam.available === false).map(exam => exam.examName || exam.name).join(', ')}
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
                              <strong>{t('unavailableExams') || 'Unavailable exams'}:</strong> {record.details?.feedback || record.feedback}
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
                            placeholder={t('partialFulfillmentFeedback') || 'Unavailable exams...'}
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
                            placeholder={t('outOfStockFeedback') || 'Out of stock exams...'}
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

export default RadiologistReports;