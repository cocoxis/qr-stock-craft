import { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Printer, Layers } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useAssemblyLists, useDeleteAssemblyList } from '@/hooks/useAssemblyLists';
import { useStockItems } from '@/hooks/useStockItems';
import type { AssemblyList } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';

const AssemblyPage = () => {
  const { data: lists = [], isLoading } = useAssemblyLists();
  const { data: stockItems = [] } = useStockItems();
  const deleteMutation = useDeleteAssemblyList();
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<AssemblyList | null>(null);
  const navigate = useNavigate();

  const getStockItem = (id: string) => stockItems.find((s) => s.id === id);

  const filtered = lists.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.productName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirmed = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handlePrintList = (list: AssemblyList) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${list.name} - StockQR</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { font-size: 18px; } h2 { font-size: 14px; color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .right { text-align: right; } .mono { font-family: monospace; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>${list.name}</h1>
      <h2>Produit: ${list.productName} — ${new Date().toLocaleDateString('fr-FR')}</h2>
      ${list.description ? `<p>${list.description}</p>` : ''}
      <table><thead><tr><th>Composant</th><th>SKU</th><th class="right">Qté requise</th><th class="right">En stock</th><th>Statut</th></tr></thead>
      <tbody>
        ${list.items.map(item => {
          const stock = getStockItem(item.stockItemId);
          const ok = stock ? stock.quantity >= item.quantity : false;
          return `<tr><td>${stock?.name ?? 'Inconnu'}</td><td class="mono">${stock?.sku ?? '—'}</td><td class="right mono">${item.quantity} ${stock?.unit ?? ''}</td><td class="right mono">${stock?.quantity ?? 0} ${stock?.unit ?? ''}</td><td>${ok ? '✓ OK' : '✗ Insuffisant'}</td></tr>`;
        }).join('')}
      </tbody></table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
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
            <h1 className="text-2xl font-bold tracking-tight">Listes d'assemblage</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length}/{lists.length} nomenclatures</p>
          </div>
          <Button onClick={() => navigate('/assembly/new/edit')}>
            <Plus className="w-4 h-4 mr-2" />Nouvelle liste
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, produit..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produit</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Composants</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((list) => {
                  const allAvailable = list.items.every(item => {
                    const stock = getStockItem(item.stockItemId);
                    return stock ? stock.quantity >= item.quantity : false;
                  });
                  const hasItems = list.items.length > 0;

                  return (
                    <tr
                      key={list.id}
                      className="border-b border-border/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/assembly/${list.id}`)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4 text-secondary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{list.name}</p>
                            {list.description && <p className="text-xs text-muted-foreground truncate max-w-[250px]">{list.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{list.productName}</td>
                      <td className="p-3 text-right font-mono">{list.items.length}</td>
                      <td className="p-3 text-right">
                        {hasItems ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${allAvailable ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>
                            {allAvailable ? 'Complet' : 'Incomplet'}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(list.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePrintList(list)} title="Imprimer">
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/assembly/${list.id}/edit`)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(list)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">Aucune liste d'assemblage trouvée</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Supprimer <span className="font-semibold">{deleteConfirm?.name}</span> ? Cette action est irréversible.
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
      </div>
    </AppLayout>
  );
};

export default AssemblyPage;
