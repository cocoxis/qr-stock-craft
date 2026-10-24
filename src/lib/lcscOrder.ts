import type { StockItem } from '@/types';
import type { LcscPart } from '@/lib/lcsc';
import { categorizeComponent } from '@/lib/categories';

/** One line of an LCSC order CSV export. */
export interface LcscOrderLine {
  code: string;
  mpn: string;
  manufacturer: string;
  package: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

/** Reads an "LCSC__WMxxxx.csv" file exported from the LCSC order history. */
export function parseLcscOrder(text: string): LcscOrderLine[] {
  const [header, ...lines] = parseCsv(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  const col = (name: string) => header?.findIndex(h => h.trim().toLowerCase() === name.toLowerCase()) ?? -1;
  const idx = {
    code: col('LCSC Part Number'),
    mpn: col('Manufacture Part Number'),
    manufacturer: col('Manufacturer'),
    package: col('Package'),
    description: col('Description'),
    quantity: col('Quantity'),
    unitPrice: col('Unit Price($)'),
  };
  if (idx.code < 0 || idx.quantity < 0) {
    throw new Error('This file does not look like an LCSC order ("LCSC Part Number" and "Quantity" columns not found).');
  }
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
  const clean = (s: string) => (s === '-' ? '' : s);

  // The same part can appear several times: quantities are summed
  const byCode = new Map<string, LcscOrderLine>();
  for (const r of lines) {
    const code = get(r, idx.code).toUpperCase();
    if (!/^C\d+$/.test(code)) continue;
    const quantity = Number(get(r, idx.quantity)) || 0;
    const prev = byCode.get(code);
    if (prev) { prev.quantity += quantity; continue; }
    byCode.set(code, {
      code,
      mpn: clean(get(r, idx.mpn)),
      manufacturer: clean(get(r, idx.manufacturer)),
      package: clean(get(r, idx.package)),
      description: clean(get(r, idx.description)),
      quantity,
      unitPrice: Number(get(r, idx.unitPrice)) || 0,
    });
  }
  return [...byCode.values()];
}

const specValue = (part: LcscPart | null, name: string) =>
  part?.specs.find(s => s.name === name)?.value ?? '';

/** Human-readable name built from the LCSC data. */
function buildName(line: LcscOrderLine, part: LcscPart | null): { name: string; value: string; voltage: string } {
  const pkg = part?.package || line.package;
  const desc = `${line.description} ${part?.category ?? ''}`;
  const voltage = specValue(part, 'Voltage Rating') || desc.match(/\b(\d+(?:\.\d+)?V)\b/)?.[1] || '';

  const resistance = specValue(part, 'Resistance') || desc.match(/([\d.]+(?:k|M)?Ω)/)?.[1] || '';
  if (/resistor/i.test(desc) && resistance) {
    const kind = /array|network/i.test(desc) ? 'Resistor array' : 'Resistor';
    return { name: `${kind} ${resistance} ${pkg}`.trim(), value: resistance, voltage };
  }
  const capacitance = (specValue(part, 'Capacitance') || desc.match(/\b([\d.]+[pnuµ]F)\b/)?.[1] || '').replace('u', 'µ');
  if (/capacitor/i.test(desc) && capacitance) {
    const kind = /electrolytic/i.test(desc) ? 'Electrolytic' : /ceramic/i.test(desc) ? 'Ceramic' : /tantalum/i.test(desc) ? 'Tantalum' : '';
    return { name: `${kind} capacitor ${capacitance} ${voltage} ${pkg}`.replace(/\s+/g, ' ').trim().replace(/^c/, 'C'), value: capacitance, voltage };
  }
  const inductance = (specValue(part, 'Inductance') || desc.match(/\b([\d.]+[nuµ]H)\b/)?.[1] || '').replace('u', 'µ');
  if (/inductor/i.test(desc) && inductance) {
    return { name: `Inductor ${inductance} ${pkg}`.trim(), value: inductance, voltage: '' };
  }
  // Other parts: "MPN — short LCSC title", e.g. "2N7002 — MOSFET N-CH 60V 115mA SOT-23"
  const mpn = part?.mpn || line.mpn || line.code;
  if (part?.title) return { name: `${mpn} — ${part.title}`, value: '', voltage };
  return { name: [mpn, pkg].filter(Boolean).join(' '), value: '', voltage };
}

/** Builds a new stock item from an order line (+ LCSC data when available). */
export function buildStockItem(line: LcscOrderLine, part: LcscPart | null, now: string): StockItem {
  const { name, value, voltage } = buildName(line, part);
  const pkg = part?.package || line.package;
  const specs = part?.specs ?? [
    { name: 'Manufacturer', value: line.manufacturer },
    { name: 'MPN', value: line.mpn },
    { name: 'Package', value: pkg },
  ].filter(s => s.value);
  const intro = part?.description || line.description;
  return {
    id: `stk-lcsc-${line.code}`,
    name,
    sku: `COMP-${line.code}`,
    category: categorizeComponent(line.description, part?.title, part?.category),
    description: [intro, [line.manufacturer, line.mpn].filter(Boolean).join(' ')].filter(Boolean).join(' — '),
    supplier: 'LCSC',
    supplierRef: line.code,
    supplierLink: part?.url || `https://www.lcsc.com/product-detail/${line.code}.html`,
    imageUrl: part?.image ?? '',
    quantity: line.quantity,
    minQuantity: Math.max(1, Math.round(line.quantity / 5)),
    unit: 'pcs',
    location: '',
    price: line.unitPrice,
    componentValue: value,
    componentVoltage: voltage,
    componentFootprint: pkg,
    screwType: '',
    screwLength: '',
    screwShape: '',
    link: part?.datasheet ?? '',
    lcscPart: line.code,
    specs,
    createdAt: now,
    updatedAt: now,
  };
}
