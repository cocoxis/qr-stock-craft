import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ImageIcon, Trash2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useWorkspaceStorage } from '@/hooks/useWorkspaceStorage';
import { initialProducts, initialAssemblyLists } from '@/data/initialData';
import type { Product, AssemblyList } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProductEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStorageKey } = useWorkspaceContext();
  const [products, setProducts] = useWorkspaceStorage<Product[]>(getStorageKey('products'), initialProducts);
  const [assemblyLists] = useWorkspaceStorage<AssemblyList[]>(getStorageKey('assemblyLists'), initialAssemblyLists);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNew = !id || id === 'new';
  const existingProduct = isNew ? null : products.find(p => p.id === id);

  const [form, setForm] = useState(() => {
    if (existingProduct) {
      return {
        name: existingProduct.name, sku: existingProduct.sku,
        description: existingProduct.description || '',
        imageUrl: existingProduct.imageUrl || '',
        assemblyListId: existingProduct.assemblyListId,
        quantityProduced: existingProduct.quantityProduced,
        minQuantity: existingProduct.minQuantity || 0,
      };
    }
    return { name: '', sku: '', description: '', imageUrl: '', assemblyListId: '', quantityProduced: 0, minQuantity: 0 };
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm({ ...form, imageUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.name || !form.sku) return;
    if (existingProduct) {
      setProducts(products.map(p => p.id === existingProduct.id ? { ...p, ...form } : p));
      navigate(`/products/${existingProduct.id}`);
    } else {
      const newId = `prd-${Date.now()}`;
      setProducts([...products, { ...form, id: newId, createdAt: new Date().toISOString().split('T')[0] }]);
      navigate(`/products/${newId}`);
    }
  };

  if (!isNew && !existingProduct) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Produit introuvable</p>
          <Button variant="outline" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(existingProduct ? `/products/${existingProduct.id}` : '/products')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? 'Nouveau produit' : `Modifier — ${existingProduct?.name}`}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={!form.name || !form.sku}>
            <Save className="w-4 h-4 mr-2" /> {isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: image */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-border overflow-hidden">
              {form.imageUrl ? (
                <div className="relative">
                  <img src={form.imageUrl} alt="Aperçu" className="w-full aspect-square object-contain p-4 bg-muted/30" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setForm({ ...form, imageUrl: '' })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="aspect-square bg-muted/30 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="w-4 h-4 mr-2" />
              {form.imageUrl ? "Changer l'image" : 'Joindre une image'}
            </Button>
          </div>

          {/* Right: fields */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informations générales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Nom *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="font-mono" />
              </div>
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>

            <div className="rounded-xl border border-border p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Production</p>
              <Select value={form.assemblyListId} onValueChange={(v) => setForm({ ...form, assemblyListId: v })}>
                <SelectTrigger><SelectValue placeholder="Liste d'assemblage" /></SelectTrigger>
                <SelectContent>
                  {assemblyLists.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Quantité produite" value={form.quantityProduced || ''} onChange={(e) => setForm({ ...form, quantityProduced: Number(e.target.value) })} />
                <Input type="number" placeholder="Seuil stock bas" value={form.minQuantity || ''} onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductEditPage;
