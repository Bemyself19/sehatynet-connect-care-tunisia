import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scan, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RadiologistReports: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('imagingReports')}</h1>
        <p className="text-gray-600">{t('manageImagingStudiesReports')}</p>
      </div>

      {/* Reports Content */}
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
          <div className="text-center py-12">
            <Scan className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('imagingReportsManagement', 'Imaging Reports Management')}</h3>
            <p className="text-gray-500 mb-4">
              {t('detailedImagingReportsManagementFeatures', 'This section will contain detailed imaging reports management features.')}
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Clock className="h-3 w-3 mr-1" />
                {t('pending')}: 8
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('completed')}: 67
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                {t('critical', 'Critical')}: 3
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RadiologistReports;