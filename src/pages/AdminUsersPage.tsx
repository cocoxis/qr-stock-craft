import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Shield, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  is_approved: boolean;
  created_at: string;
  roles: string[];
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }

    const { data: allRoles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const usersWithRoles = (profiles || []).map(p => ({
      id: p.id,
      email: p.email || '',
      display_name: p.display_name || '',
      is_approved: p.is_approved,
      created_at: p.created_at,
      roles: (allRoles || []).filter(r => r.user_id === p.id).map(r => r.role),
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleApproval = async (userId: string, approve: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: approve })
      .eq('id', userId);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: approve ? 'Utilisateur approuvé' : 'Accès révoqué' });
      fetchUsers();
    }
  };

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Rôle admin retiré' });
        fetchUsers();
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' as any });
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Rôle admin ajouté' });
        fetchUsers();
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">Approuvez les nouveaux utilisateurs et gérez les rôles</p>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground">Aucun utilisateur</p>
          ) : (
            users.map(user => {
              const isAdmin = user.roles.includes('admin');
              return (
                <Card key={user.id}>
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{user.display_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {user.is_approved ? (
                          <Badge variant="default" className="bg-success text-success-foreground text-xs">Approuvé</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">En attente</Badge>
                        )}
                        {isAdmin && (
                          <Badge variant="default" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {user.is_approved ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleApproval(user.id, false)}
                          className="text-destructive hover:text-destructive gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" /> Révoquer
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => toggleApproval(user.id, true)}
                          className="gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Approuver
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={isAdmin ? 'destructive' : 'outline'}
                        onClick={() => toggleAdmin(user.id, isAdmin)}
                        className="gap-1"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        {isAdmin ? 'Retirer admin' : 'Admin'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminUsersPage;
