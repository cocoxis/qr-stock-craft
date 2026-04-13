import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Package, Box, ClipboardList, LayoutDashboard, QrCode, Database, Plus, Trash2, ChevronDown, ShoppingCart, Settings } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSettings } from '@/hooks/useSettings';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/stock', icon: Package, label: 'Stock' },
  { to: '/products', icon: Box, label: 'Produits' },
  { to: '/assembly', icon: ClipboardList, label: 'Assemblages' },
  { to: '/shopping', icon: ShoppingCart, label: 'Courses' },
];

const AppSidebar = () => {
  const location = useLocation();
  const { settings } = useSettings();
  const { workspaces, activeWorkspace, activeId, setActiveId, createWorkspace, deleteWorkspace } = useWorkspaceContext();
  const [showWsList, setShowWsList] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [deleteWs, setDeleteWs] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newWsName.trim()) return;
    createWorkspace(newWsName.trim());
    setNewWsName('');
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">StockQR</h1>
            <p className="text-xs text-sidebar-foreground/50">Gestion de stock</p>
          </div>
        </div>
      </div>

      {/* Workspace selector */}
      <div className="px-3 pt-3">
        <button
          onClick={() => setShowWsList(!showWsList)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
        >
          <Database className="w-3.5 h-3.5 text-primary" />
          <span className="flex-1 text-left font-medium truncate text-sidebar-foreground">{activeWorkspace.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showWsList ? 'rotate-180' : ''}`} />
        </button>

        {showWsList && (
          <div className="mt-1 rounded-lg border border-border bg-background p-1.5 shadow-lg space-y-0.5">
            {workspaces.map(ws => (
              <div key={ws.id} className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${ws.id === activeId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}>
                <button className="flex-1 text-left truncate" onClick={() => { setActiveId(ws.id); setShowWsList(false); }}>
                  {ws.name}
                </button>
                {ws.id !== 'default' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteWs(ws.id); }}
                    className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex gap-1 pt-1 border-t border-border mt-1">
              <Input
                placeholder="Nouvelle base..."
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="h-7 text-xs"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleCreate} disabled={!newWsName.trim()}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems
          .filter(({ to }) => !settings.hiddenTabs.includes(to))
          .map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            );
          })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center justify-end gap-1">
          <NavLink
            to="/settings"
            className="h-8 w-8 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            title="Réglages"
          >
            <Settings className="w-4 h-4" />
          </NavLink>
          <ThemeToggle />
        </div>
        <p className="text-xs text-sidebar-foreground/40 font-mono">v1.0.0</p>
      </div>

      {/* Delete workspace confirmation */}
      <AlertDialog open={!!deleteWs} onOpenChange={() => setDeleteWs(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette base ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les données de cette base seront supprimées définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteWs) { deleteWorkspace(deleteWs); setDeleteWs(null); setShowWsList(false); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};

export default AppSidebar;
