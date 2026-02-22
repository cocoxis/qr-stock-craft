import { useState } from 'react';
import { Plus, Search, QrCode, Trash2, Edit2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialStockItems } from '@/data/initialData';
import type { StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const emptyItem: Omit<StockItem, 'id' | 'createdAt'> = {
  name: '', sku: '', category: '', quantity: 0, minQuantity: 0, unit: 'pcs', location: '', price: 0,
};

const StockPage = () => {
  const [items, setItems] = useLocalStorage<StockItem[]>('stockItems', initialStockItems);
  const [search, setSearch] = useState('');
  const [qrItem, setQrItem] = useState<StockItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyItem);

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.name || !form.sku) return;
    if (editingId) {
      setItems(items.map((i) => (i.id === editingId ? { ...i, ...form } : i)));
    } else {
      const newItem: StockItem = {
        ...form,
        id: `stk-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setItems([...items, newItem]);
    }
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyItem);
  };

  const handleEdit = (item: StockItem) => {
    setForm({ name: item.name, sku: item.sku, category: item.category, quantity: item.quantity, minQuantity: item.minQuantity, unit: item.unit, location: item.location, price: item.price });
    setEditingId(item.id);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
            <p className="text-muted-foreground text-sm mt-1">{items.length} articles</p>
          </div>
          <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingId(null); setForm(emptyItem); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Modifier' : 'Nouvel article'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 mt-2">
                <Input placeholder="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="font-mono" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  <Input placeholder="Emplacement" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="font-mono" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input type="number" placeholder="Quantité" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                  <Input type="number" placeholder="Min" value={form.minQuantity || ''} onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })} />
                  <Input placeholder="Unité" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <Input type="number" step="0.01" placeholder="Prix unitaire (€)" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                <Button onClick={handleSave} className="w-full mt-2">{editingId ? 'Enregistrer' : 'Ajouter'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, SKU, catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Article</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catégorie</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantité</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empl.</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prix</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border/30 hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{item.category}</span>
                    </td>
                    <td className={`p-3 text-right font-mono font-semibold ${item.quantity <= item.minQuantity ? 'text-warning' : ''}`}>
                      {item.quantity} <span className="text-xs text-muted-foreground font-normal">{item.unit}</span>
                    </td>
                    <td className="p-3 font-mono text-xs">{item.location}</td>
                    <td className="p-3 text-right font-mono">{item.price.toFixed(2)}€</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQrItem(item)}>
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                />
                <p className="text-xs text-muted-foreground">Empl: {qrItem.location} • {qrItem.quantity} {qrItem.unit}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default StockPage;
