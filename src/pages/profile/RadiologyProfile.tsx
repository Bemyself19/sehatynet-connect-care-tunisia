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
import { MdEmail, MdPhone, MdLocationOn, MdLocalPharmacy, MdBadge, MdCreditCard } from 'react-icons/md';
import { Heart, User, Mail, Phone, MapPin, BadgePercent, CreditCard, Stethoscope } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const RadiologyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refetch } = useUser();
  const { provider, loading, error } = useProvider(id, 'radiologist');
  const isOwnProfile = user && user._id === id;
  const [profileData, setProfileData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { logout } = useAuth();

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

  function isProvider(user: any): user is Provider {
    return (
      user &&
      typeof user === 'object' &&
      'role' in user &&
      ['pharmacy', 'lab', 'radiologist', 'doctor'].includes(user.role) &&
      'firstName' in user &&
      'lastName' in user &&
      'address' in user &&
      'phone' in user &&
      'isActive' in user
    );
  }

  if (loading) return <Skeleton className="w-full h-40" />;
  if (error || !provider) return <div className="text-center text-red-500">{error || 'Radiologist not found'}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">SehatyNet+</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard/radiologist">
                <Button variant="outline" size="sm">Back to Dashboard</Button>
              </Link>
              <span className="text-sm text-gray-600">Welcome, {user?.firstName}</span>
              <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Update your radiology information and preferences</p>
        </div>
        {isOwnProfile && profileData ? (
          <form onSubmit={handleSave} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Radiology Information</span>
                </CardTitle>
                <CardDescription>Your basic radiology details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" value={profileData.firstName} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" value={profileData.lastName} onChange={handleChange} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="flex items-center space-x-1"><Mail className="h-4 w-4" /><span>Email</span></Label>
                  <Input id="email" name="email" type="email" value={profileData.email} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center space-x-1"><Phone className="h-4 w-4" /><span>Phone</span></Label>
                  <Input id="phone" name="phone" value={profileData.phone} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="address" className="flex items-center space-x-1"><MapPin className="h-4 w-4" /><span>Address</span></Label>
                  <Input id="address" name="address" value={profileData.address} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="specialization" className="flex items-center space-x-1"><Stethoscope className="h-4 w-4" /><span>Specialization</span></Label>
                  <Input id="specialization" name="specialization" value={profileData.specialization} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="licenseNumber" className="flex items-center space-x-1"><BadgePercent className="h-4 w-4" /><span>License Number</span></Label>
                  <Input id="licenseNumber" name="licenseNumber" value={profileData.licenseNumber} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="cnamId" className="flex items-center space-x-1"><CreditCard className="h-4 w-4" /><span>CNAM ID</span></Label>
                  <Input id="cnamId" name="cnamId" value={profileData.cnamId || ''} onChange={handleChange} />
                </div>
              </CardContent>
            </Card>
            <div className="flex space-x-4">
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
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
    </div>
  );
};

export default RadiologyProfile; 