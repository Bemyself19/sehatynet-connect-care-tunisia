import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, User, Pill } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Prescription } from '@/types/prescription';
import { useTranslation } from 'react-i18next';

interface PrescriptionListProps {
  userId?: string;
  userRole?: string;
}

export function PrescriptionList({ userId, userRole }: PrescriptionListProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const data = await api.getPrescriptions();
      setPrescriptions(data);
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      toast.error(t('failedToLoadPrescriptions') || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'filled':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div>{t('loadingPrescriptions') || 'Loading prescriptions...'}</div>;
  }

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noPrescriptionsFound') || 'No prescriptions found'}</h3>
          <p className="text-gray-500 text-center">
            {userRole === 'patient' 
              ? t('noPrescriptionsYet') || "You don't have any prescriptions yet."
              : t('noPrescriptionsCreatedYet') || "No prescriptions have been created yet."
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('prescriptions') || 'Prescriptions'} ({prescriptions.length})</h2>
      
      {prescriptions.map((prescription) => (
        <Card key={prescription._id}>
          <CardHeader>
            <CardTitle>{t('prescription') || 'Prescription'} #{prescription.prescriptionId}</CardTitle>
            <CardDescription>
              {t('createdOn') || 'Created on'} {new Date(prescription.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>{t('status') || 'Status'}:</strong> {prescription.status}
              </div>
              <div>
                <strong>{t('medications') || 'Medications'}:</strong> {prescription.medications.length}
              </div>
              {prescription.notes && (
                <div>
                  <strong>{t('notes') || 'Notes'}:</strong> {prescription.notes}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 