import { useState } from 'react';
import { Plus, Search, QrCode, Trash2, Edit2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialProducts, initialAssemblyLists } from '@/data/initialData';
import type { Product, AssemblyList } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const emptyProduct: Omit<Product, 'id' | 'createdAt'> = {
  name: '', sku: '', description: '', assemblyListId: '', quantityProduced: 0,
};

const ProductsPage = () => {
  const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const [assemblyLists] = useLocalStorage<AssemblyList[]>('assemblyLists', initialAssemblyLists);
  const [search, setSearch] = useState('');
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.name || !form.sku) return;
    if (editingId) {
      setProducts(products.map((p) => (p.id === editingId ? { ...p, ...form } : p)));
    } else {
      const newProduct: Product = {
        ...form,
        id: `prd-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProducts([...products, newProduct]);
    }
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyProduct);
  };

  const handleEdit = (product: Product) => {
    setForm({ name: product.name, sku: product.sku, description: product.description, assemblyListId: product.assemblyListId, quantityProduced: product.quantityProduced });
    setEditingId(product.id);
    setFormOpen(true);
  };

  const getAssemblyName = (id: string) => assemblyLists.find((a) => a.id === id)?.name ?? '—';

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
            <p className="text-muted-foreground text-sm mt-1">{products.length} produits</p>
          </div>
          <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingId(null); setForm(emptyProduct); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Nouveau produit</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Modifier' : 'Nouveau produit'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 mt-2">
                <Input placeholder="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="font-mono" />
                <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Select value={form.assemblyListId} onValueChange={(v) => setForm({ ...form, assemblyListId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Liste d'assemblage" />
                  </SelectTrigger>
                  <SelectContent>
                    {assemblyLists.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Quantité produite" value={form.quantityProduced || ''} onChange={(e) => setForm({ ...form, quantityProduced: Number(e.target.value) })} />
                <Button onClick={handleSave} className="w-full mt-2">{editingId ? 'Enregistrer' : 'Créer'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="glass-card rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground">{product.sku}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQrProduct(product)}>
                    <QrCode className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(product)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setProducts(products.filter(p => p.id !== product.id))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {product.description && <p className="text-sm text-muted-foreground mb-3">{product.description}</p>}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Assemblage: {getAssemblyName(product.assemblyListId)}</span>
                <span className="font-mono font-semibold">{product.quantityProduced} unités</span>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={!!qrProduct} onOpenChange={() => setQrProduct(null)}>
          <DialogContent className="max-w-xs text-center">
            <DialogHeader>
              <DialogTitle className="text-center">{qrProduct?.name}</DialogTitle>
            </DialogHeader>
            {qrProduct && (
              <div className="flex flex-col items-center gap-3 py-4">
                <QRCodeDisplay
                  value={JSON.stringify({ type: 'product', id: qrProduct.id, sku: qrProduct.sku, name: qrProduct.name })}
                  size={180}
                  label={qrProduct.sku}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ProductsPage;
