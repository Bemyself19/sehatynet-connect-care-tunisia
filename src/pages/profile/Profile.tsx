import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { Heart, User, Mail, Phone, MapPin, Calendar, ArrowLeft, Save, AlertTriangle, Shield, Activity } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Profile: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user, isLoading: isUserLoading, error: userError, refetch } = useUser();
  const { logout } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with user data
  React.useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: 'phone' in user ? user.phone : '',
        dateOfBirth: 'dateOfBirth' in user ? user.dateOfBirth : '',
        gender: 'gender' in user ? user.gender || '' : '',
        address: 'address' in user ? user.address : '',
        emergencyContactName: 'emergencyContact' in user && user.emergencyContact ? user.emergencyContact.name : '',
        emergencyContactPhone: 'emergencyContact' in user && user.emergencyContact ? user.emergencyContact.phone : '',
        emergencyContactRelationship: 'emergencyContact' in user && user.emergencyContact ? user.emergencyContact.relationship : '',
        medicalHistory: 'medicalHistory' in user && user.medicalHistory ? user.medicalHistory.join(', ') : '',
        allergies: 'allergies' in user && user.allergies ? user.allergies.join(', ') : '',
        currentMedications: 'currentMedications' in user && user.currentMedications ? user.currentMedications.join(', ') : '',
        cnamId: user.cnamId || '',
        specialization: 'specialization' in user ? user.specialization || '' : '',
        licenseNumber: 'licenseNumber' in user ? user.licenseNumber || '' : '',
        role: user.role || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Helper to check if medical info is incomplete
  const isMedicalInfoIncomplete = user && user.role === 'patient' && (
    !(user as any).medicalHistory || (user as any).medicalHistory.length === 0 ||
    !(user as any).allergies || (user as any).allergies.length === 0 ||
    !(user as any).currentMedications || (user as any).currentMedications.length === 0
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const submitData = {
        ...profileData,
        emergencyContact: {
          name: profileData.emergencyContactName,
          phone: profileData.emergencyContactPhone,
          relationship: profileData.emergencyContactRelationship,
        },
        medicalHistory: profileData.medicalHistory ? profileData.medicalHistory.split(',').map((s: string) => s.trim()) : [],
        allergies: profileData.allergies ? profileData.allergies.split(',').map((s: string) => s.trim()) : [],
        currentMedications: profileData.currentMedications ? profileData.currentMedications.split(',').map((s: string) => s.trim()) : [],
      };
      delete submitData.emergencyContactName;
      delete submitData.emergencyContactPhone;
      delete submitData.emergencyContactRelationship;
      // If all fields are filled, reset medicalInfoDismissed to false
      if (
        submitData.medicalHistory.length > 0 &&
        submitData.allergies.length > 0 &&
        submitData.currentMedications.length > 0
      ) {
        submitData.medicalInfoDismissed = false;
      }
      await api.updateProfile(submitData);
      await refetch();
      toast.success('Profile Updated', {
        description: 'Your profile has been saved successfully',
      });
      setTimeout(() => {
        navigate('/dashboard/patient');
      }, 1500);
    } catch (error) {
      toast.error('Update Failed', {
        description: 'Unable to update profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (userError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Link to="/" className="flex items-center group">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg group-hover:scale-105 transition-transform">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-3">
                  SehatyNet+
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {profileData.firstName?.charAt(0)}{profileData.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  {t('welcome') || 'Welcome'}, {profileData.firstName}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                {t('logout') || 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('myProfile') || 'My Profile'}
              </h1>
              <p className="text-gray-600">
                {t('updatePersonalInfo') || 'Update your personal information and preferences'}
              </p>
            </div>
          </div>
          
          {/* Role Badge */}
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-100 text-blue-800">
              {profileData.role?.charAt(0).toUpperCase() + profileData.role?.slice(1)}
            </Badge>
            {profileData.specialization && (
              <Badge variant="outline">
                {profileData.specialization}
              </Badge>
            )}
          </div>
        </div>

        {/* Medical Info Warning */}
        {isMedicalInfoIncomplete && user.role === 'patient' && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">
                    Complete your medical profile
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    For your safety and best care, please provide your allergies, medications, and medical history. 
                    This information is confidential and helps your healthcare providers understand your needs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
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
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center space-x-1">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span>{t('email') || 'Email'}</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleChange}
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="flex items-center space-x-1">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span>{t('phone') || 'Phone'}</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span>{t('dateOfBirth') || 'Date of Birth'}</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">{t('gender') || 'Gender'}</Label>
                  <Select value={profileData.gender} onValueChange={(value) => setProfileData((prev: any) => ({ ...prev, gender: value }))}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cnamId">{t('cnamId') || 'CNAM ID'}</Label>
                  <Input
                    id="cnamId"
                    name="cnamId"
                    value={profileData.cnamId}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <span>{t('address') || 'Address'}</span>
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleChange}
                  rows={3}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-red-600" />
                <span>{t('emergencyContact') || 'Emergency Contact'}</span>
              </CardTitle>
              <CardDescription>
                {t('emergencyContactDescription') || 'Contact information for emergency situations'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="emergencyContactName">{t('contactName') || 'Contact Name'}</Label>
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    value={profileData.emergencyContactName}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone">{t('contactPhone') || 'Contact Phone'}</Label>
                  <Input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    value={profileData.emergencyContactPhone}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactRelationship">{t('relationship') || 'Relationship'}</Label>
                  <Input
                    id="emergencyContactRelationship"
                    name="emergencyContactRelationship"
                    value={profileData.emergencyContactRelationship}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information (for patients) */}
          {user.role === 'patient' && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>{t('medicalInformation') || 'Medical Information'}</span>
                </CardTitle>
                <CardDescription>
                  {t('medicalInformationDescription') || 'Important medical information for your healthcare providers'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="medicalHistory">{t('medicalHistory') || 'Medical History'}</Label>
                  <Textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    value={profileData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Enter your medical history, separated by commas"
                    rows={3}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="allergies">{t('allergies') || 'Allergies'}</Label>
                  <Textarea
                    id="allergies"
                    name="allergies"
                    value={profileData.allergies}
                    onChange={handleChange}
                    placeholder="Enter your allergies, separated by commas"
                    rows={2}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="currentMedications">{t('currentMedications') || 'Current Medications'}</Label>
                  <Textarea
                    id="currentMedications"
                    name="currentMedications"
                    value={profileData.currentMedications}
                    onChange={handleChange}
                    placeholder="Enter your current medications, separated by commas"
                    rows={2}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Professional Information (for providers) */}
          {user.role !== 'patient' && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span>{t('professionalInformation') || 'Professional Information'}</span>
                </CardTitle>
                <CardDescription>
                  {t('professionalInformationDescription') || 'Your professional credentials and specialization'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialization">{t('specialization') || 'Specialization'}</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={profileData.specialization}
                      onChange={handleChange}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseNumber">{t('licenseNumber') || 'License Number'}</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={profileData.licenseNumber}
                      onChange={handleChange}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-2 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Profile</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Profile;
