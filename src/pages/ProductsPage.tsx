import { useState } from 'react';
import { Plus, Search, QrCode, Trash2, Edit2, Camera, Package } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import QRScanner from '@/components/QRScanner';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { useAssemblyLists } from '@/hooks/useAssemblyLists';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';

const ProductsPage = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: assemblyLists = [] } = useAssemblyLists();
  const deleteMutation = useDeleteProduct();
  const [search, setSearch] = useState('');
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const navigate = useNavigate();

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getAssemblyName = (id: string) => assemblyLists.find((a) => a.id === id)?.name ?? '—';

  const handleDeleteConfirmed = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length}/{products.length} produits</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setScannerOpen(true)} title="Scanner QR">
              <Camera className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/products/new/edit')}>
              <Plus className="w-4 h-4 mr-2" />Nouveau produit
            </Button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, SKU, description..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produit</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assemblage</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantité</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && <p className="text-xs text-muted-foreground truncate max-w-[250px]">{product.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {getAssemblyName(product.assemblyListId)}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-mono font-semibold ${product.minQuantity > 0 && product.quantityProduced <= product.minQuantity ? 'text-destructive' : ''}`}>
                      {product.quantityProduced}
                      {product.minQuantity > 0 && (
                        <span className="text-xs text-muted-foreground font-normal ml-1">(min: {product.minQuantity})</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(product.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQrProduct(product)}>
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/products/${product.id}/edit`)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(product)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun produit trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                  showPrint
                  itemName={qrProduct.name}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Supprimer <span className="font-semibold">{deleteConfirm?.name}</span> ({deleteConfirm?.sku}) ? Cette action est irréversible.
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

export default ProductsPage;
