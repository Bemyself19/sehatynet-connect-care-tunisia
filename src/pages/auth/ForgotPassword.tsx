import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '@/components/ui/logo';

const ForgotPassword: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success(t('forgotPasswordSuccess') || 'If an account exists for this email, a reset link has been sent.');
    } catch (err: any) {
      setError(t('forgotPasswordError') || 'Something went wrong. Please try again.');
      toast.error(t('forgotPasswordError') || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="flex flex-col items-center pb-2">
          <BrandLogo size={48} className="mb-4" />
          <CardTitle className="text-3xl font-bold text-gray-900 mb-1">SehatyNet+</CardTitle>
          <CardDescription className="text-lg text-gray-600 mb-2">
            {t('forgotPassword') || 'Forgot Password'}
          </CardDescription>
          <span className="text-gray-500 text-base mb-2">
            {t('forgotPasswordSubtitle') || 'Enter your email address and we will send you a link to reset your password.'}
          </span>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center text-green-600 font-medium py-8">
              {t('forgotPasswordSuccess') || 'If an account exists for this email, a reset link has been sent.'}
              <div className="mt-6">
                <Link to="/auth/login" className="text-blue-600 hover:underline">
                  {t('backToLogin') || 'Back to login'}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">{t('email') || 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  className="mt-1"
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('loading') || 'Loading...' : t('sendResetLink') || 'Send Reset Link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword; 