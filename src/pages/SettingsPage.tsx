import { Package, Tag, LayoutDashboard, ShoppingCart, Settings } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import BackupCard from '@/components/BackupCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/useSettings';

const allTabs = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, canHide: false },
  { path: '/stock', label: 'Stock', icon: Package, canHide: true },
  { path: '/labels', label: 'Labels', icon: Tag, canHide: true },
  { path: '/shopping', label: 'Shopping', icon: ShoppingCart, canHide: true },
];

const SettingsPage = () => {
  const { settings, toggleTab } = useSettings();

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Customize the app interface</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Menu tabs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Choose which tabs appear in the navigation menu.
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

        <BackupCard />
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
