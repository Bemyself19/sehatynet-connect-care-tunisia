import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scan, FileText, Calendar, Monitor, Users, Clock, CheckCircle, AlertCircle, TrendingUp, Upload, Search, X } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { Provider } from '@/types/user';
import { useAssignedRequests } from '@/hooks/useAssignedRequests';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';

const RadiologistDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: requests, isLoading: loadingRequests, refetch } = useAssignedRequests();
  const [fulfillId, setFulfillId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Only show imaging requests
  const imagingRequests = (requests || []).filter(r => r.type === 'imaging');
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);

  // Search/filter state
  const [search, setSearch] = React.useState('');
  const filteredImagingRequests = imagingRequests.filter((record) => {
    const patientName = `${record.patientId?.firstName || ''} ${record.patientId?.lastName || ''}`.toLowerCase();
    const title = (record.title || '').toLowerCase();
    return (
      patientName.includes(search.toLowerCase()) ||
      title.includes(search.toLowerCase())
    );
  });

  // File upload and report state
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [report, setReport] = React.useState({ impression: '', findings: '' });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // File validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f =>
      f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    setFiles(prev => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const openFulfillModal = (record: any) => {
    setSelectedRecord(record);
    setFeedback('');
    setFulfillId(record._id);
  };
  const closeFulfillModal = () => {
    setSelectedRecord(null);
    setFeedback('');
    setFulfillId(null);
  };
  const handleFulfill = async () => {
    if (!fulfillId) return;
    setUploading(true);
    try {
      await api.uploadLabRadiologyReport(
        fulfillId,
        files,
        { ...report, feedback },
        'completed'
      );
      toast.success('Imaging report uploaded and request fulfilled!');
      closeFulfillModal();
      setFiles([]);
      setReport({ impression: '', findings: '' });
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingDashboard') || 'Loading dashboard...'}</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'radiologist') {
    logout();
    return null;
  }

  const pendingRequests = imagingRequests.filter(r => r.status === 'pending');
  const completedRequests = imagingRequests.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('radiologyDashboard') || 'Radiology Dashboard'}</h1>
        <p className="text-gray-600">{t('manageImagingStudiesReports') || 'Manage imaging studies and reports'}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">{t('pendingScans') || 'Pending Scans'}</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{pendingRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+5%</p>
              <p className="text-xs text-gray-500">{t('fromYesterday') || 'from yesterday'}</p>
            </div>
            <Progress value={pendingRequests.length * 8} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">{t('completedToday') || 'Completed Today'}</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{completedRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+18%</p>
              <p className="text-xs text-gray-500">{t('fromYesterday') || 'from yesterday'}</p>
            </div>
            <Progress value={completedRequests.length * 4} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">{t('urgentReports') || 'Urgent Reports'}</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">3</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600 font-medium">+1</p>
              <p className="text-xs text-gray-500">{t('fromYesterday') || 'from yesterday'}</p>
            </div>
            <Progress value={60} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">{t('totalStudies') || 'Total Studies'}</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Scan className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{imagingRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+12%</p>
              <p className="text-xs text-gray-500">{t('fromYesterday') || 'from yesterday'}</p>
            </div>
            <Progress value={imagingRequests.length * 3} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Imaging Requests Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Scan className="h-5 w-5 text-blue-600" />
                <span>{t('imagingRequests') || 'Imaging Requests'}</span>
              </CardTitle>
              <CardDescription>
                {t('manageAssignedImagingRequestsUploadReports') || 'Manage assigned imaging requests and upload reports'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('searchRequests') || 'Search requests...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredImagingRequests.length === 0 ? (
              <div className="text-center py-12">
                <Scan className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noImagingRequests') || 'No Imaging Requests'}</h3>
                <p className="text-gray-500">{t('noImagingRequestsFound') || 'No imaging requests found.'}</p>
              </div>
            ) : (
              filteredImagingRequests.map((request) => (
                <Card key={request._id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">
                            {request.patientId?.firstName} {request.patientId?.lastName}
                          </h4>
                          <Badge variant="outline">{request.type}</Badge>
                          <Badge 
                            variant={request.status === 'pending' ? 'default' : 'secondary'}
                            className={request.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.title}</p>
                        <p className="text-xs text-gray-500">
                          {t('requested') || 'Requested'}: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {request.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => openFulfillModal(request)}
                          disabled={fulfillId === request._id}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {t('uploadReport') || 'Upload Report'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Report Modal */}
      <Dialog open={!!fulfillId} onOpenChange={() => closeFulfillModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('uploadImagingReport') || 'Upload Imaging Report'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('impression') || 'Impression'}</Label>
              <Textarea
                value={report.impression}
                onChange={(e) => setReport(prev => ({ ...prev, impression: e.target.value }))}
                placeholder={t('enterRadiologicalImpression') || 'Enter radiological impression...'}
                rows={3}
              />
            </div>
            <div>
              <Label>{t('findings') || 'Findings'}</Label>
              <Textarea
                value={report.findings}
                onChange={(e) => setReport(prev => ({ ...prev, findings: e.target.value }))}
                placeholder={t('enterDetailedFindings') || 'Enter detailed findings...'}
                rows={3}
              />
            </div>
            <div>
              <Label>{t('additionalFeedback') || 'Additional Feedback'}</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('anyAdditionalNotes') || 'Any additional notes...'}
                rows={2}
              />
            </div>
            <div>
              <Label>{t('uploadFiles') || 'Upload Files'}</Label>
              <Input
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              {files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeFulfillModal}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleFulfill} disabled={uploading}>
              {uploading ? t('uploading') || 'Uploading...' : t('uploadReport') || 'Upload Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RadiologistDashboard; 