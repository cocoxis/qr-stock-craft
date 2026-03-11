import { useState, useRef, useMemo } from 'react';
import { Plus, Search, QrCode, Trash2, Edit2, Camera, Printer, ImageIcon, Eye, X, Filter, Calendar, Clock } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import QRScanner from '@/components/QRScanner';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useWorkspaceStorage } from '@/hooks/useWorkspaceStorage';
import { initialStockItems } from '@/data/initialData';
import type { StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { useSearchParams } from 'react-router-dom';

const emptyItem: Omit<StockItem, 'id' | 'createdAt'> = {
  name: '', sku: '', category: '', description: '', supplier: '', supplierRef: '', supplierLink: '', imageUrl: '', quantity: 0, minQuantity: 0, unit: 'pcs', location: '', price: 0, updatedAt: '',
};

const StockPage = () => {
  const { getStorageKey } = useWorkspaceContext();
  const [items, setItems] = useWorkspaceStorage<StockItem[]>(getStorageKey('stockItems'), initialStockItems);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [qrItem, setQrItem] = useState<StockItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyItem);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<StockItem | null>(null);
  const [viewItem, setViewItem] = useState<StockItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [items]);

  const filtered = items.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      (i.supplier && i.supplier.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.name || !form.sku) return;
    const now = new Date().toISOString().split('T')[0];
    if (editingId) {
      setItems(items.map((i) => (i.id === editingId ? { ...i, ...form, updatedAt: now } : i)));
    } else {
      const newItem: StockItem = {
        ...form,
        id: `stk-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setItems([...items, newItem]);
    }
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyItem);
  };

  const handleEdit = (item: StockItem) => {
    setForm({
      name: item.name, sku: item.sku, category: item.category, description: item.description || '',
      supplier: item.supplier || '', supplierRef: item.supplierRef || '', supplierLink: item.supplierLink || '',
      imageUrl: item.imageUrl || '', quantity: item.quantity, minQuantity: item.minQuantity, unit: item.unit,
      location: item.location, price: item.price, updatedAt: item.updatedAt || '',
    });
    setEditingId(item.id);
    setFormOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (deleteConfirm) {
      setItems(items.filter((i) => i.id !== deleteConfirm.id));
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
        .right { text-align: right; }
        .mono { font-family: monospace; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>Liste de stock — ${new Date().toLocaleDateString('fr-FR')}</h1>
      <table>
        <thead><tr>
          <th>Article</th><th>SKU</th><th>Catégorie</th><th>Fournisseur</th>
          <th class="right">Quantité</th><th>Empl.</th><th class="right">Prix unit.</th>
        </tr></thead>
        <tbody>
          ${filtered.map(i => `<tr>
            <td>${i.name}</td><td class="mono">${i.sku}</td><td>${i.category}</td>
            <td>${i.supplier || '—'}</td>
            <td class="right mono">${i.quantity} ${i.unit}</td><td class="mono">${i.location}</td>
            <td class="right mono">${i.price.toFixed(2)}€</td>
          </tr>`).join('')}
        </tbody>
      </table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

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
            <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingId(null); setForm(emptyItem); } }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Modifier' : 'Nouvel article'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 mt-2">
                  <Input placeholder="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input placeholder="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="font-mono" />
                  <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Fournisseur" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                    <Input placeholder="Réf. fournisseur" value={form.supplierRef} onChange={(e) => setForm({ ...form, supplierRef: e.target.value })} className="font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val === '__custom__' ? '' : val })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">+ Nouvelle catégorie</SelectItem>
                        </SelectContent>
                      </Select>
                      {(!form.category || !categories.includes(form.category)) && (
                        <Input placeholder="Nouvelle catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2" />
                      )}
                    </div>
                    <Input placeholder="Emplacement" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="font-mono" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input type="number" placeholder="Quantité" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                    <Input type="number" placeholder="Min" value={form.minQuantity || ''} onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })} />
                    <Input placeholder="Unité" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                  </div>
                  <Input type="number" step="0.01" placeholder="Prix unitaire (€)" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                  
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {form.imageUrl ? 'Changer l\'image' : 'Joindre une image'}
                    </Button>
                    {form.imageUrl && (
                      <div className="mt-2 relative">
                        <img src={form.imageUrl} alt="Aperçu" className="w-full h-32 object-cover rounded-lg border border-border" />
                        <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setForm({ ...form, imageUrl: '' })}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={handleSave} className="w-full mt-2">{editingId ? 'Enregistrer' : 'Ajouter'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search + Category filter */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, SKU, fournisseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
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
                    onClick={() => setViewItem(item)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover border border-border" />
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(item)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQrItem(item)}>
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}>
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

        {/* QR Code dialog */}
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

        {/* Detail view dialog */}
        <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewItem?.name}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">{viewItem?.sku}</DialogDescription>
            </DialogHeader>
            {viewItem && (
              <div className="space-y-5">
                {viewItem.imageUrl && (
                  <img src={viewItem.imageUrl} alt={viewItem.name} className="w-full h-64 object-cover rounded-lg border border-border" />
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Catégorie</p>
                    <p className="text-sm font-medium">{viewItem.category || '—'}</p>
                  </div>
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Fournisseur</p>
                    <p className="text-sm font-medium">{viewItem.supplier || '—'}</p>
                    {viewItem.supplierRef && (
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">Réf: {viewItem.supplierRef}</p>
                    )}
                  </div>
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Quantité</p>
                    <p className={`text-sm font-mono font-semibold ${viewItem.quantity <= viewItem.minQuantity ? 'text-warning' : ''}`}>
                      {viewItem.quantity} {viewItem.unit}
                      <span className="text-xs text-muted-foreground font-normal ml-1">(min: {viewItem.minQuantity})</span>
                    </p>
                  </div>
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Prix unitaire</p>
                    <p className="text-sm font-mono font-semibold">{viewItem.price.toFixed(2)} €</p>
                  </div>
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Emplacement</p>
                    <p className="text-sm font-mono font-medium">{viewItem.location || '—'}</p>
                  </div>
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Valeur totale</p>
                    <p className="text-sm font-mono font-semibold text-primary">
                      {(viewItem.quantity * viewItem.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>

                {viewItem.description && (
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{viewItem.description}</p>
                  </div>
                )}

                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Créé le {new Date(viewItem.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                  {viewItem.updatedAt && viewItem.updatedAt !== viewItem.createdAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Modifié le {new Date(viewItem.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <QRCodeDisplay
                    value={JSON.stringify({ type: 'stock', id: viewItem.id, sku: viewItem.sku, name: viewItem.name })}
                    size={120}
                    label={viewItem.sku}
                    showPrint
                    itemName={viewItem.name}
                  />
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => { setViewItem(null); handleEdit(viewItem); }}>
                    <Edit2 className="w-3.5 h-3.5 mr-2" /> Modifier
                  </Button>
                  <Button variant="destructive" onClick={() => { setViewItem(null); setDeleteConfirm(viewItem); }}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
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
