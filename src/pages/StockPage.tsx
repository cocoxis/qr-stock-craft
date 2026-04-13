import { useState, useMemo } from 'react';
import { Plus, Search, QrCode, Trash2, Edit2, Camera, Printer, Filter } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import AppLayout from '@/components/AppLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import QRScanner from '@/components/QRScanner';
import { useStockItems, useDeleteStockItem } from '@/hooks/useStockItems';
import type { StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSearchParams, useNavigate } from 'react-router-dom';

const StockPage = () => {
  const { data: items = [], isLoading } = useStockItems();
  const deleteMutation = useDeleteStockItem();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [qrItem, setQrItem] = useState<StockItem | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<StockItem | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightId = searchParams.get('highlight');

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [items]);

  const filtered = items.filter((i) => {
    const s = search.toLowerCase();
    const matchesSearch =
      i.name.toLowerCase().includes(s) ||
      i.sku.toLowerCase().includes(s) ||
      i.category.toLowerCase().includes(s) ||
      (i.supplier && i.supplier.toLowerCase().includes(s)) ||
      (i.componentValue && i.componentValue.toLowerCase().includes(s)) ||
      (i.componentVoltage && i.componentVoltage.toLowerCase().includes(s)) ||
      (i.componentFootprint && i.componentFootprint.toLowerCase().includes(s)) ||
      (i.screwType && i.screwType.toLowerCase().includes(s)) ||
      (i.screwLength && i.screwLength.toLowerCase().includes(s)) ||
      (i.screwShape && i.screwShape.toLowerCase().includes(s));
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteConfirmed = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Liste de stock - StockQR</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .right { text-align: right; } .mono { font-family: monospace; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>Liste de stock — ${new Date().toLocaleDateString('fr-FR')}</h1>
      <table><thead><tr>
        <th>Article</th><th>SKU</th><th>Catégorie</th><th>Fournisseur</th>
        <th class="right">Quantité</th><th>Empl.</th><th class="right">Prix unit.</th>
      </tr></thead><tbody>
        ${filtered.map(i => `<tr>
          <td>${i.name}</td><td class="mono">${i.sku}</td><td>${i.category}</td>
          <td>${i.supplier || '—'}</td>
          <td class="right mono">${i.quantity} ${i.unit}</td><td class="mono">${i.location}</td>
          <td class="right mono">${i.price.toFixed(2)}€</td>
        </tr>`).join('')}
      </tbody></table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

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
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length}/{items.length} articles</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setScannerOpen(true)} title="Scanner QR">
              <Camera className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrint} title="Imprimer">
              <Printer className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/stock/new/edit')}>
              <Plus className="w-4 h-4 mr-2" />Ajouter
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher par nom, SKU, fournisseur..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Article</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catégorie</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fournisseur</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantité</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empl.</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prix</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-border/30 hover:bg-muted/50 transition-colors cursor-pointer ${highlightId === item.id ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}
                    onClick={() => navigate(`/stock/${item.id}`)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {item.imageUrl && (
                          <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover border border-border cursor-zoom-in" />
                            </HoverCardTrigger>
                            <HoverCardContent side="right" className="w-auto max-w-[500px] p-1">
                              <img src={item.imageUrl} alt={item.name} className="rounded object-contain max-w-[480px] max-h-[480px]" />
                            </HoverCardContent>
                          </HoverCard>
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{item.category}</span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{item.supplier || '—'}</td>
                    <td className={`p-3 text-right font-mono font-semibold ${item.quantity <= item.minQuantity ? 'text-warning' : ''}`}>
                      {item.quantity} <span className="text-xs text-muted-foreground font-normal">{item.unit}</span>
                    </td>
                    <td className="p-3 font-mono text-xs">{item.location}</td>
                    <td className="p-3 text-right font-mono">{item.price.toFixed(2)}€</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQrItem(item)}>
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/stock/${item.id}/edit`)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(item)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">Aucun article trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={!!qrItem} onOpenChange={() => setQrItem(null)}>
          <DialogContent className="max-w-xs text-center">
            <DialogHeader>
              <DialogTitle className="text-center">{qrItem?.name}</DialogTitle>
            </DialogHeader>
            {qrItem && (
              <div className="flex flex-col items-center gap-3 py-4">
                <QRCodeDisplay
                  value={JSON.stringify({ type: 'stock', id: qrItem.id, sku: qrItem.sku, name: qrItem.name })}
                  size={180}
                  label={qrItem.sku}
                  showPrint
                  itemName={qrItem.name}
                />
                <p className="text-xs text-muted-foreground">Empl: {qrItem.location} • {qrItem.quantity} {qrItem.unit}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{deleteConfirm?.name}</span> ({deleteConfirm?.sku}) ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <QRScanner open={scannerOpen} onOpenChange={setScannerOpen} />
      </div>
    </AppLayout>
  );
};

export default StockPage;
