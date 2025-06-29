import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Heart, User, Stethoscope } from 'lucide-react';
import { RegisterData } from '@/types/user';
import api from '@/lib/api';
import { BrandLogo } from '@/components/ui/logo';

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') || 'patient';
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: userType as any,
    phone: '',
    dateOfBirth: '',
    licenseNumber: '',
    specialization: '',
    address: '',
    cnamId: '',
    gender: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the real backend API
      await api.register(formData);

      toast.success('Registration Successful', {
        description: 'Your account has been created. Please log in to continue.',
      });

      // Redirect to the login page, preserving the user type
      navigate(`/auth/login?type=${userType}`);

    } catch (error) {
      toast.error('Registration Failed', {
        description: 'Unable to create account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const specializations = [
    'General Practitioner',
    'Cardiologist',
    'Dermatologist',
    'Orthopedist',
    'Neurologist',
    'Pediatrician',
    'Gynecologist',
    'Psychiatrist'
  ];

  const providerRoles = [
    'doctor',
    'pharmacy',
    'lab',
    'radiologist'
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Card className="w-full max-w-2xl shadow-xl border-0">
        <CardHeader className="flex flex-col items-center pb-2">
          <BrandLogo size={48} className="mb-4" />
          <CardDescription className="text-lg text-gray-600 mb-2">
            {userType === 'patient'
              ? t('registerAsPatient') || 'Register as Patient'
              : t('registerAsProvider') || 'Register as Provider'}
          </CardDescription>
          <span className="text-gray-500 text-base mb-2">
            {t('registerSubtitle') || 'Create your account to get started.'}
          </span>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t('firstName') || 'First Name'}</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder={t('enterFirstName') || 'Enter First Name'}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t('lastName') || 'Last Name'}</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder={t('enterLastName') || 'Enter Last Name'}
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">{t('email') || 'Email'}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('enterEmail') || 'Enter Email'}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t('password') || 'Password'}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('enterPassword') || 'Enter Password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">{t('phone') || 'Phone'}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t('enterPhone') || 'Enter Phone'}
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cnamId">{t('cnamId') || 'CNAM ID'} {userType === 'patient' && '(Optional)'}</Label>
              <Input
                id="cnamId"
                type="text"
                placeholder={t('enterCnamId') || 'Enter CNAM ID'}
                value={formData.cnamId}
                onChange={(e) => handleInputChange('cnamId', e.target.value)}
                required={userType !== 'patient'}
              />
            </div>
            {userType === 'patient' && (
              <div>
                <Label htmlFor="dateOfBirth">{t('dateOfBirth') || 'Date of Birth'}</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
            )}
            {userType === 'patient' && (
              <div>
                <Label htmlFor="gender">{t('gender') || 'Gender'}</Label>
                <Select onValueChange={(value) => handleInputChange('gender', value)} value={formData.gender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder={t('selectGender') || 'Select Gender'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('male') || 'Male'}</SelectItem>
                    <SelectItem value="female">{t('female') || 'Female'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {userType === 'provider' && (
              <>
                <div>
                  <Label htmlFor="role">{t('yourRole') || 'Your Role'}</Label>
                  <Select onValueChange={(value) => handleInputChange('role', value)} value={formData.role}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder={t('selectYourRole') || 'Select Your Role'} />
                    </SelectTrigger>
                    <SelectContent>
                      {providerRoles.map((role) => (
                        <SelectItem key={role} value={role}>{t(role) || role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="licenseNumber">{t('licenseNumber') || 'License Number'}</Label>
                  <Input
                    id="licenseNumber"
                    type="text"
                    placeholder={t('enterLicenseNumber') || 'Enter License Number'}
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">{t('specialization') || 'Specialization'}</Label>
                  <Select onValueChange={(value) => handleInputChange('specialization', value)} value={formData.specialization}>
                    <SelectTrigger id="specialization">
                      <SelectValue placeholder={t('selectSpecialization') || 'Select Specialization'} />
                    </SelectTrigger>
                    <SelectContent>
                      {specializations.map((spec) => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="address">{t('address') || 'Address'}</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder={t('enterAddress') || 'Enter Address'}
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
              </>
            )}
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? (t('registering') || 'Registering...') : (t('register') || 'Register')}
            </Button>
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">
                {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
                <Link to="/auth/login-selection" className="text-blue-600 hover:text-blue-500 font-medium">
                  {t('signIn') || 'Sign in'}
                </Link>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
