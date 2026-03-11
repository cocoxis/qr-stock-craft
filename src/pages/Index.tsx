import { Package, Box, AlertTriangle, ClipboardList } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useWorkspaceStorage } from '@/hooks/useWorkspaceStorage';
import { initialStockItems, initialProducts, initialAssemblyLists } from '@/data/initialData';
import type { StockItem, Product, AssemblyList } from '@/types';

const Index = () => {
  const { getStorageKey } = useWorkspaceContext();
  const [stockItems] = useWorkspaceStorage<StockItem[]>(getStorageKey('stockItems'), initialStockItems);
  const [products] = useWorkspaceStorage<Product[]>(getStorageKey('products'), initialProducts);
  const [assemblyLists] = useWorkspaceStorage<AssemblyList[]>(getStorageKey('assemblyLists'), initialAssemblyLists);

  const lowStockItems = stockItems.filter(item => item.quantity <= item.minQuantity);
  const totalStockValue = stockItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const stats = [
    {
      label: 'Articles en stock',
      value: stockItems.length,
      icon: Package,
      detail: `${stockItems.reduce((s, i) => s + i.quantity, 0)} unités totales`,
    },
    {
      label: 'Produits fabriqués',
      value: products.length,
      icon: Box,
      detail: `${products.reduce((s, p) => s + p.quantityProduced, 0)} unités produites`,
    },
    {
      label: 'Alertes stock bas',
      value: lowStockItems.length,
      icon: AlertTriangle,
      detail: lowStockItems.length > 0 ? 'Réapprovisionnement nécessaire' : 'Tout est OK',
      alert: lowStockItems.length > 0,
    },
    {
      label: 'Listes d\'assemblage',
      value: assemblyLists.length,
      icon: ClipboardList,
      detail: 'Nomenclatures actives',
    },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de votre inventaire</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.alert ? 'text-warning' : 'text-primary'}`} />
                <span className={`text-2xl font-bold font-mono ${stat.alert ? 'text-warning' : 'text-foreground'}`}>
                  {stat.value}
                </span>
              </div>
              <p className="text-sm font-medium">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Valeur du stock</h2>
            <p className="text-3xl font-bold font-mono text-primary">
              {totalStockValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Valeur totale estimée</p>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4">Stock critique</h2>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun article en stock critique</p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-warning font-semibold">{item.quantity} {item.unit}</p>
                      <p className="text-xs text-muted-foreground">min: {item.minQuantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
