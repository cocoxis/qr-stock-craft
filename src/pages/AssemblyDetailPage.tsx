import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Layers, Calendar } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useAssemblyLists, useDeleteAssemblyList } from '@/hooks/useAssemblyLists';
import { useStockItems } from '@/hooks/useStockItems';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

const AssemblyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lists = [], isLoading } = useAssemblyLists();
  const { data: stockItems = [] } = useStockItems();
  const deleteMutation = useDeleteAssemblyList();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const list = lists.find(l => l.id === id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!list) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Layers className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">Liste d'assemblage introuvable</p>
          <Button variant="outline" onClick={() => navigate('/assembly')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleDelete = () => {
    deleteMutation.mutate(list.id, { onSuccess: () => navigate('/assembly') });
  };

  const getStockItem = (stockId: string) => stockItems.find(s => s.id === stockId);
  const allAvailable = list.items.every(item => {
    const stock = getStockItem(item.stockItemId);
    return stock ? stock.quantity >= item.quantity : false;
  });

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assembly')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{list.name}</h1>
            <p className="text-sm text-muted-foreground">Produit : {list.productName}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => navigate(`/assembly/${list.id}/edit`)}>
              <Edit2 className="w-4 h-4 mr-2" /> Modifier
            </Button>
            <Button variant="destructive" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Statut global</p>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${list.items.length === 0 ? 'bg-muted text-muted-foreground' : allAvailable ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
                  {list.items.length === 0 ? 'Vide' : allAvailable ? 'Complet' : 'Incomplet'}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Composants</p>
                <p className="text-xl font-mono font-bold">{list.items.length}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Créé le {new Date(list.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {list.description && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm leading-relaxed">{list.description}</p>
              </div>
            )}

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nomenclature</p>
              </div>
              {list.items.length > 0 ? (
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
                    {list.items.map((item, idx) => {
                      const stock = getStockItem(item.stockItemId);
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
              ) : (
                <div className="p-8 text-center text-muted-foreground">Aucun composant dans cette liste</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer <span className="font-semibold">{list.name}</span> ? Cette action est irréversible.
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

export default AssemblyDetailPage;
