import { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ImageIcon, Trash2, Save, Download, Loader2, Lock } from 'lucide-react';
import { fetchLcscPart, isLcscCode, type LcscPart } from '@/lib/lcsc';
import { categorizeComponent, ELECTRONIC_CATEGORIES, isElectronicCategory, SKU_PREFIXES } from '@/lib/categories';
import AppLayout from '@/components/AppLayout';
import { useStockItems, useUpsertStockItem } from '@/hooks/useStockItems';
import type { StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StockItemEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: items = [] } = useStockItems();
  const upsertMutation = useUpsertStockItem();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNew = !id || id === 'new';
  const existingItem = isNew ? null : items.find(i => i.id === id);

  const categories = useMemo(() => {
    const cats = new Set([...ELECTRONIC_CATEGORIES, ...items.map(i => i.category).filter(Boolean)]);
    return Array.from(cats).sort();
  }, [items]);

  const generateSku = (category: string) => {
    const prefix = SKU_PREFIXES[category.toLowerCase()] || category.substring(0, 4).toUpperCase();
    const existing = items.filter(i => i.sku.startsWith(prefix + '-')).length;
    return `${prefix}-${String(existing + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  };

  const formFrom = (existingItem: StockItem | null | undefined) => {
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
        link: existingItem.link || '',
        lcscPart: existingItem.lcscPart || '', specs: existingItem.specs || [],
      };
    }
    return {
      name: '', sku: '', category: '', description: '', supplier: '', supplierRef: '', supplierLink: '',
      imageUrl: '', quantity: 0, minQuantity: 0, unit: 'pcs', location: '', price: 0, updatedAt: '',
      componentValue: '', componentVoltage: '', componentFootprint: '',
      screwType: '', screwLength: '', screwShape: '',
      link: '',
      lcscPart: '', specs: [] as StockItem['specs'],
    };
  };
  const [form, setForm] = useState(() => formFrom(existingItem));

  // Opened directly (page reload): the item arrives after the first render
  const loadedId = useRef(existingItem?.id);
  useEffect(() => {
    if (!existingItem || loadedId.current === existingItem.id) return;
    loadedId.current = existingItem.id;
    lastFetchedLcsc.current = (existingItem.lcscPart || '').trim().toUpperCase();
    setForm(formFrom(existingItem));
  }, [existingItem]);

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
    // Downscale the image (800px max, JPEG): a phone photo goes from several MB to ~80 KB
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      setForm(f => ({ ...f, imageUrl: canvas.toDataURL('image/jpeg', 0.8) }));
    };
    img.src = url;
  };

  // Printed on labels (and locked in the database): cannot change once set
  const locked = {
    sku: !!existingItem,
    lcsc: !!existingItem?.lcscPart,
    value: !!existingItem?.componentValue,
  };
  const lockedMpn = existingItem?.specs?.find(sp => sp.name === 'MPN');

  const [lcscLoading, setLcscLoading] = useState(false);
  const lastFetchedLcsc = useRef(form.lcscPart.trim().toUpperCase());

  // Fill the form with LCSC image and specs (without overwriting what is already filled in)
  const applyLcsc = (p: LcscPart) => {
    setForm(f => {
      const category = f.category || categorizeComponent(p.description, p.category);
      return {
        ...f,
        lcscPart: p.code,
        // The printed MPN stays as it is even if LCSC renamed the part
        specs: lockedMpn ? p.specs.map(sp => (sp.name === 'MPN' ? lockedMpn : sp)) : p.specs,
        imageUrl: p.image || f.imageUrl,
        supplier: 'LCSC',
        supplierRef: p.code,
        supplierLink: p.url,
        link: p.datasheet || f.link,
        name: f.name || [p.mpn, p.package].filter(Boolean).join(' '),
        description: f.description || p.description,
        category,
        sku: f.sku || (isNew ? generateSku(category) : ''),
        componentFootprint: f.componentFootprint || p.package,
        price: f.price || p.price || 0,
      };
    });
  };

  const loadLcsc = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    lastFetchedLcsc.current = normalized;
    setLcscLoading(true);
    try {
      const part = await fetchLcscPart(normalized);
      applyLcsc(part);
      toast({ title: `${normalized} fetched`, description: part.description });
    } catch (err) {
      toast({ title: `LCSC ${normalized}`, description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setLcscLoading(false);
    }
  };

  // Auto-fetch as soon as a valid LCSC number is typed
  useEffect(() => {
    const code = form.lcscPart.trim().toUpperCase();
    if (!isLcscCode(code) || code === lastFetchedLcsc.current) return;
    const t = setTimeout(() => loadLcsc(code), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.lcscPart]);

  const handleSave = () => {
    if (!form.name || !form.sku) return;
    const now = new Date().toISOString();
    const itemId = existingItem ? existingItem.id : `stk-${Date.now()}`;
    const item: StockItem = {
      ...form,
      id: itemId,
      createdAt: existingItem?.createdAt || now,
      updatedAt: now,
    };
    upsertMutation.mutate(item, {
      onSuccess: () => {
        toast({ title: 'Item saved' });
        navigate(`/stock/${itemId}`);
      },
      onError: (err) => {
        toast({ title: 'Error', description: String(err.message || err), variant: 'destructive' });
      },
    });
  };

  if (!isNew && !existingItem) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Item not found</p>
          <Button variant="outline" onClick={() => navigate('/stock')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to stock
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(existingItem ? `/stock/${existingItem.id}` : '/stock')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? 'New item' : `Edit — ${existingItem?.name}`}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={!form.name || !form.sku || upsertMutation.isPending}>
            <Save className="w-4 h-4 mr-2" /> {isNew ? 'Create' : 'Save'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-border overflow-hidden">
              {form.imageUrl ? (
                <div className="relative">
                  <img src={form.imageUrl} alt="Preview" className="w-full aspect-square object-contain p-4 bg-muted/30" />
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
              {form.imageUrl ? 'Change image' : 'Attach an image'}
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">General information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="relative">
                  <Input placeholder="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="font-mono pr-8" readOnly={locked.sku} title={locked.sku ? 'Printed on labels: cannot change' : undefined} />
                  {locked.sku && <Lock className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                </div>
              </div>
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Select value={form.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      <SelectItem value="__custom__">+ New category</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!form.category || !categories.includes(form.category)) && (
                    <Input placeholder="New category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2" />
                  )}
                </div>
                <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="font-mono" />
              </div>
            </div>

            <div className="rounded-xl border border-border p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity & Price</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="qty">In stock</Label>
                  <Input id="qty" type="number" min="0" placeholder="0" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="min-qty">Alert below</Label>
                  <Input id="min-qty" type="number" min="0" placeholder="0" value={form.minQuantity || ''} onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" placeholder="pcs" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price">Unit price ($)</Label>
                  <Input id="price" type="number" min="0" step="0.0001" placeholder="0.00" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Stock value: <span className="font-mono">{formatPrice((form.quantity || 0) * (form.price || 0), 2)}</span>
                {form.minQuantity > 0 && <> · Shown as low stock at {form.minQuantity} {form.unit || 'pcs'} or less</>}
              </p>
            </div>

            <div className="rounded-xl border border-border p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplier part number</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="LCSC # (e.g. C17673)"
                    value={form.lcscPart}
                    onChange={(e) => setForm({ ...form, lcscPart: e.target.value })}
                    className="font-mono pr-8"
                    readOnly={locked.lcsc}
                    title={locked.lcsc ? 'Printed on labels: cannot change' : undefined}
                  />
                  {locked.lcsc && <Lock className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={!isLcscCode(form.lcscPart) || lcscLoading}
                  onClick={() => loadLcsc(form.lcscPart)}
                  title="Fetch image and specs from LCSC"
                >
                  {lcscLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Fetch
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Image, datasheet and specs are fetched automatically from LCSC.
                {existingItem && ' SKU, LCSC #, value and MPN are printed on labels and locked.'}
              </p>
              {form.specs && form.specs.length > 0 && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm pt-1">
                  {form.specs.map(s => (
                    <div key={s.name} className="flex justify-between gap-3 border-b border-border/40 py-1">
                      <dt className="text-muted-foreground">{s.name}</dt>
                      <dd className="font-medium text-right">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <div className="rounded-xl border border-border p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplier</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                <Input placeholder="Supplier ref." value={form.supplierRef} onChange={(e) => setForm({ ...form, supplierRef: e.target.value })} className="font-mono" />
              </div>
              <Input placeholder="Supplier link (URL)" value={form.supplierLink} onChange={(e) => setForm({ ...form, supplierLink: e.target.value })} type="url" />
            </div>

            <div className="rounded-xl border border-border p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datasheet</p>
              <Input placeholder="Datasheet URL (PDF)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} type="url" />
            </div>

            {isElectronicCategory(form.category) && (
              <div className="rounded-xl border border-border p-5 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Component fields</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <Input placeholder="Value (e.g. 10kΩ)" value={form.componentValue || ''} onChange={(e) => setForm({ ...form, componentValue: e.target.value })} className="pr-8" readOnly={locked.value} title={locked.value ? 'Printed on labels: cannot change' : undefined} />
                    {locked.value && <Lock className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />}
                  </div>
                  <Input placeholder="Voltage (e.g. 25V)" value={form.componentVoltage || ''} onChange={(e) => setForm({ ...form, componentVoltage: e.target.value })} />
                  <Input placeholder="Package (e.g. 0805)" value={form.componentFootprint || ''} onChange={(e) => setForm({ ...form, componentFootprint: e.target.value })} />
                </div>
              </div>
            )}

            {form.category?.toLowerCase() === 'hardware' && (
              <div className="rounded-xl border border-border p-5 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hardware fields</p>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Type (e.g. SHCS, HEX)" value={form.screwType || ''} onChange={(e) => setForm({ ...form, screwType: e.target.value })} />
                  <Input placeholder="Length (e.g. 20mm)" value={form.screwLength || ''} onChange={(e) => setForm({ ...form, screwLength: e.target.value })} />
                  <Input placeholder="Shape (e.g. Cylindrical)" value={form.screwShape || ''} onChange={(e) => setForm({ ...form, screwShape: e.target.value })} />
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
