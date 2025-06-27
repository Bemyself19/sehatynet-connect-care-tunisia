import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { Heart, User, Mail, Phone, MapPin, Calendar, Save, AlertTriangle, Shield, Activity } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import api from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useProvider } from '@/hooks/useProvider';
import { useAuth } from '@/hooks/useAuth';

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refetch } = useUser();
  const { t, currentLanguage } = useLanguage();
  const [profileData, setProfileData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { logout } = useAuth();

  // Use current user's ID for "My Profile" view, fallback to URL param for admin views
  const profileId = user?._id || id;
  const { provider, loading, error } = useProvider(profileId, 'doctor');

  // Redirect if URL param doesn't match current user (for "My Profile" views)
  useEffect(() => {
    if (user && id && id !== user._id) {
      navigate(`/dashboard/doctor/profile`, { replace: true });
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
        specialization: provider.specialization || '',
        licenseNumber: provider.licenseNumber || '',
        cnamId: provider.cnamId || '',
      });
    }
  }, [provider, isOwnProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateProfile(profileData);
      await refetch();
      toast.success('Profile Updated', {
        description: 'Your profile has been saved successfully',
      });
      setTimeout(() => {
        navigate('/dashboard/doctor');
      }, 1500);
    } catch (error) {
      toast.error('Update Failed', {
        description: 'Unable to update profile. Please try again.',
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
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

          {/* Professional Information */}
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
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSaving ? (
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

export default DoctorProfile; 