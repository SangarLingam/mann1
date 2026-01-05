import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2, Loader2, UserPlus, Shield, User } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const ROLES: AppRole[] = ['admin', 'staff', 'user'];

const roleIcons: Record<AppRole, typeof Shield> = {
  admin: Shield,
  staff: UserPlus,
  user: User,
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-700',
  staff: 'bg-blue-100 text-blue-700',
  user: 'bg-gray-100 text-gray-700',
};

interface StaffMember {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
}

export default function StaffManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('staff');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StaffMember[];
    }
  });

  const createStaffMutation = useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: AppRole }) => {
      // First sign up the new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/auth`,
        }
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Failed to create user');

      // Then add their role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: signUpData.user.id,
          role
        });

      if (roleError) throw roleError;

      return signUpData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      setIsDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('staff');
      toast({ title: 'Staff member created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating staff member', description: error.message, variant: 'destructive' });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({ title: 'Role removed successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error removing role', description: error.message, variant: 'destructive' });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({ title: 'Role updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating role', description: error.message, variant: 'destructive' });
    }
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    createStaffMutation.mutate({ email: newEmail, password: newPassword, role: newRole });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold mb-2">Admin Access Required</h3>
        <p className="text-muted-foreground">Only admins can manage staff members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Staff Management</h2>
          <p className="text-muted-foreground">{staffMembers?.length || 0} staff members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={createStaffMutation.isPending}>
                  {createStaffMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Staff Member
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">User ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Added</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers?.map((member) => {
                const RoleIcon = roleIcons[member.role];
                return (
                  <tr key={member.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded">{member.user_id.slice(0, 8)}...</code>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        defaultValue={member.role}
                        onValueChange={(value) => updateRoleMutation.mutate({ id: member.id, role: value as AppRole })}
                      >
                        <SelectTrigger className="w-28">
                          <div className="flex items-center gap-2">
                            <RoleIcon className="h-4 w-4" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(role => (
                            <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteRoleMutation.mutate(member.id)}
                        disabled={deleteRoleMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {(!staffMembers || staffMembers.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No staff members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-red-700 dark:text-red-400">Admin Account</h4>
          </div>
          <p className="text-sm font-mono">admin@mann.store</p>
          <p className="text-sm font-mono">admin123</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-700 dark:text-blue-400">Staff Account</h4>
          </div>
          <p className="text-sm font-mono">staff@mann.store</p>
          <p className="text-sm font-mono">staff123</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-700 dark:text-green-400">Customer Account</h4>
          </div>
          <p className="text-sm font-mono">customer@test.com</p>
          <p className="text-sm font-mono">customer123</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        👆 Create these accounts using the "Add Staff Member" button above. Customer accounts don't need roles.
      </p>
    </div>
  );
}
