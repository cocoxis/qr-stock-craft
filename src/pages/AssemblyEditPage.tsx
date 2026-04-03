import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useAssemblyLists, useUpsertAssemblyList } from '@/hooks/useAssemblyLists';
import { useStockItems } from '@/hooks/useStockItems';
import type { AssemblyItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AssemblyEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lists = [] } = useAssemblyLists();
  const { data: stockItems = [] } = useStockItems();
  const upsertMutation = useUpsertAssemblyList();

  const isNew = !id || id === 'new';
  const existingList = isNew ? null : lists.find(l => l.id === id);

  const [name, setName] = useState(existingList?.name || '');
  const [productName, setProductName] = useState(existingList?.productName || '');
  const [description, setDescription] = useState(existingList?.description || '');
  const [assemblyItems, setAssemblyItems] = useState<AssemblyItem[]>(existingList ? [...existingList.items] : []);

  const addAssemblyItem = () => setAssemblyItems([...assemblyItems, { stockItemId: '', quantity: 1 }]);

  const updateAssemblyItem = (index: number, field: keyof AssemblyItem, value: string | number) => {
    const updated = [...assemblyItems];
    updated[index] = { ...updated[index], [field]: value };
    setAssemblyItems(updated);
  };

  const removeAssemblyItem = (index: number) => setAssemblyItems(assemblyItems.filter((_, i) => i !== index));

  const handleSave = () => {
    if (!name || !productName) return;
    const listId = existingList ? existingList.id : `asm-${Date.now()}`;
    upsertMutation.mutate(
      {
        id: listId,
        name,
        productName,
        description,
        items: assemblyItems,
        createdAt: existingList?.createdAt || new Date().toISOString(),
      },
      { onSuccess: () => navigate(`/assembly/${listId}`) }
    );
  };

  if (!isNew && !existingList) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Liste introuvable</p>
          <Button variant="outline" onClick={() => navigate('/assembly')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(existingList ? `/assembly/${existingList.id}` : '/assembly')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "Nouvelle liste d'assemblage" : `Modifier — ${existingList?.name}`}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={!name || !productName || upsertMutation.isPending}>
            <Save className="w-4 h-4 mr-2" /> {isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border p-5 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informations générales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Nom de la liste *" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Nom du produit final *" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>
            <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Composants</p>
              <Button variant="outline" size="sm" onClick={addAssemblyItem}>
                <Plus className="w-3 h-3 mr-1" />Ajouter
              </Button>
            </div>

            {assemblyItems.length > 0 ? (
              <div className="space-y-2">
                {assemblyItems.map((item, index) => {
                  const stock = stockItems.find(s => s.id === item.stockItemId);
                  return (
                    <div key={index} className="flex gap-2 items-center p-3 rounded-lg border border-border/50 bg-muted/20">
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
                        className="w-24"
                        placeholder="Qté"
                        value={item.quantity || ''}
                        onChange={(e) => updateAssemblyItem(index, 'quantity', Number(e.target.value))}
                      />
                      {stock && (
                        <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                          Stock: {stock.quantity} {stock.unit}
                        </span>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeAssemblyItem(index)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Aucun composant ajouté</p>
                <p className="text-xs">Cliquez sur "Ajouter" pour ajouter des composants</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AssemblyEditPage;
