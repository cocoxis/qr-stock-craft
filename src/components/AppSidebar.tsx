import { NavLink, useLocation } from 'react-router-dom';
import { Package, Box, ClipboardList, LayoutDashboard, QrCode } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/stock', icon: Package, label: 'Stock' },
  { to: '/products', icon: Box, label: 'Produits' },
  { to: '/assembly', icon: ClipboardList, label: 'Assemblages' },
];

const AppSidebar = () => {
  const location = useLocation();

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

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
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

      <div className="p-4 border-t border-sidebar-border flex items-center justify-between">
        <p className="text-xs text-sidebar-foreground/40 font-mono">v1.0.0</p>
        <ThemeToggle />
      </div>
    </aside>
  );
};

export default AppSidebar;
