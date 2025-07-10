import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, TestTube, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LabCatalog: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('testCatalog')}</h1>
        <p className="text-gray-600">{t('manageLabTestRequestsUploadResults', 'Manage laboratory test catalog and services')}</p>
      </div>

      {/* Catalog Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>{t('testCatalog')}</span>
              </CardTitle>
              <CardDescription>
                {t('manageAssignedLabTestRequestsUploadResults', 'Manage available laboratory tests and services')}
              </CardDescription>
            </div>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>{t('add', 'Add Test')}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('testCatalog')}</h3>
            <p className="text-gray-500 mb-4">
              {t('detailedTestCatalogManagementFeatures', 'This section will contain detailed test catalog management features.')}
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <TestTube className="h-3 w-3 mr-1" />
                {t('availableTests', 'Available Tests')}: 156
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Activity className="h-3 w-3 mr-1" />
                {t('activeServices', 'Active Services')}: 142
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Search className="h-3 w-3 mr-1" />
                {t('categories', 'Categories')}: 12
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LabCatalog;