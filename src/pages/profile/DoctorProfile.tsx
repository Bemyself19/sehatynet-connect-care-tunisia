import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Heart, User, Mail, Phone, MapPin, Calendar, Save, AlertTriangle, Shield, Activity, CreditCard } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useProvider } from '@/hooks/useProvider';
import { useAuth } from '@/hooks/useAuth';
import { LocationSelector } from '@/components/ui/LocationSelector';

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refetch } = useUser();
  const { t, i18n } = useTranslation();
  const [profileData, setProfileData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { logout } = useAuth();
  const [specialties, setSpecialties] = useState<any[]>([]);

  // Helper function to get translated specialty name
  const getTranslatedSpecialtyName = (specialtyName: string) => {
    return t(`specialties.${specialtyName}`) || specialtyName;
  };

  // Use /users/me for own profile, not /users/:id
  const isOwnProfile = !id || (user && id === user._id);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    if (isOwnProfile) {
      api.getProfile()
        .then((data) => {
          setProvider(data);
          setError(null);
        })
        .catch(() => setError('Profile not found'))
        .finally(() => setLoading(false));
    } else if (id) {
      api.getUserById(id)
        .then((data) => {
          setProvider(data);
          setError(null);
        })
        .catch(() => setError('Profile not found'))
        .finally(() => setLoading(false));
    }
  }, [id, user, isOwnProfile]);

  // Redirect if URL param doesn't match current user (for "My Profile" views)
  useEffect(() => {
    if (user && id && id !== user._id) {
      navigate(`/dashboard/doctor/profile`, { replace: true });
    }
  }, [user, id, navigate]);

  // Removed duplicate isOwnProfile/profileId

  useEffect(() => {
    if (provider && isOwnProfile) {
      setProfileData({
        firstName: provider.firstName || '',
        lastName: provider.lastName || '',
        email: provider.email || '',
        phone: provider.phone || '',
        address: provider.address || '',
        country: provider.country || '',
        province: provider.province || '',
        city: provider.city || '',
        specialization: provider.specialization || '',
        licenseNumber: provider.licenseNumber || '',
        cnamId: provider.cnamId || '',
        // Keep legacy field for backwards compatibility
        consultationFee: provider.consultationFee || '',
        localConsultationFee: provider.localConsultationFee || provider.consultationFee || '',
        internationalConsultationFee: provider.internationalConsultationFee || '',
        workingHours: {
          start: provider.workingHours?.start || '09:00',
          end: provider.workingHours?.end || '17:00',
        },
      });
    }
  }, [provider, isOwnProfile]);

  useEffect(() => {
    api.getSpecialties().then((data) => {
      setSpecialties(data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('workingHours.')) {
      const key = name.split('.')[1];
      setProfileData((prev: any) => ({
        ...prev,
        workingHours: {
          ...prev.workingHours,
          [key]: value
        }
      }));
    } else {
      setProfileData((prev: any) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateProfile(profileData);
      await refetch();
      toast.success(t('profileUpdated') || 'Profile Updated', {
        description: t('profileSavedSuccessfully') || 'Your profile has been saved successfully',
      });
      setTimeout(() => {
        navigate('/dashboard/doctor');
      }, 1500);
    } catch (error) {
      toast.error(t('updateFailed') || 'Update Failed', {
        description: t('unableToUpdateProfile') || 'Unable to update profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingProfile') || 'Loading profile...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
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

              <div>
                <Label htmlFor="phone" className="flex items-center space-x-1">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span>{t('phone') || 'Phone'}</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <LocationSelector
                selectedCountry={profileData?.country}
                selectedProvince={profileData?.province}
                selectedCity={profileData?.city}
                onCountryChange={(countryCode) => setProfileData(prev => ({ ...prev, country: countryCode }))}
                onProvinceChange={(provinceCode) => setProfileData(prev => ({ ...prev, province: provinceCode }))}
                onCityChange={(cityCode) => setProfileData(prev => ({ ...prev, city: cityCode }))}
                disabled={isSaving}
              />

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

          {/* Professional Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>{t('professionalInformation') || 'Professional Information'}</span>
              </CardTitle>
              <CardDescription>
                {t('professionalInfoDescription') || 'Your professional credentials and specializations'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="specialization">{t('specialization') || 'Specialization'}</Label>
                <Select
                  value={profileData.specialization}
                  onValueChange={(value) => setProfileData((prev: any) => ({ ...prev, specialization: value }))}
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder={t('selectSpecialization') || 'Select Specialization'} />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty.name} value={specialty.name}>
                        {getTranslatedSpecialtyName(specialty.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label className="flex items-center space-x-1 mb-2">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <span>{t('consultationFees') || 'Consultation Fees'}</span>
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="localConsultationFee">{t('localConsultationFee') || 'Local Fee (TND)'}</Label>
                    <Input
                      id="localConsultationFee"
                      name="localConsultationFee"
                      type="number"
                      value={profileData.localConsultationFee}
                      onChange={handleChange}
                      placeholder={t('enterLocalConsultationFee') || 'Enter local fee in TND'}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('localConsultationFeeDescription') || 'Fee for local patients (in Tunisian Dinars)'}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="internationalConsultationFee">{t('internationalConsultationFee') || 'International Fee'}</Label>
                    <Input
                      id="internationalConsultationFee"
                      name="internationalConsultationFee"
                      type="number"
                      value={profileData.internationalConsultationFee}
                      onChange={handleChange}
                      placeholder={t('enterInternationalConsultationFee') || 'Enter international fee'}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('internationalConsultationFeeDescription') || 'Fee for international patients (in USD)'}
                    </p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">
                  {t('consultationFeeDescription') || 'These fees will be displayed to patients when they search for doctors (only if payments are enabled in system settings).'}
                </p>
                
                {/* Hidden field to maintain backwards compatibility */}
                <input 
                  type="hidden" 
                  name="consultationFee" 
                  value={profileData.localConsultationFee} 
                />
              </div>

              {/* Working Hours */}
              <div>
                <Label className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span>{t('workingHours') || 'Working Hours'}</span>
                </Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="workingHours.start">{t('startTime') || 'Start Time'}</Label>
                    <Input
                      id="workingHours.start"
                      name="workingHours.start"
                      type="time"
                      value={profileData.workingHours.start}
                      onChange={handleChange}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workingHours.end">{t('endTime') || 'End Time'}</Label>
                    <Input
                      id="workingHours.end"
                      name="workingHours.end"
                      type="time"
                      value={profileData.workingHours.end}
                      onChange={handleChange}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('saving') || 'Saving...'}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{t('saveChanges') || 'Save Changes'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default DoctorProfile;