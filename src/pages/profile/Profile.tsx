
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { Heart, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

const Profile: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    address: '123 Main Street, City, State 12345',
    emergencyContact: 'Jane Doe - +1 (555) 987-6543',
    medicalHistory: 'No significant medical history. Allergic to penicillin.',
    cnamId: 'CNAM123456789'
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Profile updated:', profileData);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully',
      });

      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/dashboard/patient');
      }, 1500);

    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Unable to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = '/auth/login-selection';
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">SehatyNet+</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard/patient">
                <Button variant="outline" size="sm">
                  {t('backToDashboard') || 'Back to Dashboard'}
                </Button>
              </Link>
              <span className="text-sm text-gray-600">{t('welcome') || 'Welcome'}, {profileData.firstName}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                {t('logout') || 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('myProfile') || 'My Profile'}
          </h1>
          <p className="text-gray-600">
            {t('updatePersonalInfo') || 'Update your personal information and preferences'}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{t('personalInformation') || 'Personal Information'}</span>
              </CardTitle>
              <CardDescription>
                {t('basicPersonalDetails') || 'Your basic personal details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('firstName') || 'First Name'}</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('lastName') || 'Last Name'}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>{t('email') || 'Email'}</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>{t('phone') || 'Phone Number'}</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="dateOfBirth" className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{t('dateOfBirth') || 'Date of Birth'}</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="cnamId">CNAM ID</Label>
                <Input
                  id="cnamId"
                  name="cnamId"
                  value={profileData.cnamId}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{t('address') || 'Address'}</span>
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('medicalInformation') || 'Medical Information'}</CardTitle>
              <CardDescription>
                {t('healthRelatedInfo') || 'Health-related information and emergency contacts'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emergencyContact">{t('emergencyContact') || 'Emergency Contact'}</Label>
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  value={profileData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Name - Phone Number"
                />
              </div>

              <div>
                <Label htmlFor="medicalHistory">{t('medicalHistory') || 'Medical History'}</Label>
                <Textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  value={profileData.medicalHistory}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Include allergies, chronic conditions, current medications, etc."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
            </Button>
            <Link to="/dashboard/patient">
              <Button type="button" variant="outline">
                {t('cancel') || 'Cancel'}
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Profile;
