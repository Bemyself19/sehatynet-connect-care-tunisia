import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Search, Filter, Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import api from '@/lib/api';
import Modal from '@/components/ui/modal';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editUser, setEditUser] = useState<any | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const { t } = useLanguage();
  const { t: tI18n } = useTranslation();

  useEffect(() => {
    setLoading(true);
    api.getAllUsers()
      .then((data) => setUsers(data))
      .catch(() => toast.error('Failed to fetch users'))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.firstName + ' ' + user.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (user.isActive ? 'active' : 'inactive') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = (action: string, userId: string) => {
    toast.success(t('actionCompleted') || 'Action Completed', {
      description: `${action} completed for user ${userId}`
    });
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.deleteUser(userId);
      setUsers(users => users.filter(u => u._id !== userId));
      toast.success('User deleted');
      setDeleteUserId(null);
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    try {
      await api.updateUserStatus(user._id, { isActive: !user.isActive });
      setUsers(users => users.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleEditUser = (user: any) => {
    setEditUser(user);
  };

  const handleEditUserSave = async (updated: any) => {
    try {
      // You may want to implement an api.updateUser method for full edit support
      // For now, just update locally
      setUsers(users => users.map(u => u._id === updated._id ? { ...u, ...updated } : u));
      setEditUser(null);
      toast.success('User updated (local only)');
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">{tI18n('loadingUsers') || 'Loading users...'}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          {tI18n('userManagement') || t('userManagement') || 'User Management'}
        </CardTitle>
        <CardDescription>
          {tI18n('manageSystemUsers') || t('manageSystemUsers') || 'Manage system users and their permissions'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={tI18n('searchUsers') || t('searchUsers') || 'Search users...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder={tI18n('filterByRole') || t('filterByRole') || 'Filter by role'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tI18n('allRoles') || t('allRoles') || 'All Roles'}</SelectItem>
              <SelectItem value="patient">{tI18n('patients') || t('patients') || 'Patients'}</SelectItem>
              <SelectItem value="doctor">{tI18n('doctors') || t('doctors') || 'Doctors'}</SelectItem>
              <SelectItem value="pharmacy">{tI18n('pharmacies') || t('pharmacies') || 'Pharmacies'}</SelectItem>
              <SelectItem value="lab">{tI18n('labs') || t('labs') || 'Labs'}</SelectItem>
              <SelectItem value="radiologist">{tI18n('radiologists') || t('radiologists') || 'Radiologists'}</SelectItem>
              <SelectItem value="admin">{tI18n('admins') || t('admins') || 'Admins'}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder={tI18n('filterByStatus') || t('filterByStatus') || 'Filter by status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tI18n('allStatuses') || t('allStatuses') || 'All Statuses'}</SelectItem>
              <SelectItem value="active">{tI18n('active') || t('active') || 'Active'}</SelectItem>
              <SelectItem value="inactive">{tI18n('inactive') || t('inactive') || 'Inactive'}</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {tI18n('addUser') || t('addUser') || 'Add User'}
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tI18n('name') || t('name') || 'Name'}</TableHead>
                <TableHead>{tI18n('email') || t('email') || 'Email'}</TableHead>
                <TableHead>{tI18n('role') || t('role') || 'Role'}</TableHead>
                <TableHead>{tI18n('status') || t('status') || 'Status'}</TableHead>
                <TableHead>{tI18n('lastLogin') || t('lastLogin') || 'Last Login'}</TableHead>
                <TableHead>{tI18n('actions') || t('actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="capitalize">{user.role}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? tI18n('active') || t('active') || 'Active' : tI18n('inactive') || t('inactive') || 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>{user.lastLogin || '-'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user)}
                      >
                        {user.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteUserId(user._id)}
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
        {/* Edit Modal */}
        {editUser && (
          <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title={tI18n('editUser') || t('editUser') || 'Edit User'}>
            <div className="p-2">
              <div className="mb-2">
                <label>{tI18n('firstName') || t('firstName') || 'First Name'}</label>
                <Input value={editUser.firstName} onChange={e => setEditUser({ ...editUser, firstName: e.target.value })} />
              </div>
              <div className="mb-2">
                <label>{tI18n('lastName') || t('lastName') || 'Last Name'}</label>
                <Input value={editUser.lastName} onChange={e => setEditUser({ ...editUser, lastName: e.target.value })} />
              </div>
              <div className="mb-2">
                <label>{tI18n('email') || t('email') || 'Email'}</label>
                <Input value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
              </div>
              <div className="flex space-x-2 mt-4">
                <Button onClick={() => handleEditUserSave(editUser)}>{tI18n('save') || t('save') || 'Save'}</Button>
                <Button variant="outline" onClick={() => setEditUser(null)}>{tI18n('cancel') || t('cancel') || 'Cancel'}</Button>
              </div>
            </div>
          </Modal>
        )}
        {/* Delete Confirm Modal */}
        {deleteUserId && (
          <Modal isOpen={!!deleteUserId} onClose={() => setDeleteUserId(null)} title={tI18n('confirmDelete') || t('confirmDelete') || 'Confirm Delete'}>
            <div className="p-2">
              <p>{tI18n('deleteUserPrompt') || t('deleteUserPrompt') || 'Are you sure you want to delete this user?'}</p>
              <div className="flex space-x-2 mt-4">
                <Button onClick={() => handleDeleteUser(deleteUserId)}>{tI18n('delete') || t('delete') || 'Delete'}</Button>
                <Button variant="outline" onClick={() => setDeleteUserId(null)}>{tI18n('cancel') || t('cancel') || 'Cancel'}</Button>
              </div>
            </div>
          </Modal>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
