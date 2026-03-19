import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PendingApprovalPage = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-warning/20 flex items-center justify-center">
              <Clock className="w-7 h-7 text-warning" />
            </div>
          </div>
          <CardTitle className="text-xl">En attente d'approbation</CardTitle>
          <CardDescription>
            Votre compte <strong>{user?.email}</strong> a été créé mais un administrateur doit approuver votre accès avant que vous puissiez utiliser l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovalPage;
