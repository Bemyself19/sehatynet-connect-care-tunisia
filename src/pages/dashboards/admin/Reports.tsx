import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, TrendingUp, Users, Calendar, Activity } from 'lucide-react';
import { toast } from 'sonner';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/reports/overview', {
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` }
    })
      .then(res => res.json())
      .then(data => setOverview(data))
      .catch(() => toast.error('Failed to load report stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reportsAnalytics')}</h1>
          <p className="text-gray-600">{t('generateSystemReports')}</p>
        </div>
        <Button variant="outline" onClick={() => toast.info(t('exportComingSoon'))}>
          <Download className="h-4 w-4 mr-2" />
          {t('exportLogs')}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : overview?.totalUsers ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> {t('fromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeProviders')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : overview?.activeProviders ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('currentlyOnline')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('appointmentsToday')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : overview?.appointmentsToday ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> {t('fromYesterday')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('systemUptime')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : (overview?.systemUptime ? `${overview.systemUptime}%` : '-')}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('last30Days')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>{t('userReports')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {t('userReportsDesc')}
            </p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                {t('userRegistrationReport')}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                {t('userActivityReport')}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                {t('roleDistributionReport')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <span>{t('appointmentReports')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {t('appointmentReportsDesc')}
            </p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                {t('appointmentVolumeReport')}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                {t('providerPerformanceReport')}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                {t('cancellationReport')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span>{t('systemReports')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {t('systemReportsDesc')}
            </p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                {t('systemPerformanceReport')}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                {t('errorLogReport')}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                {t('securityAuditReport')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentReports')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">{t('userRegistrationReport')}</h3>
                  <p className="text-sm text-gray-500">{t('generatedAgo', { time: '2', unit: t('hours') })}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('download')}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">{t('appointmentVolumeReport')}</h3>
                  <p className="text-sm text-gray-500">{t('generatedAgo', { time: '1', unit: t('day') })}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('download')}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">{t('systemPerformanceReport')}</h3>
                  <p className="text-sm text-gray-500">{t('generatedAgo', { time: '3', unit: t('days') })}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('download')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports; 