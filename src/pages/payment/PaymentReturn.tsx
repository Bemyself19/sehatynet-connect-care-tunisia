import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const PaymentReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    const transactionId = searchParams.get('transactionId');
    const responseCode = searchParams.get('responseCode');
    const responseMessage = searchParams.get('responseMessage');
    const signature = searchParams.get('signature');

    if (sessionId && transactionId) {
      // Verify payment with backend
      verifyPayment({
        sessionId,
        transactionId,
        responseCode,
        responseMessage,
        signature
      });
    } else {
      setIsLoading(false);
      toast.error('Paramètres de paiement manquants');
    }
  }, [searchParams]);

  const verifyPayment = async (paymentData: any) => {
    try {
      const response = await fetch('/api/payments/tunisie-monetique/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      setPaymentStatus(result);
      
      if (result.success) {
        toast.success('Paiement effectué avec succès!');
      } else {
        toast.error('Échec du paiement');
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification du paiement');
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
    if (isLoading) return 'Vérification du paiement...';
    if (paymentStatus?.success) return 'Paiement Réussi';
    return 'Échec du Paiement';
  };

  const getStatusDescription = () => {
    if (isLoading) return 'Veuillez patienter pendant que nous vérifions votre paiement.';
    if (paymentStatus?.success) return 'Votre rendez-vous a été confirmé. Vous recevrez un email de confirmation.';
    return paymentStatus?.message || 'Une erreur est survenue lors du traitement du paiement.';
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
        
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            {getStatusDescription()}
          </p>

          {paymentStatus && (
            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Statut:</span>
                <Badge variant={paymentStatus.success ? "default" : "destructive"}>
                  {paymentStatus.status}
                </Badge>
              </div>
              {paymentStatus.paymentId && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ID Paiement:</span>
                  <span className="text-sm font-mono">{paymentStatus.paymentId}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/patient')}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au Tableau de Bord
            </Button>
            {paymentStatus?.success && (
              <Button
                onClick={() => navigate('/appointments')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Mes Rendez-vous
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReturn; 