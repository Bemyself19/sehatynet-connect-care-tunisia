import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Provider } from '@/types/user';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { useProvider } from '@/hooks/useProvider';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, MapPin, BadgePercent, CreditCard, Stethoscope, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { LocationSelector } from '@/components/ui/LocationSelector';

const PharmacyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refetch } = useUser();
  const { t, i18n } = useTranslation();
  const [profileData, setProfileData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { logout } = useAuth();

  // Use current user's ID for "My Profile" view, fallback to URL param for admin views
  const profileId = user?._id || id;
  const { provider, loading, error } = useProvider(profileId, 'pharmacy');

  // Redirect if URL param doesn't match current user (for "My Profile" views)
  useEffect(() => {
    if (user && id && id !== user._id) {
      navigate(`/dashboard/pharmacy/profile`, { replace: true });
    }
  }, [user, id, navigate]);

  const isOwnProfile = user && profileId === user._id;

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
      });
    }
  }, [provider, isOwnProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!profileData) return;
    setIsSaving(true);
    try {
      await api.updateProfile(profileData);
      toast.success(t('profileUpdated') || 'Profile Updated', {
        description: t('profileSavedSuccessfully') || 'Your profile has been saved successfully',
      });
      refetch();
    } catch (error) {
      toast.error(t('updateFailed') || 'Update Failed', {
        description: t('unableToUpdateProfile') || 'Unable to update profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
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
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('myProfile') || 'My Profile'}
            </h1>
            <p className="text-gray-600">
              {t('updatePharmacyInfo') || 'Update your pharmacy information and preferences'}
            </p>
          </div>
        </div>
        {/* Role Badge */}
        <div className="flex items-center space-x-2">
          <Badge className="bg-purple-100 text-purple-800">
            {t('pharmacy') || 'Pharmacy'}
          </Badge>
          {profileData?.specialization && (
            <Badge variant="outline">
              {profileData.specialization}
            </Badge>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="space-y-6">
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
                <Label htmlFor="firstName" className="flex items-center space-x-1">
                  <User className="h-4 w-4 text-gray-600" />
                  <span>{t('firstName') || 'First Name'}</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={profileData?.firstName || ''}
                  onChange={handleChange}
                  required
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="flex items-center space-x-1">
                  <User className="h-4 w-4 text-gray-600" />
                  <span>{t('lastName') || 'Last Name'}</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={profileData?.lastName || ''}
                  onChange={handleChange}
                  required
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                value={profileData?.email || ''}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                  value={profileData?.phone || ''}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="cnamId" className="flex items-center space-x-1">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <span>{t('cnamId') || 'CNAM ID'}</span>
                </Label>
                <Input
                  id="cnamId"
                  name="cnamId"
                  value={profileData?.cnamId || ''}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
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
              <Input
                id="address"
                name="address"
                value={profileData?.address || ''}
                onChange={handleChange}
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialization" className="flex items-center space-x-1">
                  <Stethoscope className="h-4 w-4 text-gray-600" />
                  <span>{t('specialization') || 'Specialization'}</span>
                </Label>
                <Input
                  id="specialization"
                  name="specialization"
                  value={profileData?.specialization || ''}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label htmlFor="licenseNumber" className="flex items-center space-x-1">
                  <BadgePercent className="h-4 w-4 text-gray-600" />
                  <span>{t('licenseNumber') || 'License Number'}</span>
                </Label>
                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  value={profileData?.licenseNumber || ''}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <Link to="/dashboard/pharmacy">
            <Button variant="outline" type="button">
              {t('cancel') || 'Cancel'}
            </Button>
          </Link>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isSaving ? t('saving') || 'Saving...' : t('saveChanges') || 'Save Changes'}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default PharmacyProfile; 