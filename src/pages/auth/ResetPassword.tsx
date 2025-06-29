import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/ui/logo';

const ResetPassword: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError(t('invalidResetToken') || 'Invalid or expired reset token.');
      toast.error(t('invalidResetToken') || 'Invalid or expired reset token.');
      return;
    }
    if (password.length < 6) {
      setError(t('passwordTooShort') || 'Password must be at least 6 characters.');
      toast.error(t('passwordTooShort') || 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match.');
      toast.error(t('passwordsDoNotMatch') || 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      setSubmitted(true);
      toast.success(t('resetPasswordSuccess') || 'Your password has been reset. Redirecting to login...');
      setTimeout(() => navigate('/auth/login'), 2500);
    } catch (err: any) {
      setError(t('resetPasswordError') || 'Something went wrong. Please try again.');
      toast.error(t('resetPasswordError') || 'Something went wrong. Please try again.');
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
            {t('resetPassword') || 'Reset Password'}
          </CardDescription>
          <span className="text-gray-500 text-base mb-2">
            {t('resetPasswordSubtitle') || 'Enter your new password below.'}
          </span>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center text-green-600 font-medium py-8">
              {t('resetPasswordSuccess') || 'Your password has been reset. Redirecting to login...'}
              <div className="mt-6">
                <Link to="/auth/login" className="text-blue-600 hover:underline">
                  {t('backToLogin') || 'Back to login'}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="password">{t('newPassword') || 'New Password'}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('enterNewPassword') || 'Enter new password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm">{t('confirmPassword') || 'Confirm Password'}</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder={t('confirmNewPassword') || 'Confirm new password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (t('resetting') || 'Resetting...') : (t('resetPassword') || 'Reset Password')}
              </Button>
              <div className="text-center mt-4">
                <Link to="/auth/login" className="text-blue-600 hover:underline">
                  {t('backToLogin') || 'Back to login'}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword; 