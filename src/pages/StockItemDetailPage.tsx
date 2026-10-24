import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, QrCode, Calendar, Clock, ExternalLink, Package, ShoppingCart, Tag } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { stockQrValue } from '@/lib/qr';
import { formatPrice } from '@/lib/format';
import { isElectronicCategory } from '@/lib/categories';
import { useStockItems, useDeleteStockItem } from '@/hooks/useStockItems';
import type { StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useShoppingLists, useAddShoppingListItem } from '@/hooks/useShoppingLists';
import { useToast } from '@/hooks/use-toast';

const StockItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: items = [], isLoading } = useStockItems();
  const deleteMutation = useDeleteStockItem();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showListPicker, setShowListPicker] = useState(false);
  const [addQty, setAddQty] = useState(1);
  const [selectedListForAdd, setSelectedListForAdd] = useState<string | null>(null);
  const { data: activeLists = [] } = useShoppingLists('active');
  const addItem = useAddShoppingListItem();

  const item = items.find(i => i.id === id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Package className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">Item not found</p>
          <Button variant="outline" onClick={() => navigate('/stock')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to stock
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleDelete = () => {
    deleteMutation.mutate(item.id, { onSuccess: () => navigate('/stock') });
  };

  const handleAddToList = (listId: string) => {
    if (!item) return;
    addItem.mutate({
      shopping_list_id: listId,
      name: item.name,
      sku: item.sku,
      quantity: addQty,
      unit: item.unit,
      supplier: item.supplier,
      supplier_link: item.supplierLink,
    }, {
      onSuccess: () => {
        toast({ title: `${addQty}× ${item.name} added to the list` });
        setShowListPicker(false);
        setSelectedListForAdd(null);
        setAddQty(1);
      },
      onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const stockPercent = item.minQuantity > 0 ? Math.min(100, (item.quantity / item.minQuantity) * 100) : 100;
  const isCritical = item.quantity <= item.minQuantity;

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/stock')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{item.name}</h1>
            <p className="text-sm font-mono text-muted-foreground">{item.sku}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => setShowListPicker(true)}>
              <ShoppingCart className="w-4 h-4 mr-2" /> Shopping list
            </Button>
            <Button variant="outline" onClick={() => navigate(`/stock/${item.id}/edit`)}>
              <Edit2 className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {item.imageUrl ? (
              <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                <img src={item.imageUrl} alt={item.name} className="w-full aspect-square object-contain p-4" />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 flex items-center justify-center aspect-square">
                <Package className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}

            <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2">
              <QRCodeDisplay value={stockQrValue(item)} size={120} label={item.sku} />
              <Button variant="outline" size="sm" onClick={() => navigate(`/labels?ids=${encodeURIComponent(item.id)}`)}>
                <Tag className="w-3.5 h-3.5 mr-1.5" /> Create label
              </Button>
            </div>

            <div className="rounded-xl border border-border p-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created {new Date(item.createdAt).toLocaleDateString('en-US')}</span>
              </div>
              {item.updatedAt && item.updatedAt !== item.createdAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Updated {new Date(item.updatedAt).toLocaleDateString('en-US')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {item.description && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm leading-relaxed">{item.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                <p className={`text-xl font-mono font-bold ${isCritical ? 'text-destructive' : 'text-foreground'}`}>
                  {item.quantity}
                </p>
                <p className="text-xs text-muted-foreground">{item.unit} (min: {item.minQuantity})</p>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isCritical ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Unit price</p>
                <p className="text-xl font-mono font-bold">{formatPrice(item.price)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Total value</p>
                <p className="text-xl font-mono font-bold text-primary">
                  {formatPrice(item.quantity * item.price, 2)}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="text-xl font-mono font-bold">{item.location || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <span className="inline-block text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                  {item.category || '—'}
                </span>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-2">Supplier</p>
                <p className="text-sm font-medium">{item.supplier || '—'}</p>
                {item.supplierRef && (
                  <p className="text-xs font-mono text-muted-foreground mt-1">Ref: {item.supplierRef}</p>
                )}
                {item.supplierLink && (
                  <a href={item.supplierLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Supplier link
                  </a>
                )}
              </div>
            </div>

            {item.link && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-2">Datasheet</p>
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" /> Open datasheet
                  </Button>
                </a>
              </div>
            )}

            {(item.lcscPart || (item.specs && item.specs.length > 0)) && (
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplier part number</p>
                  {item.lcscPart && (
                    <a
                      href={`https://www.lcsc.com/product-detail/${item.lcscPart}.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-primary hover:underline flex items-center gap-1"
                    >
                      LCSC {item.lcscPart} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {item.specs && item.specs.length > 0 && (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {item.specs.map(s => (
                      <div key={s.name} className="flex justify-between gap-3 border-b border-border/40 py-1">
                        <dt className="text-muted-foreground">{s.name}</dt>
                        <dd className="font-medium text-right">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}

            {isElectronicCategory(item.category) && (item.componentValue || item.componentVoltage || item.componentFootprint) && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Component details</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><p className="text-xs text-muted-foreground mb-1">Value</p><p className="text-sm font-medium">{item.componentValue || '—'}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Voltage</p><p className="text-sm font-medium">{item.componentVoltage || '—'}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Package</p><p className="text-sm font-medium">{item.componentFootprint || '—'}</p></div>
                </div>
              </div>
            )}

            {item.category?.toLowerCase() === 'hardware' && (item.screwType || item.screwLength || item.screwShape) && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Hardware details</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><p className="text-xs text-muted-foreground mb-1">Type</p><p className="text-sm font-medium">{item.screwType || '—'}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Length</p><p className="text-sm font-medium">{item.screwLength || '—'}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Shape</p><p className="text-sm font-medium">{item.screwShape || '—'}</p></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{item.name}</span> ({item.sku}) ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shopping list picker */}
      <Dialog open={showListPicker} onOpenChange={(open) => { setShowListPicker(open); if (!open) { setSelectedListForAdd(null); setAddQty(1); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to a shopping list</DialogTitle>
          </DialogHeader>
          {activeLists.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">No active list</p>
              <Button variant="outline" onClick={() => navigate('/shopping')}>
                Create a list
              </Button>
            </div>
          ) : selectedListForAdd ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                How many <span className="font-medium text-foreground">{item?.name}</span> to add?
              </p>
              <div className="flex items-center gap-3 justify-center">
                <Button size="icon" variant="outline" onClick={() => setAddQty(Math.max(1, addQty - 1))}>−</Button>
                <Input
                  type="number"
                  value={addQty}
                  onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center text-lg font-mono"
                  min="1"
                />
                <Button size="icon" variant="outline" onClick={() => setAddQty(addQty + 1)}>+</Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">{item?.unit}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedListForAdd(null)}>Back</Button>
                <Button className="flex-1" onClick={() => handleAddToList(selectedListForAdd)}>
                  Add {addQty} {item?.unit}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {activeLists.map(list => (
                <button
                  key={list.id}
                  onClick={() => setSelectedListForAdd(list.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors text-left"
                >
                  <ShoppingCart className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{list.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(list.created_at).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default StockItemDetailPage;
