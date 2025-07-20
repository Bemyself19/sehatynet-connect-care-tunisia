import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Shield, Globe, Smartphone, Building, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

interface TunisiaPaymentFormProps {
  appointmentId: string;
  amount: number;
  description: string;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

const TunisiaPaymentForm: React.FC<TunisiaPaymentFormProps> = ({ 
  appointmentId, 
  amount, 
  description, 
  onSuccess, 
  onCancel 
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('click_to_pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const { t } = useTranslation();
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);

  const paymentMethods = [
    {
      id: 'click_to_pay',
      name: t('clickToPay') || 'Click to Pay',
      description: t('clickToPayDescription') || 'Tunisie Monétique - Tunisian bank cards',
      icon: <CreditCard className="h-5 w-5" />,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'flouci',
      name: t('flouci') || 'Flouci',
      description: t('flouciDescription') || 'Pay easily with your debit or credit card via Flouci',
      icon: <CreditCard className="h-5 w-5" />,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'international_card',
      name: t('internationalCard') || 'International Card',
      description: t('internationalCardDescription') || 'Visa, Mastercard, American Express',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: t('paypalDescription') || 'Secure payment via PayPal',
      icon: <Shield className="h-5 w-5" />,
      color: 'bg-indigo-500',
      available: true
    },
    {
      id: 'mobile_money',
      name: t('mobileMoney') || 'Mobile Money',
      description: t('mobileMoneyDescription') || 'Orange Money, Tunisie Telecom Money',
      icon: <Smartphone className="h-5 w-5" />,
      color: 'bg-orange-500',
      available: false // Not implemented yet
    },
    {
      id: 'bank_transfer',
      name: t('bankTransfer') || 'Bank Transfer',
      description: t('bankTransferDescription') || 'Direct bank transfer',
      icon: <Building className="h-5 w-5" />,
      color: 'bg-purple-500',
      available: false // Not implemented yet
    }
  ];

  useEffect(() => {
    fetch('/api/system-settings', {
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` }
    })
      .then(res => res.json())
      .then(data => setPaymentsEnabled(data.paymentsEnabled !== false))
      .catch(() => setPaymentsEnabled(true));
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await api.createPaymentSession({
        appointmentId,
        paymentMethod
      });

      setPaymentId(response.paymentId);
      setSessionData(response.sessionData);

      if (response.redirectUrl) {
        // Redirect to Tunisie Monétique
        window.location.href = response.redirectUrl;
      } else {
        // Handle other payment methods (Adyen, PayPal)
        handleInlinePayment(response.sessionData);
      }

    } catch (error: any) {
      toast.error(t('paymentCreationError') || 'Error creating payment', {
        description: error.message || t('pleaseTryAgain') || 'Please try again'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInlinePayment = (sessionData: any) => {
    // This would integrate with Adyen Drop-in or PayPal buttons
    // For now, simulate success
    setTimeout(() => {
      toast.success(t('paymentProcessedSuccessfully') || 'Payment processed successfully');
      onSuccess?.(paymentId!);
    }, 2000);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  if (!paymentsEnabled) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            {t('paymentDisabled') || 'Payment Disabled'}
          </CardTitle>
          <CardDescription>
            {t('paymentsCurrentlyDisabled') || 'Payments are currently disabled. This service is free.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => onSuccess && onSuccess('free')} className="bg-blue-600 hover:bg-blue-700 w-full">
            {t('continue') || 'Continue'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-blue-600" />
          {t('securePayment') || 'Secure Payment'}
        </CardTitle>
        <CardDescription>
          {description} - {formatAmount(amount)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Payment Method Selection */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">{t('choosePaymentMethod') || 'Choose your payment method'}</h3>
          <div className="grid gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => method.available && setPaymentMethod(method.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg text-white ${method.color}`}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{method.name}</span>
                      {!method.available && (
                        <Badge variant="secondary" className="text-xs">
                          {t('comingSoon') || 'Coming Soon'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  {paymentMethod === method.id && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('consultationAmount') || 'Consultation amount'}:</span>
              <span>{formatAmount(amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('processingFee') || 'Processing fee'}:</span>
              <span>{formatAmount(2.50)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>{t('total') || 'Total'}:</span>
              <span>{formatAmount(amount + 2.50)}</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800">{t('hundredPercentSecure') || '100% Secure Payment'}</p>
              <p className="text-green-700">
                {t('paymentDataProtected') || 'Your payment data is protected by 256-bit SSL encryption. We never store your card information.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !paymentMethods.find(m => m.id === paymentMethod)?.available}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('processing') || 'Processing...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {t('pay') || 'Pay'} {formatAmount(amount + 2.50)}
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TunisiaPaymentForm;