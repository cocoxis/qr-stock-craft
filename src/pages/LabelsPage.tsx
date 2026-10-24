import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, Search, Tag, Minus, Plus, Loader2, Usb, Globe, ChevronUp, ChevronDown } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useStockItems } from '@/hooks/useStockItems';
import { useToast } from '@/hooks/use-toast';
import type { LabelCodeKind } from '@/lib/qr';
import { DOTS_PER_MM, TAPES, encodeRaster, relayPrint, relayStatus, tapeFor, type RelayStatus } from '@/lib/ptouch';
import {
  DEFAULT_CALIBRATION, FIELDS, LINE_HEIGHT, MIN_CUT_LENGTH, effectiveCutEvery, joinStrip, labelLength, layoutLabel, lineFontFamily, renderLabelBitmap, svgDataUrl,
  type Calibration, type CodePosition, type FieldKey, type LabelMode, type LabelSettings,
} from '@/lib/labelLayout';
import type { StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LENGTHS = [20, 25, 30, 40, 50, 60];

const CODE_POSITIONS: [CodePosition, string][] = [
  ['auto', 'Auto'], ['left', 'Left'], ['right', 'Right'], ['top', 'Top'], ['bottom', 'Bottom'],
];

const CODES: [LabelCodeKind, string][] = [['qr', 'QR code'], ['datamatrix', 'Data Matrix (smallest)'], ['none', 'No code']];

// ESD box: label face is 19 mm wide × 17 mm high → 19 mm of 18 mm tape
const BOX = { tape: 18, length: 19, faceWidth: 19, faceHeight: 17 };

/** ESD box defaults: value, then the chosen number below it, and a Data Matrix */
const BOX_SETTINGS = { tape: BOX.tape, length: BOX.length, code: 'datamatrix', codeDots: 3, cutEvery: 10 } as const;

type BoxSecond = 'lcsc' | 'sku';

const CALIBRATION_KEY = 'label-calibration-v2';

function loadCalibration(): Calibration {
  try {
    return { ...DEFAULT_CALIBRATION, ...JSON.parse(localStorage.getItem(CALIBRATION_KEY) ?? '{}') };
  } catch {
    return DEFAULT_CALIBRATION;
  }
}

/**
 * One label at real size (mm), laid out exactly like the printer bitmap.
 * `guides` shows the tape margins and print area (screen preview only).
 */
const Label = ({ item, s, cal, guides = false }: { item: StockItem; s: LabelSettings; cal: Calibration; guides?: boolean }) => {
  const layout = layoutLabel(item, s, cal);
  const tape = tapeFor(s.tape);
  const areaTop = (s.tape - tape.printable) / 2 + (tape.printable - layout.h) / 2 + layout.offsetTop;

  return (
    <div
      className="ptouch-label"
      data-item-id={item.id}
      style={{ position: 'relative', width: `${s.length}mm`, height: `${s.tape}mm`, background: '#fff', color: '#000', overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute', left: `${(s.length - layout.length) / 2}mm`, top: `${areaTop}mm`,
          width: `${layout.length}mm`, height: `${layout.h}mm`,
          outline: guides ? '0.1mm dashed rgba(0,0,0,0.25)' : undefined,
        }}
      >
        {layout.code && (
          <img
            src={svgDataUrl(layout.code.svg)}
            alt=""
            style={{ position: 'absolute', left: `${layout.codeX}mm`, top: `${layout.codeY}mm`, width: `${layout.codeSize}mm`, height: `${layout.codeSize}mm`, imageRendering: 'pixelated' }}
          />
        )}
        {layout.lines.map((line, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${line.x}mm`,
                top: `${line.y}mm`,
                width: `${line.width}mm`,
                fontSize: `${line.size}mm`,
                lineHeight: LINE_HEIGHT,
                fontWeight: 700,
                textAlign: 'center',
                fontFamily: lineFontFamily(line),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {line.text}
            </div>
          ))}
      </div>
    </div>
  );
};

const LabelsPage = () => {
  const { data: items = [], isLoading } = useStockItems();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [copies, setCopies] = useState<Record<string, number>>(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? [];
    return Object.fromEntries(ids.map(id => [id, 1]));
  });
  const [settings, setSettings] = useState<LabelSettings>({ mode: 'box', ...BOX_SETTINGS, codePos: 'auto', fields: ['value', 'lcsc'] });
  const boxSecond: BoxSecond = settings.fields.includes('sku') ? 'sku' : 'lcsc';

  const setMode = (mode: LabelMode) =>
    setSettings(s => (mode === 'box'
      ? { ...s, mode, ...BOX_SETTINGS, fields: ['value', boxSecond] }
      : { ...s, mode, length: s.length === BOX.length ? 30 : s.length, code: 'qr', codeDots: 2, cutEvery: 1, fields: ['value', 'mpn'] }));

  const [calibration, setCalibrationState] = useState<Calibration>(loadCalibration);
  const setCalibration = (patch: Partial<Calibration>) =>
    setCalibrationState(c => {
      const next = { ...c, ...patch };
      try { localStorage.setItem(CALIBRATION_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });

  // Local print relay (bun run printer)
  const [relay, setRelay] = useState<RelayStatus | null>(null);
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    let alive = true;
    const check = () => relayStatus().then(r => alive && setRelay(r));
    check();
    const t = setInterval(check, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return items.filter(i =>
      (category === 'all' || i.category === category) &&
      [i.name, i.sku, i.lcscPart, i.componentValue, i.componentFootprint, i.location]
        .some(v => v?.toLowerCase().includes(s)),
    );
  }, [items, search, category]);

  const selectedItems = items.filter(i => copies[i.id] > 0);
  const labels = selectedItems.flatMap(i => Array.from({ length: copies[i.id] }, () => i));
  const allFilteredSelected = filtered.length > 0 && filtered.every(i => copies[i.id] > 0);

  const setCopy = (id: string, n: number) =>
    setCopies(c => {
      const next = { ...c };
      if (n > 0) next[id] = Math.min(99, n);
      else delete next[id];
      return next;
    });

  const toggleAllFiltered = () =>
    setCopies(c => {
      const next = { ...c };
      filtered.forEach(i => (allFilteredSelected ? delete next[i.id] : (next[i.id] = next[i.id] || 1)));
      return next;
    });

  const toggleField = (key: FieldKey) =>
    setSettings(s => ({
      ...s,
      fields: s.fields.includes(key) ? s.fields.filter(f => f !== key) : [...s.fields, key],
    }));

  /** Moves a printed line up (-1) or down (+1) */
  const moveField = (key: FieldKey, dir: -1 | 1) =>
    setSettings(s => {
      const fields = [...s.fields];
      const i = fields.indexOf(key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= fields.length) return s;
      [fields[i], fields[j]] = [fields[j], fields[i]];
      return { ...s, fields };
    });

  // Checked fields first, in print order
  const orderedFields = [
    ...settings.fields.map(k => FIELDS.find(f => f.key === k)!),
    ...FIELDS.filter(f => !settings.fields.includes(f.key)),
  ];

  /** Direct printing: bitmap at 180 dpi → Brother raster commands → local relay → RAW print queue. */
  const handleDirectPrint = async () => {
    if (labels.length === 0) return;
    setPrinting(true);
    try {
      const bitmaps = [];
      for (const item of labels) bitmaps.push(await renderLabelBitmap(layoutLabel(item, settings, calibration)));
      const tape = tapeFor(settings.tape);
      const every = effectiveCutEvery(settings);
      let job: Uint8Array;
      if (every === 1) {
        job = encodeRaster(bitmaps, { tape, marginDots: labelLength(settings, calibration).margin * DOTS_PER_MM });
      } else {
        // Labels too short for the cutter: pieces of `every` labels with scissor marks, auto-cut between pieces
        const size = every || bitmaps.length;
        const pieces = [];
        for (let i = 0; i < bitmaps.length; i += size) pieces.push(joinStrip(bitmaps.slice(i, i + size), settings.length));
        job = encodeRaster(pieces, { tape, marginDots: 0 });
      }
      await relayPrint(job, relay?.printer);
      toast({ title: `${labels.length} label${labels.length > 1 ? 's' : ''} sent to ${relay?.printer ?? 'the printer'}` });
    } catch (err) {
      toast({ title: 'Print failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setPrinting(false);
    }
  };

  /** Fallback: browser print dialog (paper size is then decided by the Brother driver). */
  const handleBrowserPrint = () => {
    if (!printRef.current || labels.length === 0) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>StockQR labels</title>
      <style>
        @page { size: ${settings.length}mm ${settings.tape}mm; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        .ptouch-label { page-break-after: always; break-after: page; }
        .ptouch-label:last-child { page-break-after: auto; break-after: auto; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style></head><body>${printRef.current.innerHTML}</body></html>`;

    // Print from a hidden iframe once it has fully loaded (a popup can give a blank preview)
    document.getElementById('label-print-frame')?.remove();
    const frame = document.createElement('iframe');
    frame.id = 'label-print-frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    frame.onload = () => {
      const win = frame.contentWindow;
      if (!win) return;
      win.document.fonts.ready.then(() => {
        win.focus();
        win.print();
      });
    };
    frame.srcdoc = html;
    document.body.appendChild(frame);
  };

  const printLabel = `Print ${labels.length} label${labels.length > 1 ? 's' : ''}`;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Labels</h1>
            <p className="text-muted-foreground text-sm mt-1">Component labels for Brother PT-P700 (TZe tape)</p>
          </div>
          <div className="flex gap-2">
            {relay ? (
              <Button onClick={handleDirectPrint} disabled={labels.length === 0 || printing}>
                {printing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                {printLabel}
              </Button>
            ) : (
              <Button onClick={handleBrowserPrint} disabled={labels.length === 0} variant="outline">
                <Globe className="w-4 h-4 mr-2" /> {printLabel} (browser)
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Item selection */}
          <div className="lg:col-span-3 rounded-xl border border-border p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={allFilteredSelected} onCheckedChange={toggleAllFiltered} />
                Select all ({filtered.length})
              </label>
              <span>{selectedItems.length} item(s) selected</span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-border/40">
              {isLoading && <p className="text-sm text-muted-foreground p-4 text-center">Loading…</p>}
              {filtered.map(item => {
                const n = copies[item.id] ?? 0;
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2 px-1">
                    <Checkbox checked={n > 0} onCheckedChange={v => setCopy(item.id, v ? 1 : 0)} />
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt="" loading="lazy" className="w-8 h-8 rounded object-contain bg-white border border-border shrink-0" />
                      : <div className="w-8 h-8 rounded bg-muted shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {[item.category, item.componentFootprint, item.lcscPart].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {n > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCopy(item.id, n - 1)}><Minus className="w-3 h-3" /></Button>
                        <span className="w-6 text-center font-mono text-sm">{n}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCopy(item.id, n + 1)}><Plus className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settings + preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`rounded-xl border p-4 space-y-2 ${relay ? 'border-success/40' : 'border-warning/40'}`}>
              <div className="flex items-center gap-2">
                <Usb className={`w-4 h-4 ${relay ? 'text-success' : 'text-warning'}`} />
                <p className="text-sm font-medium">
                  {relay ? `Direct printing: ${relay.printer ?? 'no PT-P700 found'}` : 'Print relay not running'}
                </p>
              </div>
              {relay ? (
                <p className="text-xs text-muted-foreground">
                  Labels are sent as raw raster data: exact length, no driver scaling or margins.
                  {relay.printer && (
                    <button className="ml-1 underline hover:text-foreground" onClick={handleBrowserPrint} disabled={labels.length === 0}>
                      Use the browser dialog instead
                    </button>
                  )}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Start it in a terminal from the project folder: <code className="font-mono bg-muted px-1 rounded">bun run printer</code>.
                  Until then, printing goes through the browser dialog and the Brother driver.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border p-4 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tape & format</p>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted">
                {([['box', 'ESD box'], ['custom', 'Custom']] as const).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-md py-1.5 text-sm font-medium transition-colors ${settings.mode === m ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {settings.mode === 'box' ? (
                <p className="text-xs text-muted-foreground">
                  Box face {BOX.faceWidth} × {BOX.faceHeight} mm → <b>{BOX.length} mm</b> of <b>{BOX.tape} mm</b> tape per label.
                  The printer cannot cut pieces under ~{MIN_CUT_LENGTH} mm, so labels are cut in groups:
                  finish with scissors on the marks printed on the tape edges.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tape width</p>
                    <Select value={String(settings.tape)} onValueChange={v => setSettings(s => ({ ...s, tape: Number(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TAPES.map(t => <SelectItem key={t.width} value={String(t.width)}>{t.width} mm</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Length</p>
                    <Select value={String(settings.length)} onValueChange={v => setSettings(s => ({ ...s, length: Number(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LENGTHS.map(l => <SelectItem key={l} value={String(l)}>{l} mm</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Auto-cut</p>
                <Select value={String(effectiveCutEvery(settings))} onValueChange={v => setSettings(s => ({ ...s, cutEvery: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 10]
                      .filter(n => n * settings.length >= MIN_CUT_LENGTH)
                      .map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {n === 1 ? 'After each label' : `Every ${n} labels (${n * settings.length} mm pieces)`}
                        </SelectItem>
                      ))}
                    <SelectItem value="0">Only at the end (one strip)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">Code</p>
              <div className="grid grid-cols-2 gap-3">
                <Select value={settings.code} onValueChange={v => setSettings(s => ({ ...s, code: v as LabelCodeKind }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CODES.map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={String(settings.codeDots)} onValueChange={v => setSettings(s => ({ ...s, codeDots: Number(v) }))} disabled={settings.code === 'none'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Small (0.28 mm dots)</SelectItem>
                    <SelectItem value="3">Large (0.42 mm dots)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings.mode === 'custom' && settings.code !== 'none' && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Code position</p>
                  <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-muted">
                    {CODE_POSITIONS.map(([p, label]) => (
                      <button
                        key={p}
                        onClick={() => setSettings(s => ({ ...s, codePos: p }))}
                        className={`rounded-md py-1 text-xs font-medium transition-colors ${settings.codePos === p ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                The code holds only the item id. Data Matrix is the smallest; aim the camera at the code itself
                (best with Android Chrome's native reader). QR is a bit larger but scans more easily.
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">Content</p>
              {settings.mode === 'box' ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Line under the value</p>
                    <Select value={boxSecond} onValueChange={v => setSettings(s => ({ ...s, fields: ['value', v as BoxSecond] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lcsc">LCSC #</SelectItem>
                        <SelectItem value="sku">SKU (your number)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Parts without a value (ICs…) show their MPN instead.</p>
                </>
              ) : (
                <>
                  <div className="space-y-0.5 text-sm">
                    {orderedFields.map(f => {
                      const idx = settings.fields.indexOf(f.key);
                      return (
                        <div key={f.key} className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-muted/50">
                          <label className="flex flex-1 items-center gap-2 cursor-pointer">
                            <Checkbox checked={idx >= 0} onCheckedChange={() => toggleField(f.key)} />
                            {idx >= 0 && <span className="w-4 text-xs font-mono text-muted-foreground">{idx + 1}</span>}
                            {f.label}
                          </label>
                          {idx >= 0 && (
                            <>
                              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => moveField(f.key, -1)} aria-label={`Move ${f.label} up`}>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === settings.fields.length - 1} onClick={() => moveField(f.key, 1)} aria-label={`Move ${f.label} down`}>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lines print in this order; the first one is bold. Extra lines are hidden on narrow tapes.
                  </p>
                </>
              )}
            </div>

            <div className="rounded-xl border border-border p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Preview {labels.length > 0 && `(${labels.length})`}
              </p>
              {labels.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Tag className="w-8 h-8 opacity-40" />
                  <p className="text-sm">Select items to label</p>
                </div>
              ) : (
                <div className="max-h-[50vh] overflow-auto space-y-2">
                  {/* Preview zoomed ×2.5 (×4 in box mode, shown on the box face). Dashed = printed area. */}
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      {settings.mode === 'box' ? (
                        <div
                          style={{ zoom: 4, width: `${BOX.faceWidth}mm`, height: `${BOX.faceHeight}mm` }}
                          className="rounded-[0.5mm] bg-zinc-700 flex items-center justify-center shrink-0"
                          title="ESD box face"
                        >
                          <Label item={item} s={settings} cal={calibration} guides />
                        </div>
                      ) : (
                        <div style={{ zoom: 2.5 }} className="border border-dashed border-muted-foreground/40 rounded-sm w-fit">
                          <Label item={item} s={settings} cal={calibration} guides />
                        </div>
                      )}
                      {copies[item.id] > 1 && <span className="text-xs font-mono text-muted-foreground">×{copies[item.id]}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Printer calibration</p>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCalibration(DEFAULT_CALIBRATION)}>Reset</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['tapeMargin', 'Tape margin', 'cut labels only', 0.5],
                  ['printHeight', 'Print height', `0 = ${tapeFor(settings.tape).printable} mm`, 0.5],
                  ['offsetStart', 'Start offset', 'blank before code', 0.5],
                  ['offsetTop', 'Vertical offset', '+ down / − up', 0.25],
                ] as const).map(([key, label, hint, step]) => (
                  <div key={key} className="space-y-1">
                    <label htmlFor={`cal-${key}`} className="text-xs font-medium">{label} (mm)</label>
                    <Input
                      id={`cal-${key}`}
                      type="number"
                      step={step}
                      value={calibration[key]}
                      onChange={e => setCalibration({ [key]: Number(e.target.value) || 0 })}
                      className="h-8 font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">{hint}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Cut label too long → lower <b>Tape margin</b>. Code cut at the start → raise <b>Start offset</b>.
                Cut on the top/bottom edge → lower <b>Print height</b> or adjust <b>Vertical offset</b>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-size labels: used by the browser print fallback */}
      <div ref={printRef} aria-hidden style={{ position: 'fixed', left: '-10000px', top: 0 }}>
        {labels.map((item, idx) => <Label key={`${item.id}-${idx}`} item={item} s={settings} cal={calibration} />)}
      </div>
    </AppLayout>
  );
};

export default LabelsPage;
