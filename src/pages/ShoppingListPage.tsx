import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Archive, Trash2, ChevronRight, Package, ExternalLink } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useShoppingLists, useShoppingListWithItems, useCreateShoppingList,
  useArchiveShoppingList, useDeleteShoppingList, useAddShoppingListItem,
  useToggleShoppingListItem, useRemoveShoppingListItem,
  type ShoppingList,
} from '@/hooks/useShoppingLists';
import { useStockItems } from '@/hooks/useStockItems';

const ShoppingListPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: activeLists = [], isLoading: loadingActive } = useShoppingLists('active');
  const { data: archivedLists = [], isLoading: loadingArchived } = useShoppingLists('archived');
  const { data: stockItems = [] } = useStockItems();

  const createList = useCreateShoppingList();
  const archiveList = useArchiveShoppingList();
  const deleteList = useDeleteShoppingList();
  const addItem = useAddShoppingListItem();
  const toggleItem = useToggleShoppingListItem();
  const removeItem = useRemoveShoppingListItem();

  const [newListName, setNewListName] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showAddFromStock, setShowAddFromStock] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [addManualName, setAddManualName] = useState('');
  const [addManualQty, setAddManualQty] = useState('1');

  const { data: selectedList } = useShoppingListWithItems(selectedListId ?? undefined);

  const filteredStock = stockItems.filter(s =>
    s.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    s.sku.toLowerCase().includes(stockSearch.toLowerCase())
  );

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    createList.mutate(newListName.trim(), {
      onSuccess: () => { setNewListName(''); toast({ title: 'List created' }); },
      onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const handleAddFromStock = (item: typeof stockItems[0]) => {
    if (!selectedListId) return;
    addItem.mutate({
      shopping_list_id: selectedListId,
      name: item.name,
      sku: item.sku,
      quantity: 1,
      unit: item.unit,
      supplier: item.supplier,
      supplier_link: item.supplierLink,
    }, {
      onSuccess: () => toast({ title: `${item.name} added` }),
      onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const handleAddManual = () => {
    if (!selectedListId || !addManualName.trim()) return;
    addItem.mutate({
      shopping_list_id: selectedListId,
      name: addManualName.trim(),
      sku: null,
      quantity: parseInt(addManualQty) || 1,
      unit: 'pcs',
      supplier: null,
      supplier_link: null,
    }, {
      onSuccess: () => { setAddManualName(''); setAddManualQty('1'); toast({ title: 'Item added' }); },
      onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const renderListCard = (list: ShoppingList, isArchived = false) => (
    <Card
      key={list.id}
      className={`cursor-pointer transition-all hover:shadow-md ${selectedListId === list.id ? 'ring-2 ring-primary' : ''}`}
      onClick={() => setSelectedListId(list.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${isArchived ? 'bg-muted' : 'bg-primary/10'}`}>
              <ShoppingCart className={`w-4 h-4 ${isArchived ? 'text-muted-foreground' : 'text-primary'}`} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{list.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(list.created_at).toLocaleDateString('en-US')}
                {list.archived_at && ` · Archived ${new Date(list.archived_at).toLocaleDateString('en-US')}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isArchived && (
              <Button size="icon" variant="ghost" className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); setConfirmArchive(list.id); }}>
                <Archive className="w-4 h-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(list.id); }}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const isLoading = loadingActive || loadingArchived;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Shopping lists</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your restock orders</p>
          </div>
        </div>

        {/* Create new list */}
        <div className="flex gap-2">
          <Input
            placeholder="New list name..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
            className="max-w-xs"
          />
          <Button onClick={handleCreateList} disabled={!newListName.trim()}>
            <Plus className="w-4 h-4 mr-2" /> Create
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: lists */}
          <div>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  Active
                  {activeLists.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{activeLists.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Archived
                  {archivedLists.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{archivedLists.length}</Badge>}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="space-y-2 mt-3">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : activeLists.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No active lists</p>
                ) : (
                  activeLists.map(l => renderListCard(l))
                )}
              </TabsContent>
              <TabsContent value="archived" className="space-y-2 mt-3">
                {archivedLists.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No archived lists</p>
                ) : (
                  archivedLists.map(l => renderListCard(l, true))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: selected list detail */}
          <div>
            {selectedList ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="truncate">{selectedList.name}</span>
                    {selectedList.status === 'active' && (
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setShowAddFromStock(true)}>
                          <Package className="w-4 h-4 mr-1" /> From stock
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Manual add */}
                  {selectedList.status === 'active' && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add an item..."
                        value={addManualName}
                        onChange={(e) => setAddManualName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={addManualQty}
                        onChange={(e) => setAddManualQty(e.target.value)}
                        className="w-16"
                        min="1"
                      />
                      <Button size="icon" onClick={handleAddManual} disabled={!addManualName.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Items */}
                  {(!selectedList.items || selectedList.items.length === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No items in this list</p>
                  ) : (
                    <div className="space-y-1">
                      {selectedList.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            disabled={selectedList.status === 'archived'}
                            onChange={() => toggleItem.mutate({ id: item.id, checked: !item.checked })}
                            className="h-4 w-4 rounded border-border"
                          />
                          <div className={`flex-1 min-w-0 ${item.checked ? 'line-through opacity-50' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{item.name}</span>
                              {item.sku && <Badge variant="outline" className="text-[10px] font-mono">{item.sku}</Badge>}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{item.quantity} {item.unit}</span>
                              {item.supplier && <span>· {item.supplier}</span>}
                              {item.supplier_link && (
                                <a href={item.supplier_link} target="_blank" rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">
                                  <ExternalLink className="w-3 h-3 inline" />
                                </a>
                              )}
                            </div>
                          </div>
                          {selectedList.status === 'active' && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                              onClick={() => removeItem.mutate(item.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                Select a list to see its content
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add from stock dialog */}
      <Dialog open={showAddFromStock} onOpenChange={setShowAddFromStock}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add from stock</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search for an item..."
            value={stockSearch}
            onChange={(e) => setStockSearch(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No items found</p>
            ) : (
              filteredStock.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleAddFromStock(item)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sku} · {item.quantity} {item.unit} in stock</p>
                  </div>
                  <Plus className="w-4 h-4 text-primary shrink-0" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive confirm */}
      <AlertDialog open={!!confirmArchive} onOpenChange={() => setConfirmArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this list?</AlertDialogTitle>
            <AlertDialogDescription>The list will be marked as ordered and archived. You can still view it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (confirmArchive) {
                archiveList.mutate(confirmArchive, {
                  onSuccess: () => { toast({ title: 'List archived' }); setConfirmArchive(null); if (selectedListId === confirmArchive) setSelectedListId(null); },
                });
              }
            }}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this list?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
              if (confirmDelete) {
                deleteList.mutate(confirmDelete, {
                  onSuccess: () => { toast({ title: 'List deleted' }); setConfirmDelete(null); if (selectedListId === confirmDelete) setSelectedListId(null); },
                });
              }
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default ShoppingListPage;
