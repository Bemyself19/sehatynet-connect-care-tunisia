import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
  const { id: selectedPrescriptionId } = useParams<{ id?: string }>();
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    setLoading(true);
    api.getAssignedRequests()
      .then((data) => {
        setAssignedRequests(data);
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
    if (selectedPrescriptionId && itemRefs.current[selectedPrescriptionId]) {
      itemRefs.current[selectedPrescriptionId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [dedupedRequests, selectedPrescriptionId]);

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
                const canMarkReady = status === 'pending' || status === 'partially_fulfilled';
                const canPartialFulfill = status === 'pending';
                const canOutOfStock = status === 'pending';
                const canComplete = status === 'ready_for_pickup';
                const canCancel = ['pending', 'ready_for_pickup', 'partially_fulfilled', 'out_of_stock'].includes(status);

                // Per-record state
                const feedback = feedbackMap[record._id] || '';
                const actionLoading = actionLoadingMap[record._id] || false;
                const setFeedback = (val: string) => setFeedbackMap(prev => ({ ...prev, [record._id]: val }));
                const setActionLoading = (val: boolean) => setActionLoadingMap(prev => ({ ...prev, [record._id]: val }));
                const handleStatusChange = async (newStatus: string) => {
                  setActionLoading(true);
                  try {
                    // For ready_for_pickup, clear feedback
                    const payload: any = { status: newStatus };
                    if (['partially_fulfilled', 'out_of_stock'].includes(newStatus)) {
                      payload.feedback = feedback;
                    }
                    await api.fulfillAssignedRequest(record._id, payload);
                    // Refetch assigned requests after action
                    const updated = await api.getAssignedRequests();
                    setAssignedRequests(updated);
                    setFeedback('');
                  } catch (err: any) {
                    alert(err?.message || 'Failed to update status');
                  }
                  setActionLoading(false);
                };

                const pid = record.prescriptionId || record.details?.prescriptionId;
                const isSelected = pid === selectedPrescriptionId;
                return (
                  <Card
                    key={record._id}
                    ref={el => {
                      if (pid) itemRefs.current[pid] = el;
                    }}
                    className={`border p-4 ${isSelected ? 'border-2 border-blue-600 bg-blue-50' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-lg">{record.title || t('prescription')}</div>
                        <div className="text-sm text-gray-600">{record.patientId?.firstName} {record.patientId?.lastName}</div>
                        <div className="text-xs text-gray-500">{t('date')}: {new Date(record.date).toLocaleDateString()}</div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {t(status)}
                      </Badge>
                    </div>
                    {/* Medication details */}
                    {medications.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-sm mb-1">{t('medications')}</div>
                        <ul className="list-disc pl-5 text-sm">
                          {medications.map((med: any, idx: number) => (
                            <li key={idx}>{med.name} {med.dosage ? `(${med.dosage})` : ''}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Notes */}
                    <div className="mt-2 text-sm text-gray-700">{record.details?.notes || ''}</div>
                    {/* Status actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canMarkReady && (
                        <Button disabled={actionLoading} onClick={() => handleStatusChange('ready_for_pickup')} size="sm" variant="default">
                          <CheckCircle className="h-4 w-4 mr-1" /> {t('markReadyForPickup')}
                        </Button>
                      )}
                      {canPartialFulfill && (
                        <>
                          <input
                            type="text"
                            placeholder={t('partialFulfillmentFeedback') || 'Unavailable medications...'}
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            style={{ minWidth: 180 }}
                          />
                          <Button disabled={actionLoading || !feedback.trim()} onClick={() => handleStatusChange('partially_fulfilled')} size="sm" variant="outline">
                            <AlertCircle className="h-4 w-4 mr-1" /> {t('markPartiallyFulfilled')}
                          </Button>
                        </>
                      )}
                      {canOutOfStock && (
                        <>
                          <input
                            type="text"
                            placeholder={t('outOfStockFeedback') || 'Out of stock medications...'}
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            style={{ minWidth: 180 }}
                          />
                          <Button disabled={actionLoading || !feedback.trim()} onClick={() => handleStatusChange('out_of_stock')} size="sm" variant="destructive">
                            <AlertCircle className="h-4 w-4 mr-1" /> {t('markOutOfStock')}
                          </Button>
                        </>
                      )}
                      {canComplete && (
                        <Button disabled={actionLoading} onClick={() => handleStatusChange('completed')} size="sm" variant="default">
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

export default PharmacyPrescriptions;