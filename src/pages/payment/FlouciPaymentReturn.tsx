import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

const FlouciPaymentReturn: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const paymentId = searchParams.get('paymentId');

    if (paymentId) {
      // Verify payment with backend
      verifyPayment(paymentId);
    } else {
      setIsLoading(false);
      toast.error(t('missingPaymentParameters') || 'Missing payment parameters');
    }
  }, [searchParams, t]);

  const verifyPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/flouci/verify/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      setPaymentStatus(result);
      
      if (result.success) {
        toast.success(t('paymentCompletedSuccessfully') || 'Payment completed successfully');
      } else {
        toast.error(t('paymentFailed') || 'Payment failed');
      }
    } catch (error) {
      toast.error(t('paymentVerificationError') || 'Error verifying payment');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return <Clock className="h-12 w-12 text-yellow-500" />;
    if (paymentStatus?.success) return <CheckCircle className="h-12 w-12 text-green-500" />;
    return <XCircle className="h-12 w-12 text-red-500" />;
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-yellow-50 border-yellow-200';
    if (paymentStatus?.success) return 'bg-green-50 border-green-200';
    return 'bg-red-50 border-red-200';
  };

  const getStatusText = () => {
    if (isLoading) return t('verifyingPayment') || 'Verifying Payment';
    if (paymentStatus?.success) return t('paymentSuccessful') || 'Payment Successful';
    return t('paymentFailed') || 'Payment Failed';
  };

  const getStatusDescription = () => {
    if (isLoading) return t('pleaseWaitWhileVerifyingPayment') || 'Please wait while we verify your payment';
    if (paymentStatus?.success) return t('appointmentConfirmedEmailSent') || 'Your appointment has been confirmed and a confirmation email has been sent';
    return paymentStatus?.message || t('errorOccurredDuringPaymentProcessing') || 'An error occurred during payment processing';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md border-2 ${getStatusColor()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-xl font-bold">
            {getStatusText()}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            {getStatusDescription()}
          </p>
          
          <Button 
            variant="outline" 
            className="mx-auto flex items-center gap-2"
            onClick={() => navigate('/appointments')}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToAppointments') || 'Back to Appointments'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlouciPaymentReturn;
