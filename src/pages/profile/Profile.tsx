import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Heart, User, Mail, Phone, MapPin, Calendar, ArrowLeft, Save, AlertTriangle, Shield, Activity } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LocationSelector } from '@/components/ui/LocationSelector';
import { Switch } from '@/components/ui/switch';

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  // Debug log for i18n translation output
  console.log('DEBUG i18n:', {
    updateAdminInfo: t('updateAdminInfo'),
    myProfile: t('myProfile'),
    personalInformation: t('personalInformation'),
    updatePersonalDetails: t('updatePersonalDetails'),
  });
  const navigate = useNavigate();
  const { user, isLoading: isUserLoading, error: userError, refetch } = useUser();
  const { logout } = useAuth();

  // Helper function to get translated specialty name
  const getTranslatedSpecialtyName = (specialtyName: string) => {
    return t(`specialties.${specialtyName}`) || specialtyName;
  };

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);

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
        country: 'country' in user ? user.country || '' : '',
        province: 'province' in user ? user.province || '' : '',
        city: 'city' in user ? user.city || '' : '',
        emergencyContactName: 'emergencyContact' in user && user.emergencyContact ? user.emergencyContact.name : '',
        emergencyContactPhone: 'emergencyContact' in user && user.emergencyContact ? user.emergencyContact.phone : '',
        emergencyContactRelationship: 'emergencyContact' in user && user.emergencyContact ? user.emergencyContact.relationship : '',
        medicalHistory: 'medicalHistory' in user && user.medicalHistory ? user.medicalHistory.join(', ') : '',
        allergies: 'allergies' in user && user.allergies ? user.allergies.join(', ') : '',
        currentMedications: 'currentMedications' in user && user.currentMedications ? user.currentMedications.join(', ') : '',
        nationalId: user.nationalId || '',
        cnamId: user.cnamId || '',
        specialization: 'specialization' in user ? user.specialization || '' : '',
        licenseNumber: 'licenseNumber' in user ? user.licenseNumber || '' : '',
        role: user.role || '',
        allowOtherDoctorsAccess: 'allowOtherDoctorsAccess' in user ? user.allowOtherDoctorsAccess || false : false,
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
      delete submitData.allowOtherDoctorsAccess; // Handle consent separately
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
      toast.success(t('profileUpdated') || 'Profile Updated', {
        description: t('profileSavedSuccessfully') || 'Your profile has been saved successfully',
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMsg = error?.message || '';
      if (errorMsg.includes('National ID is already in use')) {
        toast.error(t('duplicateNationalId') || 'Duplicate National ID', {
          description: t('duplicateNationalIdDescription') || 'This National ID is already in use by another account.',
        });
      } else {
        toast.error(t('updateFailed') || 'Update Failed', {
          description: t('profileUpdateFailed') || 'Failed to update profile. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsentToggle = async (checked: boolean) => {
    setConsentLoading(true);
    try {
      await api.updateMedicalRecordConsent(checked);
      await refetch();
      setProfileData((prev: any) => ({
        ...prev,
        allowOtherDoctorsAccess: checked
      }));
      toast.success(t('consentUpdated') || 'Consent Updated', {
        description: checked 
          ? (t('consentGrantedMessage') || 'Other doctors can now view your medical records during consultations')
          : (t('consentRevokedMessage') || 'Your medical records are now private to your treating doctors only')
      });
    } catch (error) {
      console.error('Consent update error:', error);
      toast.error(t('updateFailed') || 'Update Failed', {
        description: t('consentUpdateFailed') || 'Failed to update consent settings. Please try again.',
      });
    } finally {
      setConsentLoading(false);
    }
  };

  if (isUserLoading || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingProfile') || 'Loading profile...'}</p>
        </div>
      </div>
    );
  }
  
  if (userError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{t('failedToLoadProfile') || 'Failed to load profile.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
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
                {getTranslatedSpecialtyName(profileData.specialization)}
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
                    {t('completeMedicalProfile') || 'Complete your medical profile'}
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    {t('medicalProfileWarning') || 'For your safety and best care, please provide your allergies, medications, and medical history. This information is confidential and helps your healthcare providers understand your needs.'}
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
                    placeholder={t('enterFirstName') || 'Enter your first name'}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('lastName') || 'Last Name'}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleChange}
                    placeholder={t('enterLastName') || 'Enter your last name'}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">{t('email') || 'Email'}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleChange}
                    placeholder={t('enterEmail') || 'Enter your email'}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t('phone') || 'Phone'}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    placeholder={t('enterPhone') || 'Enter your phone number'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nationalId">{t('nationalId') || 'National ID'}</Label>
                  <Input
                    id="nationalId"
                    name="nationalId"
                    value={profileData.nationalId}
                    onChange={handleChange}
                    placeholder={t('enterNationalId') || 'Enter your National ID'}
                    pattern="[0-9]{8}"
                    maxLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('nationalIdHelp') || 'Tunisian National ID Card (8 digits only)'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="cnamId">{t('cnamId') || 'CNAM ID'}</Label>
                  <Input
                    id="cnamId"
                    name="cnamId"
                    value={profileData.cnamId}
                    onChange={handleChange}
                    placeholder={t('enterCnamId') || 'Enter your CNAM ID'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">{t('dateOfBirth') || 'Date of Birth'}</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">{t('gender') || 'Gender'}</Label>
                  <Select name="gender" value={profileData.gender} onValueChange={(value) => setProfileData((prev: any) => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectGender') || 'Select gender'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('male') || 'Male'}</SelectItem>
                      <SelectItem value="female">{t('female') || 'Female'}</SelectItem>
                      <SelectItem value="other">{t('other') || 'Other'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <LocationSelector
                selectedCountry={profileData?.country}
                selectedProvince={profileData?.province}
                selectedCity={profileData?.city}
                onCountryChange={(countryCode) => setProfileData(prev => ({ ...prev, country: countryCode }))}
                onProvinceChange={(provinceCode) => setProfileData(prev => ({ ...prev, province: provinceCode }))}
                onCityChange={(cityCode) => setProfileData(prev => ({ ...prev, city: cityCode }))}
                disabled={isLoading}
              />

              <div>
                <Label htmlFor="address">{t('address') || 'Address'}</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleChange}
                  placeholder={t('enterAddress') || 'Enter your address'}
                  rows={3}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContactName">{t('contactName') || 'Contact Name'}</Label>
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    value={profileData.emergencyContactName}
                    onChange={handleChange}
                    placeholder={t('enterContactName') || 'Enter contact name'}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone">{t('contactPhone') || 'Contact Phone'}</Label>
                  <Input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    value={profileData.emergencyContactPhone}
                    onChange={handleChange}
                    placeholder={t('enterContactPhone') || 'Enter contact phone'}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="emergencyContactRelationship">{t('relationship') || 'Relationship'}</Label>
                <Input
                  id="emergencyContactRelationship"
                  name="emergencyContactRelationship"
                  value={profileData.emergencyContactRelationship}
                  onChange={handleChange}
                  placeholder={t('enterRelationship') || 'e.g., Spouse, Parent, Friend'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Information - Only for patients */}
          {user.role === 'patient' && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-green-600" />
                  <span>{t('medicalInformation') || 'Medical Information'}</span>
                </CardTitle>
                <CardDescription>
                  {t('medicalInfoDescription') || 'To provide you with the best care, we ask a few questions about your medical background. This information is confidential and helps your healthcare providers understand your needs and keep you safe.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="allergies">{t('allergiesQuestion') || 'Do you have any known allergies?'}</Label>
                  <Textarea
                    id="allergies"
                    name="allergies"
                    value={profileData.allergies}
                    onChange={handleChange}
                    placeholder={t('allergiesPlaceholder') || 'List allergies separated by commas (e.g. penicillin, peanuts)'}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="currentMedications">{t('medicationsQuestion') || 'Are you currently taking any medications?'}</Label>
                  <Textarea
                    id="currentMedications"
                    name="currentMedications"
                    value={profileData.currentMedications}
                    onChange={handleChange}
                    placeholder={t('medicationsPlaceholder') || 'List medications separated by commas (e.g. aspirin, insulin)'}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="medicalHistory">{t('conditionsQuestion') || 'Do you have any chronic medical conditions or past major illnesses?'}</Label>
                  <Textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    value={profileData.medicalHistory}
                    onChange={handleChange}
                    placeholder={t('conditionsPlaceholder') || 'List conditions separated by commas (e.g. diabetes, asthma, hypertension)'}
                    rows={2}
                  />
                </div>

                {/* Medical Records Privacy Consent */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <Label className="font-semibold text-blue-900">
                          {t('medicalRecordsAccess') || 'Medical Records Access'}
                        </Label>
                      </div>
                      <p className="text-sm text-blue-700 mb-3">
                        {t('medicalRecordsAccessDescription') || 'Allow other doctors to view your medical records and notes during consultations. When disabled, only the doctors you directly consult with can see your records.'}
                      </p>
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="allowOtherDoctorsAccess"
                          checked={profileData?.allowOtherDoctorsAccess || false}
                          onCheckedChange={handleConsentToggle}
                          disabled={consentLoading}
                        />
                        <Label htmlFor="allowOtherDoctorsAccess" className="text-sm font-medium text-blue-900">
                          {profileData?.allowOtherDoctorsAccess 
                            ? (t('accessGranted') || 'Access granted to other doctors')
                            : (t('accessRestricted') || 'Access restricted to treating doctors only')
                          }
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Professional Information - Only for providers */}
          {user.role !== 'patient' && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span>{t('professionalInformation') || 'Professional Information'}</span>
                </CardTitle>
                <CardDescription>
                  {t('professionalInfoDescription') || 'Your professional credentials and specializations'}
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
                      placeholder={t('enterSpecialization') || 'Enter your specialization'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseNumber">{t('licenseNumber') || 'License Number'}</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={profileData.licenseNumber}
                      onChange={handleChange}
                      placeholder={t('enterLicenseNumber') || 'Enter your license number'}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cnamId">{t('cnamId') || 'CNAM ID'}</Label>
                  <Input
                    id="cnamId"
                    name="cnamId"
                    value={profileData.cnamId}
                    onChange={handleChange}
                    placeholder={t('enterCnamId') || 'Enter your CNAM ID'}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save & Delete Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6">
            <Link to="/dashboard/patient">
              <Button variant="outline" type="button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('cancel') || 'Cancel'}
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? t('saving') || 'Saving...' : t('saveChanges') || 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="border border-red-600 text-red-600 hover:bg-red-50"
              onClick={async () => {
                if (window.confirm(t('deleteAccountConfirm') || 'Are you sure you want to delete your account? This action cannot be undone.')) {
                  try {
                    await api.deleteOwnAccount();
                    toast.success(t('accountDeleted') || 'Account deleted successfully.');
                    logout();
                    navigate('/');
                  } catch (err) {
                    toast.error(t('deleteAccountError') || 'Failed to delete account. Please try again.');
                  }
                }
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t('deleteAccount') || 'Delete Account'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Profile;
