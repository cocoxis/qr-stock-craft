import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Package, Calendar, Layers } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useWorkspaceStorage } from '@/hooks/useWorkspaceStorage';
import { initialProducts, initialAssemblyLists, initialStockItems } from '@/data/initialData';
import type { Product, AssemblyList, StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStorageKey } = useWorkspaceContext();
  const [products, setProducts] = useWorkspaceStorage<Product[]>(getStorageKey('products'), initialProducts);
  const [assemblyLists] = useWorkspaceStorage<AssemblyList[]>(getStorageKey('assemblyLists'), initialAssemblyLists);
  const [stockItems] = useWorkspaceStorage<StockItem[]>(getStorageKey('stockItems'), initialStockItems);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const product = products.find(p => p.id === id);
  const assembly = product ? assemblyLists.find(a => a.id === product.assemblyListId) : null;

  if (!product) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Package className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">Produit introuvable</p>
          <Button variant="outline" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux produits
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleDelete = () => {
    setProducts(products.filter(p => p.id !== product.id));
    navigate('/products');
  };

  const isCritical = product.minQuantity > 0 && product.quantityProduced <= product.minQuantity;

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/products')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{product.name}</h1>
            <p className="text-sm font-mono text-muted-foreground">{product.sku}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => navigate(`/products/${product.id}/edit`)}>
              <Edit2 className="w-4 h-4 mr-2" /> Modifier
            </Button>
            <Button variant="destructive" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: QR + dates */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2">
              <QRCodeDisplay
                value={JSON.stringify({ type: 'product', id: product.id, sku: product.sku, name: product.name })}
                size={120}
                label={product.sku}
                showPrint
                itemName={product.name}
              />
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Créé le {new Date(product.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>

          {/* Right: details */}
          <div className="lg:col-span-2 space-y-6">
            {product.description && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Quantité produite</p>
                <p className={`text-xl font-mono font-bold ${isCritical ? 'text-destructive' : 'text-foreground'}`}>
                  {product.quantityProduced}
                </p>
                {product.minQuantity > 0 && (
                  <p className="text-xs text-muted-foreground">min: {product.minQuantity}</p>
                )}
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Liste d'assemblage</p>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">{assembly?.name ?? '—'}</p>
                </div>
              </div>
              {assembly && (
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Composants</p>
                  <p className="text-xl font-mono font-bold">{assembly.items.length}</p>
                </div>
              )}
            </div>

            {/* Assembly BOM */}
            {assembly && assembly.items.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nomenclature — {assembly.name}</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Composant</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">SKU</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Qté requise</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">En stock</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assembly.items.map((item, idx) => {
                      const stock = stockItems.find(s => s.id === item.stockItemId);
                      const available = stock ? stock.quantity >= item.quantity : false;
                      return (
                        <tr key={idx} className="border-b border-border/20 last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => stock && navigate(`/stock/${stock.id}`)}>
                          <td className="p-3 font-medium">{stock?.name ?? 'Inconnu'}</td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">{stock?.sku ?? '—'}</td>
                          <td className="p-3 text-right font-mono">{item.quantity} {stock?.unit}</td>
                          <td className="p-3 text-right font-mono">{stock?.quantity ?? 0} {stock?.unit}</td>
                          <td className="p-3 text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${available ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
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
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer <span className="font-semibold">{product.name}</span> ({product.sku}) ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default ProductDetailPage;
