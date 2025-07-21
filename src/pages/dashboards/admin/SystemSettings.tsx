import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const defaultSettings = {
  siteName: '',
  contactEmail: '',
  timezone: '',
  language: '',
  twoFactorAuth: false,
  sessionTimeout: false,
  passwordPolicy: false,
  emailNotifications: false,
  smsNotifications: false,
  inAppNotifications: false,
  backupFrequency: '',
  retentionPeriod: '',
  automaticBackups: false,
  paymentsEnabled: false,
};

const SystemSettings: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        console.log('Fetching system settings...');
        const data = await api.getSystemSettings();
        console.log('Received system settings:', data);
        console.log('Payments enabled from API:', data.paymentsEnabled);
        
        // Merge with defaults but give priority to received values
        const mergedSettings = { ...defaultSettings, ...data };
        console.log('Merged settings:', mergedSettings);
        console.log('Final paymentsEnabled value:', mergedSettings.paymentsEnabled);
        
        setSettings(mergedSettings);
      } catch (err) {
        console.error('Error loading system settings:', err);
        toast.error('Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: any) => {
    console.log(`Changing setting ${key} to:`, value);
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure boolean values are properly typed
      const updatedSettings = { ...settings };
      if ('paymentsEnabled' in updatedSettings) {
        updatedSettings.paymentsEnabled = Boolean(updatedSettings.paymentsEnabled);
      }
      
      console.log('Saving settings:', updatedSettings);
      const result = await api.updateSystemSettings(updatedSettings);
      console.log('Settings update result:', result);
      
      // Verify the settings were saved by fetching them again
      const refreshedSettings = await api.getSystemSettings();
      console.log('Refreshed settings after save:', refreshedSettings);
      setSettings({ ...defaultSettings, ...refreshedSettings });
      
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">{t('loadingSettings') || 'Loading settings...'}</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('systemSettings') || 'System Settings'}</h1>
          <p className="text-gray-600">{t('configureSystemParameters') || 'Configure system parameters and preferences'}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              setLoading(true);
              try {
                const data = await api.getSystemSettings();
                console.log('Refreshed settings:', data);
                setSettings({ ...defaultSettings, ...data });
                toast.success(t('settingsRefreshed') || 'Settings refreshed');
              } catch (err) {
                toast.error(t('failedToRefreshSettings') || 'Failed to refresh settings');
              } finally {
                setLoading(false);
              }
            }}
          >
            {t('refreshSettings') || 'Refresh Settings'}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>{t('generalSettings') || 'General Settings'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="siteName">{t('siteName') || 'Site Name'}</Label>
              <Input id="siteName" value={settings.siteName} onChange={e => handleChange('siteName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">{t('contactEmail') || 'Contact Email'}</Label>
              <Input id="contactEmail" type="email" value={settings.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t('timezone') || 'Timezone'}</Label>
              <Input id="timezone" value={settings.timezone} onChange={e => handleChange('timezone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t('defaultLanguage') || 'Default Language'}</Label>
              <Input id="language" value={settings.language} onChange={e => handleChange('language', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div>
              <h3 className="font-medium">{t('enablePayments') || 'Enable Payments'}</h3>
              <p className="text-sm text-gray-500">{t('paymentDescription') || 'Require payment for services. If disabled, all services are free.'}</p>
              <p className="text-xs text-blue-600 mt-1">
                {settings.paymentsEnabled ? (t('paymentFeaturesEnabled') || 'Payment features are currently enabled') : (t('paymentFeaturesDisabled') || 'Payment features are currently disabled')}
              </p>
            </div>
            <Switch 
              checked={Boolean(settings.paymentsEnabled)} 
              onCheckedChange={v => {
                console.log(`Toggling payments to: ${v}`);
                handleChange('paymentsEnabled', Boolean(v));
              }} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('securitySettings') || 'Security Settings'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t('twoFactorAuth') || 'Two-Factor Authentication'}</h3>
              <p className="text-sm text-gray-500">{t('require2FA') || 'Require 2FA for all users'}</p>
            </div>
            <Switch checked={settings.twoFactorAuth} onCheckedChange={v => handleChange('twoFactorAuth', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t('sessionTimeout') || 'Session Timeout'}</h3>
              <p className="text-sm text-gray-500">{t('autoLogout') || 'Auto-logout after inactivity'}</p>
            </div>
            <Switch checked={settings.sessionTimeout} onCheckedChange={v => handleChange('sessionTimeout', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t('passwordPolicy') || 'Password Policy'}</h3>
              <p className="text-sm text-gray-500">{t('enforceStrongPasswords') || 'Enforce strong passwords'}</p>
            </div>
            <Switch checked={settings.passwordPolicy} onCheckedChange={v => handleChange('passwordPolicy', v)} />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('notificationSettings') || 'Notification Settings'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t('emailNotifications') || 'Email Notifications'}</h3>
              <p className="text-sm text-gray-500">{t('emailAlerts') || 'Send email alerts for system events'}</p>
            </div>
            <Switch checked={settings.emailNotifications} onCheckedChange={v => handleChange('emailNotifications', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t('smsNotifications') || 'SMS Notifications'}</h3>
              <p className="text-sm text-gray-500">{t('smsAlerts') || 'Send SMS alerts for critical events'}</p>
            </div>
            <Switch checked={settings.smsNotifications} onCheckedChange={v => handleChange('smsNotifications', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t('inAppNotifications') || 'In-App Notifications'}</h3>
              <p className="text-sm text-gray-500">{t('inAppAlerts') || 'Show notifications within the application'}</p>
            </div>
            <Switch checked={settings.inAppNotifications} onCheckedChange={v => handleChange('inAppNotifications', v)} />
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('backupMaintenance') || 'Backup & Maintenance'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="backupFrequency">{t('backupFrequency') || 'Backup Frequency'}</Label>
              <Input id="backupFrequency" value={settings.backupFrequency} onChange={e => handleChange('backupFrequency', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retentionPeriod">{t('retentionPeriod') || 'Retention Period'}</Label>
              <Input id="retentionPeriod" value={settings.retentionPeriod} onChange={e => handleChange('retentionPeriod', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t('automaticBackups') || 'Automatic Backups'}</h3>
              <p className="text-sm text-gray-500">{t('scheduleBackups') || 'Schedule automatic system backups'}</p>
            </div>
            <Switch checked={settings.automaticBackups} onCheckedChange={v => handleChange('automaticBackups', v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings; 