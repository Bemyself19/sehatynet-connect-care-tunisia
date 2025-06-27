import React, { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import TeleExpertiseModal from '@/components/patient/TeleExpertiseModal';
import { MessageSquare, ArrowLeft, Plus, Clock, CheckCircle, AlertCircle, Download, User } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TeleExpertiseRequestsPage: React.FC = () => {
  const { user, isLoading } = useUser();
  const { logout } = useAuth();
  const [teleExpertiseRequests, setTeleExpertiseRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { currentLanguage, t } = useLanguage();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.getTeleExpertiseRequests()
      .then((data) => {
        const patientRequests = data.filter((req: any) => req.patientId && req.patientId._id === user._id);
        setTeleExpertiseRequests(patientRequests);
      })
      .catch(() => {/* Optionally handle error */})
      .finally(() => setLoading(false));
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    logout();
    return null;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tele-Expertise Requests
              </h1>
              <p className="text-lg text-gray-600">
                Request a second opinion and view your ongoing requests
              </p>
            </div>
            <Button 
              className="mt-4 sm:mt-0 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              onClick={() => setShowModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Tele-Expertise Request
            </Button>
          </div>
        </div>

        {/* Tele-Expertise Modal */}
        <TeleExpertiseModal 
          isOpen={showModal} 
          onClose={() => {
            setShowModal(false);
            setLoading(true);
            api.getTeleExpertiseRequests()
              .then((data) => {
                const patientRequests = data.filter((req: any) => req.patientId && req.patientId._id === user._id);
                setTeleExpertiseRequests(patientRequests);
              })
              .catch(() => {/* Optionally handle error */})
              .finally(() => setLoading(false));
          }} 
        />

        {/* Requests List */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              <span>Your Tele-Expertise Requests</span>
            </CardTitle>
            <CardDescription>
              Track the status of your tele-expertise requests and access expert opinions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading tele-expertise requests...</p>
                </div>
              </div>
            ) : teleExpertiseRequests.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tele-expertise requests yet</h3>
                <p className="text-gray-600 mb-4">
                  Get a second opinion from our network of specialists
                </p>
                <Button 
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Request
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {teleExpertiseRequests.map((req) => (
                  <Card key={req._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {getStatusIcon(req.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {req.specialty}
                              </h3>
                              {getStatusBadge(req.status)}
                            </div>
                            <p className="text-gray-600 mb-3">
                              {req.details}
                            </p>
                            <div className="text-sm text-gray-500">
                              Requested: {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Doctor Assignment */}
                      {req.doctorId && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Assigned Specialist: Dr. {req.doctorId.firstName} {req.doctorId.lastName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {req.doctorId.specialty || 'Specialist'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Doctor Response */}
                      {req.response && (
                        <div className="mb-4 p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Expert Opinion:</h4>
                          <p className="text-sm text-gray-700">{req.response}</p>
                        </div>
                      )}

                      {/* Patient File */}
                      {req.patientFileUrl && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Your Submitted File</h4>
                            <p className="text-sm text-gray-600">This is the file you provided for the expert's review.</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`${BACKEND_URL}${req.patientFileUrl}`, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            View/Download File
                          </Button>
                        </div>
                      )}

                      {/* Expert Report */}
                      {req.reportUrl && (
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-green-900 mb-1">Expert Report</h4>
                            <p className="text-sm text-green-700">Download the detailed medical report from the expert</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`${BACKEND_URL}${req.reportUrl}`, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Expert Report
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TeleExpertiseRequestsPage; 