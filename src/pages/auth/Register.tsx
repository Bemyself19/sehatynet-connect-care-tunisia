
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Heart, User, Stethoscope } from 'lucide-react';
import { RegisterData } from '@/types/user';

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
    cnamId: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Registering user:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created successfully.',
      });

      // Redirect based on user type
      if (userType === 'patient') {
        navigate('/dashboard/patient');
      } else {
        navigate('/dashboard/provider');
      }
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: 'Unable to create account. Please try again.',
        variant: 'destructive',
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

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-green-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">SehatyNet+</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              {userType === 'patient' ? (
                <User className="h-8 w-8 text-blue-600" />
              ) : (
                <Stethoscope className="h-8 w-8 text-green-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {userType === 'patient' 
                ? (t('registerAsPatient') || 'Register as Patient')
                : (t('registerAsProvider') || 'Register as Provider')
              }
            </CardTitle>
            <CardDescription>
              {t('registerSubtitle') || 'Create your account to get started'}
            </CardDescription>
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

              {userType === 'provider' && (
                <>
                  <div>
                    <Label htmlFor="licenseNumber">{t('licenseNumber') || 'License Number'}</Label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      placeholder={t('enterLicenseNumber') || 'Enter License Number'}
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialization">{t('specialization') || 'Specialization'}</Label>
                    <Select 
                      value={formData.specialization} 
                      onValueChange={(value) => handleInputChange('specialization', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectSpecialization') || 'Select Specialization'} />
                      </SelectTrigger>
                      <SelectContent>
                        {specializations.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
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
                      required
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (t('creatingAccount') || 'Creating Account...') : (t('createAccount') || 'Create Account')}
              </Button>
            </form>

            <div className="text-center mt-6">
              <span className="text-sm text-gray-600">
                {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
                <Link to="/auth/login-selection" className="text-blue-600 hover:text-blue-500 font-medium">
                  {t('signIn') || 'Sign In'}
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Register;
