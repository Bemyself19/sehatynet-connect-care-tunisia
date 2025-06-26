import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube, FileText, Calendar, Settings, Heart, Activity, Users, Clock, CheckCircle, AlertCircle, TrendingUp, Upload, Search, X } from 'lucide-react';
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
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Progress } from '@/components/ui/progress';

const LabDashboard: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const { data: requests, isLoading: loadingRequests, refetch } = useAssignedRequests();
  const [fulfillId, setFulfillId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Only show lab requests
  const labRequests = (requests || []).filter(r => r.type === 'lab_result');
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);

  // Search/filter state
  const [search, setSearch] = React.useState('');
  const filteredLabRequests = labRequests.filter((record) => {
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
  const [report, setReport] = React.useState({ resultSummary: '', referenceRange: '' });
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
      toast.success('Lab report uploaded and request fulfilled!');
      closeFulfillModal();
      setFiles([]);
      setReport({ resultSummary: '', referenceRange: '' });
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
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'lab') {
    navigate('/login');
    return null;
  }

  const pendingRequests = labRequests.filter(r => r.status === 'pending');
  const completedRequests = labRequests.filter(r => r.status === 'completed');

  const sidebarItems = [
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Profile',
      href: `/profile/lab/${user._id}`
    },
    {
      icon: <TestTube className="h-5 w-5" />,
      label: 'Test Catalog',
      onClick: () => {}
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Reports',
      onClick: () => {}
    }
  ];

  return (
    <DashboardLayout
      title="Laboratory Dashboard"
      subtitle="Manage tests and results"
      user={user}
      sidebarItems={sidebarItems}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Tests</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{pendingRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+8%</p>
              <p className="text-xs text-gray-500">from yesterday</p>
            </div>
            <Progress value={pendingRequests.length * 5} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Completed Today</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{completedRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+12%</p>
              <p className="text-xs text-gray-500">from yesterday</p>
            </div>
            <Progress value={completedRequests.length * 3} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Urgent Tests</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">8</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600 font-medium">+3</p>
              <p className="text-xs text-gray-500">from yesterday</p>
            </div>
            <Progress value={80} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Monthly Revenue</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">$2,850</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+15%</p>
              <p className="text-xs text-gray-500">from last month</p>
            </div>
            <Progress value={75} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Lab Requests Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5 text-blue-600" />
                <span>Lab Test Requests</span>
              </CardTitle>
              <CardDescription>
                Manage assigned lab test requests and upload results
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients or tests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading requests...</p>
            </div>
          ) : filteredLabRequests.length === 0 ? (
            <div className="text-center py-8">
              <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No lab test requests found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLabRequests.map((record) => (
                <Card key={record._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {record.patientId?.firstName?.charAt(0)}{record.patientId?.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {record.patientId?.firstName} {record.patientId?.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {record.title || 'Lab Test Request'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Requested: {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={record.status === 'pending' ? 'secondary' : 'default'}
                          className={record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                        >
                          {record.status === 'pending' ? 'Pending' : 'Completed'}
                        </Badge>
                        {record.status === 'pending' && (
                          <Button
                            onClick={() => openFulfillModal(record)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Results
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {record.details?.description && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{record.details.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Results Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={closeFulfillModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <span>Upload Lab Results</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
              <p className="text-sm text-gray-600">
                {selectedRecord?.patientId?.firstName} {selectedRecord?.patientId?.lastName}
              </p>
              <p className="text-sm text-gray-600">
                Test: {selectedRecord?.title || 'Lab Test'}
              </p>
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Results (PDF or Images)
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  Choose Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Selected Files:</h4>
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="result-summary" className="block text-sm font-medium text-gray-700 mb-2">
                  Result Summary
                </Label>
                <Textarea
                  id="result-summary"
                  value={report.resultSummary}
                  onChange={(e) => setReport(prev => ({ ...prev, resultSummary: e.target.value }))}
                  placeholder="Enter test results summary..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="reference-range" className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Range
                </Label>
                <Textarea
                  id="reference-range"
                  value={report.referenceRange}
                  onChange={(e) => setReport(prev => ({ ...prev, referenceRange: e.target.value }))}
                  placeholder="Enter reference ranges..."
                  rows={4}
                />
              </div>
            </div>

            {/* Feedback */}
            <div>
              <Label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add any additional notes or recommendations..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeFulfillModal}>
              Cancel
            </Button>
            <Button
              onClick={handleFulfill}
              disabled={uploading || files.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? 'Uploading...' : 'Upload Results'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default LabDashboard;
