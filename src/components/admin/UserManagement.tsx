import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
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
    return <div className="flex items-center justify-center h-64">Loading users...</div>;
  }

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
              <SelectItem value="radiologist">{t('radiologists') || 'Radiologists'}</SelectItem>
              <SelectItem value="admin">{t('admins') || 'Admins'}</SelectItem>
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
                      {user.isActive ? 'active' : 'inactive'}
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
          <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
            <div className="p-2">
              <div className="mb-2">
                <label>First Name</label>
                <Input value={editUser.firstName} onChange={e => setEditUser({ ...editUser, firstName: e.target.value })} />
              </div>
              <div className="mb-2">
                <label>Last Name</label>
                <Input value={editUser.lastName} onChange={e => setEditUser({ ...editUser, lastName: e.target.value })} />
              </div>
              <div className="mb-2">
                <label>Email</label>
                <Input value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
              </div>
              <div className="flex space-x-2 mt-4">
                <Button onClick={() => handleEditUserSave(editUser)}>Save</Button>
                <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              </div>
            </div>
          </Modal>
        )}
        {/* Delete Confirm Modal */}
        {deleteUserId && (
          <Modal isOpen={!!deleteUserId} onClose={() => setDeleteUserId(null)} title="Confirm Delete">
            <div className="p-2">
              <p>Are you sure you want to delete this user?</p>
              <div className="flex space-x-2 mt-4">
                <Button onClick={() => handleDeleteUser(deleteUserId)}>Delete</Button>
                <Button variant="outline" onClick={() => setDeleteUserId(null)}>Cancel</Button>
              </div>
            </div>
          </Modal>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
