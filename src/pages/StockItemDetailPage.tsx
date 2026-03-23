import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, QrCode, Calendar, Clock, ExternalLink, Package } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useWorkspaceStorage } from '@/hooks/useWorkspaceStorage';
import { initialStockItems } from '@/data/initialData';
import type { StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

const StockItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStorageKey } = useWorkspaceContext();
  const [items, setItems] = useWorkspaceStorage<StockItem[]>(getStorageKey('stockItems'), initialStockItems);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const item = items.find(i => i.id === id);

  if (!item) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Package className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">Article introuvable</p>
          <Button variant="outline" onClick={() => navigate('/stock')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au stock
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleDelete = () => {
    setItems(items.filter(i => i.id !== item.id));
    navigate('/stock');
  };

  const stockPercent = item.minQuantity > 0 ? Math.min(100, (item.quantity / item.minQuantity) * 100) : 100;
  const isCritical = item.quantity <= item.minQuantity;

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/stock')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{item.name}</h1>
            <p className="text-sm font-mono text-muted-foreground">{item.sku}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => navigate(`/stock?edit=${item.id}`)}>
              <Edit2 className="w-4 h-4 mr-2" /> Modifier
            </Button>
            <Button variant="destructive" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: image + QR */}
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

            {/* QR Code */}
            <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2">
              <QRCodeDisplay
                value={JSON.stringify({ type: 'stock', id: item.id, sku: item.sku, name: item.name })}
                size={120}
                label={item.sku}
                showPrint
                itemName={item.name}
              />
            </div>

            {/* Dates */}
            <div className="rounded-xl border border-border p-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Créé le {new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              {item.updatedAt && item.updatedAt !== item.createdAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Modifié le {new Date(item.updatedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right column: details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {item.description && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Quantité</p>
                <p className={`text-xl font-mono font-bold ${isCritical ? 'text-destructive' : 'text-foreground'}`}>
                  {item.quantity}
                </p>
                <p className="text-xs text-muted-foreground">{item.unit} (min: {item.minQuantity})</p>
                {/* Stock bar */}
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isCritical ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Prix unitaire</p>
                <p className="text-xl font-mono font-bold">{item.price.toFixed(2)}€</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Valeur totale</p>
                <p className="text-xl font-mono font-bold text-primary">
                  {(item.quantity * item.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Emplacement</p>
                <p className="text-xl font-mono font-bold">{item.location || '—'}</p>
              </div>
            </div>

            {/* Category + Supplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Catégorie</p>
                <span className="inline-block text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                  {item.category || '—'}
                </span>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-2">Fournisseur</p>
                <p className="text-sm font-medium">{item.supplier || '—'}</p>
                {item.supplierRef && (
                  <p className="text-xs font-mono text-muted-foreground mt-1">Réf: {item.supplierRef}</p>
                )}
                {item.supplierLink && (
                  <a href={item.supplierLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Lien fournisseur
                  </a>
                )}
              </div>
            </div>

            {/* Component-specific fields */}
            {item.category?.toLowerCase() === 'composants' && (item.componentValue || item.componentVoltage || item.componentFootprint) && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Détails composant</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Valeur</p>
                    <p className="text-sm font-medium">{item.componentValue || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tension</p>
                    <p className="text-sm font-medium">{item.componentVoltage || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">FootPrint</p>
                    <p className="text-sm font-medium">{item.componentFootprint || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Screw-specific fields */}
            {item.category?.toLowerCase() === 'visserie' && (item.screwType || item.screwLength || item.screwShape) && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Détails visserie</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <p className="text-sm font-medium">{item.screwType || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Longueur</p>
                    <p className="text-sm font-medium">{item.screwLength || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Forme</p>
                    <p className="text-sm font-medium">{item.screwShape || '—'}</p>
                  </div>
                </div>
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
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{item.name}</span> ({item.sku}) ? Cette action est irréversible.
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

export default StockItemDetailPage;
