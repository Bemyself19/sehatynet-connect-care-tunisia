import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Package, FileText, ShoppingCart, Users, Clock, CheckCircle, AlertCircle, TrendingUp, Search, X } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { Provider } from '@/types/user';
import api from '@/lib/api';
import { MedicalRecord } from '@/types/medicalRecord';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const PharmacyDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [assignedRequests, setAssignedRequests] = useState<MedicalRecord[]>([]);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [id: string]: string }>({});
  const [tab, setTab] = useState('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'pharmacy') {
      api.getAssignedRequests().then(setAssignedRequests);
    }
  }, [user]);

  // Filter requests by status
  const pendingRequests = assignedRequests.filter(r => r.status === 'pending');
  const readyForPickupRequests = assignedRequests.filter(r => r.status === 'ready_for_pickup');
  const completedRequests = assignedRequests.filter(r => r.status === 'completed');

  // Handler for status transitions
  const handleStatusTransition = async (id: string, nextStatus: string) => {
    setFulfillingId(id);
    setError(null);
    try {
      if ((nextStatus === 'partially_fulfilled' || nextStatus === 'out_of_stock') && !feedback[id]) {
        setError('Please provide feedback specifying unavailable medications.');
        setFulfillingId(null);
        return;
      }
      await api.fulfillAssignedRequest(id, { status: nextStatus, feedback: feedback[id] });
      setAssignedRequests((prev) => prev.map(r => r._id === id ? { ...r, status: nextStatus, details: { ...r.details, feedback: feedback[id] } } : r));
      setFeedback((prev) => ({ ...prev, [id]: '' }));
    } catch (err: any) {
      setError(err.message || 'Failed to update request');
    } finally {
      setFulfillingId(null);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  // Allow rendering even if user is missing or role is not pharmacy
  // This will let the layout debug block show actual state for diagnosis

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('pharmacyDashboard')}</h1>
        <p className="text-gray-600">{t('managePrescriptionsInventory')}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">{t('pendingRequests')}</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{pendingRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+5%</p>
              <p className="text-xs text-gray-500">{t('fromYesterday')}</p>
            </div>
            <Progress value={pendingRequests.length * 10} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">{t('readyForPickup')}</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{readyForPickupRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+12%</p>
              <p className="text-xs text-gray-500">{t('fromYesterday')}</p>
            </div>
            <Progress value={readyForPickupRequests.length * 15} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">{t('completedToday')}</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{completedRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+8%</p>
              <p className="text-xs text-gray-500">{t('fromYesterday')}</p>
            </div>
            <Progress value={completedRequests.length * 8} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">{t('monthlyRevenue')}</CardTitle>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">$3,850</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+15%</p>
              <p className="text-xs text-gray-500">{t('fromLastMonth')}</p>
            </div>
            <Progress value={78} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Assigned Requests Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Pill className="h-5 w-5 text-blue-600" />
                <span>{t('prescriptionRequests')}</span>
              </CardTitle>
              <CardDescription>
                {t('manageAssignedPrescriptionRequestsInventory')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{t('pending')} ({pendingRequests.length})</span>
              </TabsTrigger>
              <TabsTrigger value="ready" className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>{t('ready')} ({readyForPickupRequests.length})</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>{t('completed')} ({completedRequests.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('noPendingRequests')}</p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <Card key={request._id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">
                                {request.patientId?.firstName} {request.patientId?.lastName}
                              </h4>
                              <Badge variant="outline">{request.type}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.title}</p>
                            <p className="text-xs text-gray-500">
                              {t('requested')}: {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleStatusTransition(request._id, 'ready_for_pickup')}
                              disabled={fulfillingId === request._id}
                            >
                              {fulfillingId === request._id ? t('processing') || 'Processing...' : t('markReady')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusTransition(request._id, 'partially_fulfilled')}
                              disabled={fulfillingId === request._id}
                            >
                              {t('partial')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="ready" className="mt-6">
              <div className="space-y-4">
                {readyForPickupRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('noReadyRequests')}</p>
                  </div>
                ) : (
                  readyForPickupRequests.map((request) => (
                    <Card key={request._id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">
                                {request.patientId?.firstName} {request.patientId?.lastName}
                              </h4>
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                {t('readyForPickup')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.title}</p>
                            <p className="text-xs text-gray-500">
                              {t('ready')}: {new Date(request.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleStatusTransition(request._id, 'completed')}
                            disabled={fulfillingId === request._id}
                          >
                            {fulfillingId === request._id ? t('processing') || 'Processing...' : t('markCompleted')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="space-y-4">
                {completedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('noCompletedRequests')}</p>
                  </div>
                ) : (
                  completedRequests.map((request) => (
                    <Card key={request._id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">
                                {request.patientId?.firstName} {request.patientId?.lastName}
                              </h4>
                              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                {t('completed')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.title}</p>
                            <p className="text-xs text-gray-500">
                              {t('completed')}: {new Date(request.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyDashboard;