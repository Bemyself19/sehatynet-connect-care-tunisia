
import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Shield, DollarSign, Calendar, User } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  description: string;
  onSuccess?: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, description, onSuccess }) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    paymentMethod: 'card'
  });

  const { t } = useLanguage();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handlePayment = () => {
    // Simulate payment processing
    toast({
      title: t('paymentProcessing') || 'Processing Payment',
      description: t('pleaseWait') || 'Please wait while we process your payment...'
    });

    setTimeout(() => {
      toast({
        title: t('paymentSuccessful') || 'Payment Successful',
        description: t('paymentCompleted') || 'Your payment has been completed successfully'
      });
      onSuccess?.();
    }, 2000);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          {t('paymentDetails') || 'Payment Details'}
        </CardTitle>
        <CardDescription>
          {description} - ${amount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="paymentMethod">{t('paymentMethod') || 'Payment Method'}</Label>
          <Select value={paymentData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('creditCard') || 'Credit Card'}
                </div>
              </SelectItem>
              <SelectItem value="insurance">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  {t('insurance') || 'Insurance'}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentData.paymentMethod === 'card' && (
          <>
            <div>
              <Label htmlFor="cardholderName">{t('cardholderName') || 'Cardholder Name'}</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={paymentData.cardholderName}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">{t('cardNumber') || 'Card Number'}</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">{t('expiryDate') || 'Expiry Date'}</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cvv">{t('cvv') || 'CVV'}</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </>
        )}

        {paymentData.paymentMethod === 'insurance' && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {t('insuranceMessage') || 'Your insurance will be billed directly. No additional payment required.'}
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{t('subtotal') || 'Subtotal'}:</span>
            <span className="text-sm">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{t('processingFee') || 'Processing Fee'}:</span>
            <span className="text-sm">$2.50</span>
          </div>
          <div className="flex justify-between items-center font-semibold">
            <span>{t('total') || 'Total'}:</span>
            <span>${(amount + 2.50).toFixed(2)}</span>
          </div>
        </div>

        <Button onClick={handlePayment} className="w-full" size="lg">
          <DollarSign className="h-4 w-4 mr-2" />
          {t('processPayment') || 'Process Payment'}
        </Button>

        <div className="flex items-center justify-center text-xs text-gray-500 mt-4">
          <Shield className="h-3 w-3 mr-1" />
          {t('securePayment') || 'Secure payment powered by 256-bit SSL encryption'}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
