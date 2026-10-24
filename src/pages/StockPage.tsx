import { useState, useMemo, lazy, Suspense } from 'react';
import { Plus, Search, QrCode, Trash2, Edit2, Camera, Printer, Filter, Tag, FileUp, ExternalLink, Factory, Cpu, X } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import AppLayout from '@/components/AppLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { stockQrValue } from '@/lib/qr';
import { formatPrice } from '@/lib/format';
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

const QRScanner = lazy(() => import('@/components/QRScanner'));
const LcscImportDialog = lazy(() => import('@/components/LcscImportDialog'));

// Manufacturer comes from the specs fetched from LCSC
const manufacturerOf = (item: StockItem) =>
  item.specs?.find(s => s.name === 'Manufacturer')?.value?.trim() ?? '';

const StockPage = () => {
  const { data: items = [], isLoading } = useStockItems();
  const deleteMutation = useDeleteStockItem();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all');
  const [footprintFilter, setFootprintFilter] = useState<string>('all');
  const [qrItem, setQrItem] = useState<StockItem | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<StockItem | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightId = searchParams.get('highlight');

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [items]);

  const manufacturers = useMemo(() => {
    const set = new Set(items.map(manufacturerOf).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  }, [items]);

  const footprints = useMemo(() => {
    const set = new Set(items.map(i => i.componentFootprint?.trim()).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  }, [items]);

  const filtered = useMemo(() => items.filter((i) => {
    const s = search.toLowerCase();
    const matchesSearch =
      i.name.toLowerCase().includes(s) ||
      i.sku.toLowerCase().includes(s) ||
      (i.lcscPart && i.lcscPart.toLowerCase().includes(s)) ||
      i.category.toLowerCase().includes(s) ||
      (i.supplier && i.supplier.toLowerCase().includes(s)) ||
      (i.componentValue && i.componentValue.toLowerCase().includes(s)) ||
      (i.componentVoltage && i.componentVoltage.toLowerCase().includes(s)) ||
      (i.componentFootprint && i.componentFootprint.toLowerCase().includes(s)) ||
      (i.screwType && i.screwType.toLowerCase().includes(s)) ||
      (i.screwLength && i.screwLength.toLowerCase().includes(s)) ||
      (i.screwShape && i.screwShape.toLowerCase().includes(s));
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
    const matchesManufacturer = manufacturerFilter === 'all' || manufacturerOf(i) === manufacturerFilter;
    const matchesFootprint = footprintFilter === 'all' || i.componentFootprint?.trim() === footprintFilter;
    return matchesSearch && matchesCategory && matchesManufacturer && matchesFootprint;
  }), [items, search, categoryFilter, manufacturerFilter, footprintFilter]);

  const hasFilters = categoryFilter !== 'all' || manufacturerFilter !== 'all' || footprintFilter !== 'all';
  const resetFilters = () => {
    setCategoryFilter('all');
    setManufacturerFilter('all');
    setFootprintFilter('all');
  };

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
      <html><head><title>Stock list - StockQR</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .right { text-align: right; } .mono { font-family: monospace; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>Stock list — ${new Date().toLocaleDateString('en-US')}</h1>
      <table><thead><tr>
        <th>Item</th><th>SKU</th><th>Category</th><th>Supplier</th>
        <th class="right">Quantity</th><th>Loc.</th><th class="right">Unit price</th>
      </tr></thead><tbody>
        ${filtered.map(i => `<tr>
          <td>${i.name}</td><td class="mono">${i.sku}</td><td>${i.category}</td>
          <td>${i.supplier || '—'}</td>
          <td class="right mono">${i.quantity} ${i.unit}</td><td class="mono">${i.location}</td>
          <td class="right mono">${formatPrice(i.price)}</td>
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
            <p className="text-muted-foreground text-sm mt-1">{filtered.length}/{items.length} items</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setScannerOpen(true)} title="Scan QR">
              <Camera className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrint} title="Print list">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp className="w-4 h-4 mr-2" />Import LCSC
            </Button>
            <Button onClick={() => navigate('/stock/new/edit')}>
              <Plus className="w-4 h-4 mr-2" />Add
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, SKU, LCSC #, supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
            <SelectTrigger className="w-[180px]">
              <Factory className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Manufacturer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All manufacturers</SelectItem>
              {manufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={footprintFilter} onValueChange={setFootprintFilter}>
            <SelectTrigger className="w-[160px]">
              <Cpu className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Package" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All packages</SelectItem>
              {footprints.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" /> Reset
            </Button>
          )}
        </div>

        <div className="glass-card rounded-xl overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplier</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loc.</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
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
                            <HoverCardContent side="right" align="start" className="w-fit max-w-[80vw] p-1">
                              <img src={item.imageUrl} alt={item.name} className="rounded max-w-[60vw] max-h-[70vh] object-contain" />
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
                    <td className="p-3 text-right font-mono">{formatPrice(item.price)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Open datasheet">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
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
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">No items found</td>
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
                <QRCodeDisplay value={stockQrValue(qrItem)} size={180} label={qrItem.sku} />
                <p className="text-xs text-muted-foreground">Location: {qrItem.location || '—'} • {qrItem.quantity} {qrItem.unit}</p>
                <Button variant="outline" size="sm" onClick={() => navigate(`/labels?ids=${encodeURIComponent(qrItem.id)}`)}>
                  <Tag className="w-3.5 h-3.5 mr-1.5" /> Create label
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-semibold">{deleteConfirm?.name}</span> ({deleteConfirm?.sku}) ? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {importOpen && (
          <Suspense fallback={null}>
            <LcscImportDialog open={importOpen} onOpenChange={setImportOpen} items={items} />
          </Suspense>
        )}

        {scannerOpen && (
          <Suspense fallback={null}>
            <QRScanner open={scannerOpen} onOpenChange={setScannerOpen} />
          </Suspense>
        )}
      </div>
    </AppLayout>
  );
};

export default StockPage;
