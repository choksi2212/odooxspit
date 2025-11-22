import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name?: string; email?: string }) => apiClient.updateProfile(data),
    onSuccess: (response) => {
      toast.success('Profile updated successfully');
      setUser(response.user);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: formData.name,
      email: formData.email,
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STAFF':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user?.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1 text-xs">
              <Mail className="h-3 w-3" />
              {user?.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Badge className={getRoleColor(user?.role || '')}>
                <Shield className="h-3 w-3 mr-1" />
                {user?.role}
              </Badge>
            </div>
            <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Login ID (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="loginId">Login ID</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="loginId"
                      value={user?.loginId || ''}
                      disabled
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Login ID cannot be changed</p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1"
                      required
                    />
                  </div>
                </div>

                {/* Role (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="role"
                      value={user?.role || ''}
                      disabled
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Role is assigned by administrators</p>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              
              if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                toast.error('Please fill in all password fields');
                return;
              }
              
              if (passwordData.newPassword !== passwordData.confirmPassword) {
                toast.error('New passwords do not match');
                return;
              }
              
              if (passwordData.newPassword.length < 8) {
                toast.error('New password must be at least 8 characters long');
                return;
              }
              
              try {
                setIsChangingPassword(true);
                await apiClient.changePassword({
                  currentPassword: passwordData.currentPassword,
                  newPassword: passwordData.newPassword,
                });
                toast.success('Password changed successfully!');
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
              } catch (error: any) {
                toast.error(error.message || 'Failed to change password');
              } finally {
                setIsChangingPassword(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={isChangingPassword}>
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>Your activity summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground">Operations Created</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground">Products Added</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground">Warehouses Managed</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {user?.createdAt
                  ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
              </div>
              <div className="text-xs text-muted-foreground">Days Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

