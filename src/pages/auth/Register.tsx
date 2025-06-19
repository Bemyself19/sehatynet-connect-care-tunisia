
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import AuthLayout from '@/components/auth/AuthLayout';
import { RegisterData, UserRole } from '@/types/user';

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const registrationType = searchParams.get('type') as 'patient' | 'provider' || 'patient';
  const defaultRole = registrationType === 'provider' ? 'doctor' : 'patient';
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: defaultRole,
    phone: '',
    dateOfBirth: '',
    licenseNumber: '',
    specialization: '',
    address: '',
    cnamId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRoleChange = (value: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Registration attempt:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t('registrationSuccess') || 'Registration successful',
        description: t('accountCreated') || 'Your account has been created successfully',
      });

      // Redirect to login
      navigate('/auth/login-selection');
    } catch (error) {
      toast({
        title: t('registrationError') || 'Registration failed',
        description: t('registrationErrorDesc') || 'An error occurred during registration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isProvider = registrationType === 'provider';
  const pageTitle = isProvider ? 
    (t('registerAsProvider') || 'Register as Healthcare Provider') : 
    (t('registerAsPatient') || 'Register as Patient');

  return (
    <AuthLayout 
      title={pageTitle} 
      subtitle={t('registerSubtitle') || 'Join the SehatyNet+ community'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">{t('firstName') || 'First Name'}</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder={t('enterFirstName') || 'Enter first name'}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="lastName">{t('lastName') || 'Last Name'}</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              placeholder={t('enterLastName') || 'Enter last name'}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">{t('email') || 'Email'}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder={t('enterEmail') || 'Enter your email'}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">{t('password') || 'Password'}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder={t('enterPassword') || 'Enter your password'}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="cnamId">
            CNAM ID {!isProvider && (t('optional') || '(Optional)')}
          </Label>
          <Input
            id="cnamId"
            name="cnamId"
            type="text"
            required={isProvider}
            value={formData.cnamId}
            onChange={handleChange}
            placeholder={t('enterCnamId') || 'Enter CNAM ID'}
            className="mt-1"
          />
        </div>

        {isProvider && (
          <div>
            <Label htmlFor="role">{t('providerType') || 'Provider Type'}</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('selectProviderType') || 'Select provider type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">{t('doctor') || 'Doctor'}</SelectItem>
                <SelectItem value="pharmacy">{t('pharmacy') || 'Pharmacy'}</SelectItem>
                <SelectItem value="lab">{t('laboratory') || 'Laboratory'}</SelectItem>
                <SelectItem value="radiologist">{t('radiologist') || 'Radiologist'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="phone">{t('phone') || 'Phone Number'}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t('enterPhone') || 'Enter phone number'}
            className="mt-1"
          />
        </div>

        {!isProvider && (
          <div>
            <Label htmlFor="dateOfBirth">{t('dateOfBirth') || 'Date of Birth'}</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        )}

        {isProvider && (
          <>
            <div>
              <Label htmlFor="licenseNumber">{t('licenseNumber') || 'License Number'}</Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                required
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder={t('enterLicenseNumber') || 'Enter license number'}
                className="mt-1"
              />
            </div>

            {formData.role === 'doctor' && (
              <div>
                <Label htmlFor="specialization">{t('specialization') || 'Specialization'}</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  type="text"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder={t('enterSpecialization') || 'Enter specialization'}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="address">{t('address') || 'Business Address'}</Label>
              <Input
                id="address"
                name="address"
                type="text"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder={t('enterAddress') || 'Enter business address'}
                className="mt-1"
              />
            </div>
          </>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (t('creating') || 'Creating...') : (t('createAccount') || 'Create Account')}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
            <Link to="/auth/login-selection" className="text-blue-600 hover:text-blue-500 font-medium">
              {t('signIn') || 'Sign in'}
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
