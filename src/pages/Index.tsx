import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Box, AlertTriangle, TrendingUp, Euro, MapPin, ExternalLink, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AppLayout from '@/components/AppLayout';
import { useStockItems } from '@/hooks/useStockItems';
import { useProducts } from '@/hooks/useProducts';
import { useAssemblyLists } from '@/hooks/useAssemblyLists';
import { useShoppingLists } from '@/hooks/useShoppingLists';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const CHART_COLORS = [
  'hsl(35, 92%, 50%)',
  'hsl(200, 80%, 45%)',
  'hsl(152, 60%, 42%)',
  'hsl(0, 72%, 51%)',
  'hsl(270, 60%, 55%)',
  'hsl(45, 93%, 47%)',
  'hsl(180, 50%, 45%)',
  'hsl(330, 60%, 50%)',
];

const Index = () => {
  const navigate = useNavigate();
  const { data: stockItems = [], isLoading: loadingStock } = useStockItems();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: assemblyLists = [] } = useAssemblyLists();
  const { data: activeShoppingLists = [] } = useShoppingLists('active');

  const isLoading = loadingStock || loadingProducts;

  const lowStockItems = stockItems.filter(item => item.quantity <= item.minQuantity);
  const lowStockProducts = products.filter(p => p.quantityProduced <= p.minQuantity);
  const totalStockValue = stockItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const totalUnits = stockItems.reduce((s, i) => s + i.quantity, 0);
  const totalProduced = products.reduce((s, p) => s + p.quantityProduced, 0);

  const categoryData = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    stockItems.forEach(item => {
      const cat = item.category || 'Non classé';
      const existing = map.get(cat) || { count: 0, value: 0 };
      map.set(cat, { count: existing.count + item.quantity, value: existing.value + item.quantity * item.price });
    });
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.value - a.value);
  }, [stockItems]);

  const topValueItems = useMemo(() => {
    return [...stockItems]
      .map(i => ({ name: i.name.length > 15 ? i.name.slice(0, 15) + '…' : i.name, value: i.quantity * i.price }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [stockItems]);

  const stats = [
    {
      label: 'Articles en stock',
      value: stockItems.length,
      icon: Package,
      detail: `${totalUnits} unités totales`,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Produits fabriqués',
      value: products.length,
      icon: Box,
      detail: `${totalProduced} unités produites`,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Alertes stock',
      value: lowStockItems.length + lowStockProducts.length,
      icon: AlertTriangle,
      detail: lowStockItems.length + lowStockProducts.length > 0 ? 'Réapprovisionnement requis' : 'Tout est OK',
      color: lowStockItems.length + lowStockProducts.length > 0 ? 'text-warning' : 'text-success',
      bg: lowStockItems.length + lowStockProducts.length > 0 ? 'bg-warning/10' : 'bg-success/10',
      alert: lowStockItems.length + lowStockProducts.length > 0,
    },
    {
      label: 'Valeur totale',
      value: totalStockValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
      icon: Euro,
      detail: `${categoryData.length} catégories`,
      color: 'text-success',
      bg: 'bg-success/10',
      isText: true,
    },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de votre inventaire</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  {stat.alert && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning"></span>
                    </span>
                  )}
                </div>
                <p className={`${stat.isText ? 'text-xl' : 'text-2xl'} font-bold font-mono`}>{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée</p>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} strokeWidth={2} stroke="hsl(var(--card))">
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v} unités`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {categoryData.map((cat, i) => (
                      <div key={cat.name} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="truncate text-foreground">{cat.name}</span>
                        <span className="ml-auto font-mono text-muted-foreground">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Top articles par valeur
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topValueItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={topValueItems} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}€`} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(2)}€`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="hsl(35, 92%, 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className={lowStockItems.length + lowStockProducts.length > 0 ? 'border-warning/40' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${lowStockItems.length + lowStockProducts.length > 0 ? 'text-warning' : 'text-success'}`} />
              Stock critique
              {(lowStockItems.length + lowStockProducts.length) > 0 && (
                <Badge variant="secondary" className="bg-warning/15 text-warning border-warning/30 text-xs ml-1">
                  {lowStockItems.length + lowStockProducts.length} alerte{lowStockItems.length + lowStockProducts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length + lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">✅ Tous les niveaux de stock sont suffisants</p>
            ) : (
              <div className="space-y-1">
                {lowStockItems.map(item => {
                  const pct = item.minQuantity > 0 ? Math.min((item.quantity / item.minQuantity) * 100, 100) : 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/stock/${item.id}`)}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors group"
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded object-cover border border-border shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.name}</p>
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0">{item.sku}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <Progress value={pct} className="h-1.5 flex-1 max-w-[120px]" />
                          <span className="text-xs font-mono text-warning font-semibold">{item.quantity}/{item.minQuantity} {item.unit}</span>
                          {item.location && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />{item.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  );
                })}
                {lowStockProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products`)}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors group"
                  >
                    <div className="w-9 h-9 rounded bg-accent/10 flex items-center justify-center shrink-0">
                      <Box className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{product.name}</p>
                        <Badge variant="outline" className="text-[10px] font-mono shrink-0">{product.sku}</Badge>
                        <Badge variant="secondary" className="text-[10px] shrink-0">Produit</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Progress value={product.minQuantity > 0 ? Math.min((product.quantityProduced / product.minQuantity) * 100, 100) : 0} className="h-1.5 flex-1 max-w-[120px]" />
                        <span className="text-xs font-mono text-warning font-semibold">{product.quantityProduced}/{product.minQuantity}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Shopping lists */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Listes de courses en cours
                {activeShoppingLists.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{activeShoppingLists.length}</Badge>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/shopping')}>
                Voir tout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeShoppingLists.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucune liste de courses en cours</p>
            ) : (
              <div className="space-y-2">
                {activeShoppingLists.slice(0, 5).map(list => (
                  <div
                    key={list.id}
                    onClick={() => navigate('/shopping')}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{list.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Créée le {new Date(list.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Index;
