import { Package, Box, ClipboardList, LayoutDashboard, ShoppingCart, Settings } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/useSettings';

const allTabs = [
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard, canHide: false },
  { path: '/stock', label: 'Stock', icon: Package, canHide: true },
  { path: '/products', label: 'Produits', icon: Box, canHide: true },
  { path: '/assembly', label: 'Assemblages', icon: ClipboardList, canHide: true },
  { path: '/shopping', label: 'Courses', icon: ShoppingCart, canHide: true },
];

const SettingsPage = () => {
  const { settings, toggleTab } = useSettings();

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Réglages</h1>
          <p className="text-muted-foreground text-sm mt-1">Personnalisez l'interface de l'application</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Onglets du menu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Choisissez les onglets à afficher dans le menu de navigation.
            </p>
            {allTabs.map(({ path, label, icon: Icon, canHide }) => {
              const isVisible = !settings.hiddenTabs.includes(path);
              return (
                <div key={path} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={() => toggleTab(path)}
                    disabled={!canHide}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
