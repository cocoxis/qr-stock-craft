import { useRef, useState } from 'react';
import { FileUp, Loader2, PackagePlus, PackageCheck, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useBulkUpsertStockItems } from '@/hooks/useStockItems';
import { fetchLcscPart, type LcscPart } from '@/lib/lcsc';
import { buildStockItem, parseLcscOrder, type LcscOrderLine } from '@/lib/lcscOrder';
import type { StockItem } from '@/types';

type Status = 'loading' | 'new' | 'existing' | 'notfound';

interface Row {
  line: LcscOrderLine;
  status: Status;
  existing?: StockItem;
  part?: LcscPart | null;
  selected: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: StockItem[];
}

const LcscImportDialog = ({ open, onOpenChange, items }: Props) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const bulkUpsert = useBulkUpsertStockItems();
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const reset = () => { setRows([]); setFileName(''); };

  const updateRow = (code: string, patch: Partial<Row>) =>
    setRows(rs => rs.map(r => (r.line.code === code ? { ...r, ...patch } : r)));

  const handleFile = async (file: File) => {
    let lines: LcscOrderLine[];
    try {
      lines = parseLcscOrder(await file.text());
    } catch (err) {
      toast({ title: 'Import failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
      return;
    }
    setFileName(file.name);

    const findExisting = (code: string) =>
      items.find(i => i.lcscPart?.toUpperCase() === code || i.supplierRef?.toUpperCase() === code);

    const initial: Row[] = lines.map(line => {
      const existing = findExisting(line.code);
      return { line, existing, status: existing ? 'existing' : 'loading', selected: true };
    });
    setRows(initial);

    // Fetch LCSC data for new parts (4 in parallel)
    const queue = initial.filter(r => r.status === 'loading').map(r => r.line.code);
    const worker = async () => {
      for (let code = queue.shift(); code; code = queue.shift()) {
        try {
          const part = await fetchLcscPart(code);
          updateRow(code, { part, status: 'new' });
        } catch {
          // Not found on LCSC: unchecked by default
          updateRow(code, { part: null, status: 'notfound', selected: false });
        }
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
  };

  const loading = rows.some(r => r.status === 'loading');
  const selected = rows.filter(r => r.selected && r.status !== 'loading');
  const counts = {
    new: selected.filter(r => r.status !== 'existing').length,
    existing: selected.filter(r => r.status === 'existing').length,
  };

  const handleImport = () => {
    const now = new Date().toISOString();
    const toSave = selected.map(r =>
      r.existing
        ? { ...r.existing, quantity: r.existing.quantity + r.line.quantity, updatedAt: now }
        : buildStockItem(r.line, r.part ?? null, now),
    );
    bulkUpsert.mutate(toSave, {
      onSuccess: () => {
        toast({
          title: 'Order imported',
          description: `${counts.new} new item(s), ${counts.existing} stock level(s) updated`,
        });
        reset();
        onOpenChange(false);
      },
      onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    });
  };

  const statusBadge = (r: Row) => {
    switch (r.status) {
      case 'loading':
        return <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />LCSC…</span>;
      case 'existing':
        return <span className="flex items-center gap-1 text-primary"><PackageCheck className="w-3 h-3" />{r.existing!.quantity} → {r.existing!.quantity + r.line.quantity}</span>;
      case 'new':
        return <span className="flex items-center gap-1 text-success"><PackagePlus className="w-3 h-3" />New</span>;
      case 'notfound':
        return <span className="flex items-center gap-1 text-warning"><AlertTriangle className="w-3 h-3" />Not found on LCSC</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import an LCSC order</DialogTitle>
          <DialogDescription>
            CSV file exported from LCSC (Order history → Export). Parts already in stock get their
            quantity increased; new ones are created with image and specs.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />

        {rows.length === 0 ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 hover:bg-muted/40 transition-colors"
          >
            <FileUp className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm font-medium">Choose the order CSV file</span>
            <span className="text-xs text-muted-foreground font-mono">LCSC__WMxxxxxxxx_xxxxxxxx.csv</span>
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono text-xs text-muted-foreground truncate">{fileName} — {rows.length} parts</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setRows(rs => rs.map(r => ({ ...r, selected: true })))}>Select all</Button>
                <Button variant="ghost" size="sm" onClick={() => setRows(rs => rs.map(r => ({ ...r, selected: false })))}>Select none</Button>
              </div>
            </div>
            <div className="overflow-auto border border-border rounded-lg flex-1 min-h-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="p-2 w-8" />
                    <th className="p-2 text-left">LCSC #</th>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-left">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.line.code} className="border-b border-border/40">
                      <td className="p-2">
                        <Checkbox
                          checked={r.selected}
                          disabled={r.status === 'loading'}
                          onCheckedChange={(v) => updateRow(r.line.code, { selected: !!v })}
                        />
                      </td>
                      <td className="p-2 font-mono text-xs">{r.line.code}</td>
                      <td className="p-2">
                        <p className="truncate max-w-[280px]">
                          {r.existing?.name ?? (r.status === 'new' ? buildStockItem(r.line, r.part ?? null, '').name : r.line.mpn)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[280px]">{r.line.package} · {r.line.manufacturer}</p>
                      </td>
                      <td className="p-2 text-right font-mono">{r.line.quantity}</td>
                      <td className="p-2 text-xs whitespace-nowrap">{statusBadge(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={reset}>Another file</Button>
              <Button onClick={handleImport} disabled={loading || selected.length === 0 || bulkUpsert.isPending}>
                {(loading || bulkUpsert.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Import {selected.length} part{selected.length > 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LcscImportDialog;
