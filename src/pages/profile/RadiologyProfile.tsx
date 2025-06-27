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
import { useLanguage } from '@/hooks/useLanguage';
import { User, Mail, Phone, MapPin, BadgePercent, CreditCard, Stethoscope, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

const RadiologyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refetch } = useUser();
  const { t, currentLanguage } = useLanguage();
  const [profileData, setProfileData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { logout } = useAuth();

  // Use current user's ID for "My Profile" view, fallback to URL param for admin views
  const profileId = user?._id || id;
  const { provider, loading, error } = useProvider(profileId, 'radiologist');

  // Redirect if URL param doesn't match current user (for "My Profile" views)
  useEffect(() => {
    if (user && id && id !== user._id) {
      navigate(`/dashboard/radiologist/profile`, { replace: true });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateProfile(profileData);
      await refetch();
      toast.success('Profile Updated', { description: 'Your profile has been saved successfully' });
      setTimeout(() => { navigate('/dashboard/radiologist'); }, 1500);
    } catch (error) {
      toast.error('Update Failed', { description: 'Unable to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Radiologist not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('myProfile') || 'My Profile'}
            </h1>
            <p className="text-gray-600">
              {t('updateRadiologyInfo') || 'Update your radiology information and preferences'}
            </p>
          </div>
        </div>
        {/* Role Badge */}
        <div className="flex items-center space-x-2">
          <Badge className="bg-indigo-100 text-indigo-800">
            Radiology
          </Badge>
          {profileData?.specialization && (
            <Badge variant="outline">
              {profileData.specialization}
            </Badge>
          )}
        </div>
      </div>

      {isOwnProfile && profileData ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Radiology Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-indigo-600" />
                <span>{t('radiologyInformation') || 'Radiology Information'}</span>
              </CardTitle>
              <CardDescription>
                {t('basicRadiologyDetails') || 'Your basic radiology details'}
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
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <Label htmlFor="cnamId" className="flex items-center space-x-1">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                    <span>CNAM ID</span>
                  </Label>
                  <Input
                    id="cnamId"
                    name="cnamId"
                    value={profileData.cnamId}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
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
                    value={profileData.specialization}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                    value={profileData.licenseNumber}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex space-x-4">
            <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link to="/dashboard/radiologist"><Button type="button" variant="outline">Cancel</Button></Link>
          </div>
        </form>
      ) : error || !provider ? (
        <div className="text-center text-red-500">{error || 'Radiologist not found'}</div>
      ) : (
        <Card className="max-w-lg mx-auto mt-8">
          <CardHeader>
            <CardTitle>{(provider as Provider).firstName} {(provider as Provider).lastName}</CardTitle>
            <CardDescription>Radiology</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><strong>Address:</strong> {(provider as Provider).address}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><strong>Phone:</strong> {(provider as Provider).phone}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><strong>Email:</strong> {(provider as Provider).email}</div>
              <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /><strong>Specialization:</strong> {(provider as Provider).specialization || '-'}</div>
              <div className="flex items-center gap-2"><BadgePercent className="h-4 w-4" /><strong>License Number:</strong> {(provider as Provider).licenseNumber || '-'}</div>
              {(provider as Provider).cnamId && (
                <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /><strong>CNAM ID:</strong> {(provider as Provider).cnamId}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
};

export default RadiologyProfile; 