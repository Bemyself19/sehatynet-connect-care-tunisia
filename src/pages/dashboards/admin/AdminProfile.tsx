import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const AdminProfile: React.FC = () => {
  const { user } = useUser();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        role: user.role || '',
        permissions: (user as any).permissions || []
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      // TODO: Implement profile update API call
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {t('myProfile') || 'My Profile'}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {t('updateAdminInfo') || 'Update your administrative information'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {t('admin') || 'Administrator'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t('personalInformation') || 'Personal Information'}
          </CardTitle>
          <CardDescription>
            {t('updatePersonalDetails') || 'Update your personal details and contact information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('firstName') || 'First Name'}</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('lastName') || 'Last Name'}</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email') || 'Email'}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone') || 'Phone'}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Administrative Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t('administrativeInformation') || 'Administrative Information'}
          </CardTitle>
          <CardDescription>
            {t('adminRoleDetails') || 'Your administrative role and system permissions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="role">{t('role') || 'Role'}</Label>
              <Input
                id="role"
                value={formData.role}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('permissions') || 'Permissions'}</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">User Management</Badge>
                <Badge variant="outline">System Settings</Badge>
                <Badge variant="outline">Audit Logs</Badge>
                <Badge variant="outline">Reports</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                // Reset form data to original values
                if (user) {
                  setFormData({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: (user as any).phone || '',
                    role: user.role || '',
                    permissions: (user as any).permissions || []
                  });
                }
              }}
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave}>
              {t('saveChanges') || 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            {t('editProfile') || 'Edit Profile'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminProfile; 