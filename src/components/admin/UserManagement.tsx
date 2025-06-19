
import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Filter, Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const UserManagement: React.FC = () => {
  const [users] = useState<User[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'patient', status: 'active', lastLogin: '2024-01-15' },
    { id: '2', name: 'Dr. Sarah Johnson', email: 'sarah@example.com', role: 'doctor', status: 'active', lastLogin: '2024-01-16' },
    { id: '3', name: 'City Pharmacy', email: 'contact@citypharm.com', role: 'pharmacy', status: 'active', lastLogin: '2024-01-14' },
    { id: '4', name: 'Maria Garcia', email: 'maria@example.com', role: 'patient', status: 'inactive', lastLogin: '2024-01-10' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { t } = useLanguage();
  const { toast } = useToast();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = (action: string, userId: string) => {
    toast({
      title: t('actionCompleted') || 'Action Completed',
      description: `${action} completed for user ${userId}`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          {t('userManagement') || 'User Management'}
        </CardTitle>
        <CardDescription>
          {t('manageSystemUsers') || 'Manage system users and their permissions'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('searchUsers') || 'Search users...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder={t('filterByRole') || 'Filter by role'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allRoles') || 'All Roles'}</SelectItem>
              <SelectItem value="patient">{t('patients') || 'Patients'}</SelectItem>
              <SelectItem value="doctor">{t('doctors') || 'Doctors'}</SelectItem>
              <SelectItem value="pharmacy">{t('pharmacies') || 'Pharmacies'}</SelectItem>
              <SelectItem value="lab">{t('labs') || 'Labs'}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder={t('filterByStatus') || 'Filter by status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses') || 'All Statuses'}</SelectItem>
              <SelectItem value="active">{t('active') || 'Active'}</SelectItem>
              <SelectItem value="inactive">{t('inactive') || 'Inactive'}</SelectItem>
            </SelectContent>
          </Select>

          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('addUser') || 'Add User'}
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name') || 'Name'}</TableHead>
                <TableHead>{t('email') || 'Email'}</TableHead>
                <TableHead>{t('role') || 'Role'}</TableHead>
                <TableHead>{t('status') || 'Status'}</TableHead>
                <TableHead>{t('lastLogin') || 'Last Login'}</TableHead>
                <TableHead>{t('actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="capitalize">{user.role}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('Edit', user.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction(user.status === 'active' ? 'Deactivate' : 'Activate', user.id)}
                      >
                        {user.status === 'active' ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUserAction('Delete', user.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
