import { useState } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialAssemblyLists, initialStockItems } from '@/data/initialData';
import type { AssemblyList, AssemblyItem, StockItem } from '@/types';
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

const AssemblyPage = () => {
  const [lists, setLists] = useLocalStorage<AssemblyList[]>('assemblyLists', initialAssemblyLists);
  const [stockItems] = useLocalStorage<StockItem[]>('stockItems', initialStockItems);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [assemblyItems, setAssemblyItems] = useState<AssemblyItem[]>([]);

  const getStockItem = (id: string) => stockItems.find((s) => s.id === id);

  const resetForm = () => {
    setName('');
    setProductName('');
    setDescription('');
    setAssemblyItems([]);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!name || !productName) return;
    const data = { name, productName, description, items: assemblyItems };
    if (editingId) {
      setLists(lists.map((l) => (l.id === editingId ? { ...l, ...data } : l)));
    } else {
      setLists([...lists, { ...data, id: `asm-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }]);
    }
    setFormOpen(false);
    resetForm();
  };

  const handleEdit = (list: AssemblyList) => {
    setName(list.name);
    setProductName(list.productName);
    setDescription(list.description);
    setAssemblyItems([...list.items]);
    setEditingId(list.id);
    setFormOpen(true);
  };

  const addAssemblyItem = () => {
    setAssemblyItems([...assemblyItems, { stockItemId: '', quantity: 1 }]);
  };

  const updateAssemblyItem = (index: number, field: keyof AssemblyItem, value: string | number) => {
    const updated = [...assemblyItems];
    updated[index] = { ...updated[index], [field]: value };
    setAssemblyItems(updated);
  };

  const removeAssemblyItem = (index: number) => {
    setAssemblyItems(assemblyItems.filter((_, i) => i !== index));
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Listes d'assemblage</h1>
            <p className="text-muted-foreground text-sm mt-1">Nomenclatures de fabrication</p>
          </div>
          <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Nouvelle liste</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Modifier' : 'Nouvelle liste d\'assemblage'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 mt-2">
                <Input placeholder="Nom de la liste *" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Nom du produit final *" value={productName} onChange={(e) => setProductName(e.target.value)} />
                <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Composants</h3>
                    <Button variant="outline" size="sm" onClick={addAssemblyItem}>
                      <Plus className="w-3 h-3 mr-1" />Ajouter
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {assemblyItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Select value={item.stockItemId} onValueChange={(v) => updateAssemblyItem(index, 'stockItemId', v)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Article du stock" />
                          </SelectTrigger>
                          <SelectContent>
                            {stockItems.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name} ({s.sku})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="w-20"
                          placeholder="Qté"
                          value={item.quantity || ''}
                          onChange={(e) => updateAssemblyItem(index, 'quantity', Number(e.target.value))}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeAssemblyItem(index)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    {assemblyItems.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucun composant ajouté</p>
                    )}
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full mt-2">{editingId ? 'Enregistrer' : 'Créer'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {lists.map((list) => (
            <div key={list.id} className="glass-card rounded-xl overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expandedId === list.id ? null : list.id)}
              >
                <div>
                  <h3 className="font-semibold">{list.name}</h3>
                  <p className="text-xs text-muted-foreground">Produit: {list.productName} • {list.items.length} composants</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(list); }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setLists(lists.filter(l => l.id !== list.id)); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {expandedId === list.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === list.id && (
                <div className="border-t border-border/50 p-4">
                  {list.description && <p className="text-sm text-muted-foreground mb-3">{list.description}</p>}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left pb-2 text-xs font-semibold text-muted-foreground uppercase">Composant</th>
                        <th className="text-left pb-2 text-xs font-semibold text-muted-foreground uppercase">SKU</th>
                        <th className="text-right pb-2 text-xs font-semibold text-muted-foreground uppercase">Qté requise</th>
                        <th className="text-right pb-2 text-xs font-semibold text-muted-foreground uppercase">En stock</th>
                        <th className="text-right pb-2 text-xs font-semibold text-muted-foreground uppercase">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.items.map((item, idx) => {
                        const stock = getStockItem(item.stockItemId);
                        const available = stock ? stock.quantity >= item.quantity : false;
                        return (
                          <tr key={idx} className="border-b border-border/20 last:border-0">
                            <td className="py-2 font-medium">{stock?.name ?? 'Inconnu'}</td>
                            <td className="py-2 font-mono text-xs text-muted-foreground">{stock?.sku ?? '—'}</td>
                            <td className="py-2 text-right font-mono">{item.quantity} {stock?.unit}</td>
                            <td className="py-2 text-right font-mono">{stock?.quantity ?? 0} {stock?.unit}</td>
                            <td className="py-2 text-right">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${available ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                                {available ? 'OK' : 'Insuffisant'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {lists.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucune liste d'assemblage</p>
              <p className="text-sm">Créez votre première nomenclature</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AssemblyPage;
