import { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ImageIcon, Trash2, Save } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useWorkspaceStorage } from '@/hooks/useWorkspaceStorage';
import { initialStockItems } from '@/data/initialData';
import type { StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StockItemEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStorageKey } = useWorkspaceContext();
  const [items, setItems] = useWorkspaceStorage<StockItem[]>(getStorageKey('stockItems'), initialStockItems);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNew = !id || id === 'new';
  const existingItem = isNew ? null : items.find(i => i.id === id);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [items]);

  const generateSku = (category: string) => {
    const prefixes: Record<string, string> = {
      'composants': 'COMP', 'visserie': 'VIS', 'matières premières': 'MAT', 'électrique': 'ELEC',
    };
    const prefix = prefixes[category.toLowerCase()] || category.substring(0, 4).toUpperCase();
    const existing = items.filter(i => i.sku.startsWith(prefix + '-')).length;
    return `${prefix}-${String(existing + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  };

  const [form, setForm] = useState(() => {
    if (existingItem) {
      return {
        name: existingItem.name, sku: existingItem.sku, category: existingItem.category,
        description: existingItem.description || '', supplier: existingItem.supplier || '',
        supplierRef: existingItem.supplierRef || '', supplierLink: existingItem.supplierLink || '',
        imageUrl: existingItem.imageUrl || '', quantity: existingItem.quantity,
        minQuantity: existingItem.minQuantity, unit: existingItem.unit, location: existingItem.location,
        price: existingItem.price, updatedAt: existingItem.updatedAt || '',
        componentValue: existingItem.componentValue || '', componentVoltage: existingItem.componentVoltage || '',
        componentFootprint: existingItem.componentFootprint || '',
        screwType: existingItem.screwType || '', screwLength: existingItem.screwLength || '',
        screwShape: existingItem.screwShape || '',
      };
    }
    return {
      name: '', sku: '', category: '', description: '', supplier: '', supplierRef: '', supplierLink: '',
      imageUrl: '', quantity: 0, minQuantity: 0, unit: 'pcs', location: '', price: 0, updatedAt: '',
      componentValue: '', componentVoltage: '', componentFootprint: '',
      screwType: '', screwLength: '', screwShape: '',
    };
  });

  const handleCategoryChange = (val: string) => {
    const cat = val === '__custom__' ? '' : val;
    const updates: Partial<typeof form> = { category: cat };
    if (isNew && cat && !form.sku) {
      updates.sku = generateSku(cat);
    }
    setForm({ ...form, ...updates });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm({ ...form, imageUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.name || !form.sku) return;
    const now = new Date().toISOString().split('T')[0];
    if (existingItem) {
      setItems(items.map(i => i.id === existingItem.id ? { ...i, ...form, updatedAt: now } : i));
      navigate(`/stock/${existingItem.id}`);
    } else {
      const newId = `stk-${Date.now()}`;
      const newItem: StockItem = { ...form, id: newId, createdAt: now, updatedAt: now };
      setItems([...items, newItem]);
      navigate(`/stock/${newId}`);
    }
  };

  if (!isNew && !existingItem) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Article introuvable</p>
          <Button variant="outline" onClick={() => navigate('/stock')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au stock
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(existingItem ? `/stock/${existingItem.id}` : '/stock')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? 'Nouvel article' : `Modifier — ${existingItem?.name}`}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={!form.name || !form.sku}>
            <Save className="w-4 h-4 mr-2" /> {isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </div>

        {/* Form */}
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
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Select value={form.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      <SelectItem value="__custom__">+ Nouvelle catégorie</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!form.category || !categories.includes(form.category)) && (
                    <Input placeholder="Nouvelle catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2" />
                  )}
                </div>
                <Input placeholder="Emplacement" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="font-mono" />
              </div>
            </div>

            <div className="rounded-xl border border-border p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantité & Prix</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input type="number" placeholder="Quantité" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                <Input type="number" placeholder="Min" value={form.minQuantity || ''} onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })} />
                <Input placeholder="Unité" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                <Input type="number" step="0.01" placeholder="Prix (€)" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>

            <div className="rounded-xl border border-border p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fournisseur</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Fournisseur" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                <Input placeholder="Réf. fournisseur" value={form.supplierRef} onChange={(e) => setForm({ ...form, supplierRef: e.target.value })} className="font-mono" />
              </div>
              <Input placeholder="Lien fournisseur (URL)" value={form.supplierLink} onChange={(e) => setForm({ ...form, supplierLink: e.target.value })} type="url" />
            </div>

            {form.category?.toLowerCase() === 'composants' && (
              <div className="rounded-xl border border-border p-5 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Champs Composants</p>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Valeur (ex: 10kΩ)" value={form.componentValue || ''} onChange={(e) => setForm({ ...form, componentValue: e.target.value })} />
                  <Input placeholder="Tension (ex: 25V)" value={form.componentVoltage || ''} onChange={(e) => setForm({ ...form, componentVoltage: e.target.value })} />
                  <Input placeholder="FootPrint (ex: 0805)" value={form.componentFootprint || ''} onChange={(e) => setForm({ ...form, componentFootprint: e.target.value })} />
                </div>
              </div>
            )}

            {form.category?.toLowerCase() === 'visserie' && (
              <div className="rounded-xl border border-border p-5 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Champs Visserie</p>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Type (ex: CHC, HEX)" value={form.screwType || ''} onChange={(e) => setForm({ ...form, screwType: e.target.value })} />
                  <Input placeholder="Longueur (ex: 20mm)" value={form.screwLength || ''} onChange={(e) => setForm({ ...form, screwLength: e.target.value })} />
                  <Input placeholder="Forme (ex: Cylindrique)" value={form.screwShape || ''} onChange={(e) => setForm({ ...form, screwShape: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StockItemEditPage;
