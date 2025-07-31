
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { MedicalRecord } from '@/types/medicalRecord';
import { Button } from '@/components/ui/button';

const LabResults: React.FC = () => {
  const { t } = useTranslation();
  const [labRequests, setLabRequests] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingMap, setActionLoadingMap] = useState<{[id: string]: boolean}>({});
  const [feedbackMap, setFeedbackMap] = useState<{[id: string]: string}>({});

  useEffect(() => {
    setLoading(true);
    api.getAssignedRequests()
      .then((data) => {
        setLabRequests(data.filter(r => r.type === 'lab_result'));
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to fetch lab requests');
        setLoading(false);
      });
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoadingMap(prev => ({ ...prev, [id]: true }));
    try {
      const payload: any = { status: newStatus };
      if (['partially_fulfilled', 'out_of_stock'].includes(newStatus)) {
        payload.feedback = feedbackMap[id];
      }
      await api.fulfillAssignedRequest(id, payload);
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
                const canMarkReady = status === 'pending' || status === 'partially_fulfilled';
                const canPartialFulfill = status === 'pending';
                const canOutOfStock = status === 'pending';
                const canComplete = status === 'ready_for_pickup';
                const feedback = feedbackMap[record._id] || '';
                const actionLoading = actionLoadingMap[record._id] || false;
                const setFeedback = (val: string) => setFeedbackMap(prev => ({ ...prev, [record._id]: val }));

                return (
                  <Card key={record._id} className="border p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-lg">{record.title || t('labRequest')}</div>
                        <div className="text-sm text-gray-600">{record.patientId?.firstName} {record.patientId?.lastName}</div>
                        <div className="text-xs text-gray-500">{t('date')}: {new Date(record.date).toLocaleDateString()}</div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {t(status)}
                      </Badge>
                    </div>
                    {/* Lab test details */}
                    {labTests.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-sm mb-1">{t('labTests')}</div>
                        <ul className="list-disc pl-5 text-sm">
                          {labTests.map((test: any, idx: number) => (
                            <li key={idx}>{test.testName || test.name} {test.notes ? `(${test.notes})` : ''}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Notes */}
                    <div className="mt-2 text-sm text-gray-700">{record.details?.notes || ''}</div>
                    {/* Status actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canMarkReady && (
                        <Button disabled={actionLoading} onClick={() => handleStatusChange(record._id, 'ready_for_pickup')} size="sm" variant="default">
                          <CheckCircle className="h-4 w-4 mr-1" /> {t('markReadyForPickup')}
                        </Button>
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
                          <Button disabled={actionLoading || !feedback.trim()} onClick={() => handleStatusChange(record._id, 'partially_fulfilled')} size="sm" variant="outline">
                            <AlertCircle className="h-4 w-4 mr-1" /> {t('markPartiallyFulfilled')}
                          </Button>
                        </>
                      )}
                      {canOutOfStock && (
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