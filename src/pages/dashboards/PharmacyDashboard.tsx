import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Package, FileText, Settings, Heart, ShoppingCart, Users, Clock, CheckCircle, AlertCircle, TrendingUp, Search, X } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { Provider } from '@/types/user';
import api from '@/lib/api';
import { MedicalRecord } from '@/types/medicalRecord';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const PharmacyDashboard: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const { user, isLoading } = useUser();
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

  if (!user || user.role !== 'pharmacy') {
    navigate('/login');
    return null;
  }

  const sidebarItems = [
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Profile',
      href: `/profile/pharmacy/${user._id}`
    },
    {
      icon: <Pill className="h-5 w-5" />,
      label: 'Inventory',
      onClick: () => {}
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Prescriptions',
      onClick: () => {}
    }
  ];

  return (
    <DashboardLayout
      title="Pharmacy Dashboard"
      subtitle="Manage prescriptions and inventory"
      user={user}
      sidebarItems={sidebarItems}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Pending Requests</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{pendingRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+5%</p>
              <p className="text-xs text-gray-500">from yesterday</p>
            </div>
            <Progress value={pendingRequests.length * 10} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Ready for Pickup</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{readyForPickupRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+12%</p>
              <p className="text-xs text-gray-500">from yesterday</p>
            </div>
            <Progress value={readyForPickupRequests.length * 15} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Completed Today</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{completedRequests.length}</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+8%</p>
              <p className="text-xs text-gray-500">from yesterday</p>
            </div>
            <Progress value={completedRequests.length * 8} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Monthly Revenue</CardTitle>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">$3,850</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+15%</p>
              <p className="text-xs text-gray-500">from last month</p>
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
                <span>Prescription Requests</span>
              </CardTitle>
              <CardDescription>
                Manage assigned prescription requests and inventory
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Pending ({pendingRequests.length})</span>
              </TabsTrigger>
              <TabsTrigger value="ready_for_pickup" className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Ready ({readyForPickupRequests.length})</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Completed ({completedRequests.length})</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-6">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((req) => (
                    <Card key={req._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {req.patientId?.firstName?.charAt(0)}{req.patientId?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {req.patientId?.firstName} {req.patientId?.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Date: {new Date(req.date).toLocaleDateString()}
                              </p>
                              <Badge variant="secondary" className="mt-1">
                                {req.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            ID: {req._id?.slice(-8)}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Medications:</h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <ul className="space-y-1">
                              {(req.details?.medications || []).map((med: any, idx: number) => (
                                <li key={idx} className="text-sm text-gray-700">
                                  • {med.name} ({med.dosage}, {med.frequency}, {med.duration})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-gray-700">Feedback to Patient:</Label>
                          <Textarea
                            className="mt-2"
                            rows={2}
                            value={feedback[req._id] || req.details?.feedback || ''}
                            onChange={e => setFeedback(f => ({ ...f, [req._id]: e.target.value }))}
                            disabled={fulfillingId === req._id}
                            placeholder="Add any notes about medication availability..."
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button
                            onClick={() => handleStatusTransition(req._id, 'ready_for_pickup')}
                            disabled={fulfillingId === req._id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {fulfillingId === req._id ? 'Processing...' : 'Mark as Ready'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleStatusTransition(req._id, 'partially_fulfilled')}
                            disabled={fulfillingId === req._id || !feedback[req._id]}
                          >
                            {fulfillingId === req._id ? 'Processing...' : 'Partial (Shortage)'}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleStatusTransition(req._id, 'out_of_stock')}
                            disabled={fulfillingId === req._id || !feedback[req._id]}
                          >
                            {fulfillingId === req._id ? 'Processing...' : 'Out of Stock'}
                          </Button>
                        </div>
                        
                        {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="ready_for_pickup" className="mt-6">
              {readyForPickupRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No requests ready for pickup.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {readyForPickupRequests.map((req) => (
                    <Card key={req._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-green-100 text-green-600">
                                {req.patientId?.firstName?.charAt(0)}{req.patientId?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {req.patientId?.firstName} {req.patientId?.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Date: {new Date(req.date).toLocaleDateString()}
                              </p>
                              <Badge className="mt-1 bg-green-100 text-green-800">
                                Ready for Pickup
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            ID: {req._id?.slice(-8)}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Medications:</h4>
                          <div className="bg-green-50 rounded-lg p-3">
                            <ul className="space-y-1">
                              {(req.details?.medications || []).map((med: any, idx: number) => (
                                <li key={idx} className="text-sm text-gray-700">
                                  • {med.name} ({med.dosage}, {med.frequency}, {med.duration})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleStatusTransition(req._id, 'completed')}
                            disabled={fulfillingId === req._id}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {fulfillingId === req._id ? 'Processing...' : 'Mark as Completed'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-6">
              {completedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No completed requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedRequests.map((req) => (
                    <Card key={req._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-purple-100 text-purple-600">
                                {req.patientId?.firstName?.charAt(0)}{req.patientId?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {req.patientId?.firstName} {req.patientId?.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Date: {new Date(req.date).toLocaleDateString()}
                              </p>
                              <Badge className="mt-1 bg-purple-100 text-purple-800">
                                Completed
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            ID: {req._id?.slice(-8)}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Medications:</h4>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <ul className="space-y-1">
                              {(req.details?.medications || []).map((med: any, idx: number) => (
                                <li key={idx} className="text-sm text-gray-700">
                                  • {med.name} ({med.dosage}, {med.frequency}, {med.duration})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        {req.details?.feedback && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Notes:</h4>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-700">{req.details.feedback}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PharmacyDashboard;
