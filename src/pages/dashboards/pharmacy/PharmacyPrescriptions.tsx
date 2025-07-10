import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PharmacyPrescriptions: React.FC = () => {
  const { t } = useTranslation();

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
          <div className="text-center py-12">
            <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('prescriptionManagement')}</h3>
            <p className="text-gray-500 mb-4">
              {t('detailedPrescriptionManagementFeatures')}
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Clock className="h-3 w-3 mr-1" />
                {t('pending')}: 12
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('ready')}: 8
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <FileText className="h-3 w-3 mr-1" />
                {t('completed')}: 45
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyPrescriptions;