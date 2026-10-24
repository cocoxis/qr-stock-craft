// Generic entry: only the two symbologies used here end up in the bundle
import { datamatrix, drawingSVG, qrcode } from 'bwip-js/generic';
import type { StockItem } from '@/types';

/** QR payload for an item: kept short so it stays readable on small labels. */
export const stockQrValue = (item: Pick<StockItem, 'id'>) => JSON.stringify({ type: 'stock', id: item.id });

/** Extracts the stock item id from a scanned code: JSON payload (older labels) or the bare id. */
export function parseStockCode(text: string): string | null {
  const raw = text.trim();
  if (raw.startsWith('stk-')) return raw;
  try {
    const data = JSON.parse(raw);
    return data?.type === 'stock' && typeof data.id === 'string' ? data.id : null;
  } catch {
    return null;
  }
}

export type LabelCodeKind = 'datamatrix' | 'qr' | 'none';

export interface LabelCode {
  svg: string;
  /** Modules per side */
  modules: number;
}

const cache = new Map<string, LabelCode>();

/** 2D code printed on labels. The payload is the bare item id so the symbol stays as small as possible. */
export function labelCode(item: Pick<StockItem, 'id'>, kind: Exclude<LabelCodeKind, 'none'>): LabelCode {
  const key = `${kind}:${item.id}`;
  let code = cache.get(key);
  if (!code) {
    const opts = { bcid: kind === 'qr' ? 'qrcode' : 'datamatrix', text: item.id, scale: 1, paddingwidth: 0, paddingheight: 0 };
    // Lowest error correction keeps the QR at version 1 (21 modules)
    const qrOpts = { ...opts, eclevel: 'L' } as typeof opts;
    const svg: string = kind === 'qr' ? qrcode(qrOpts, drawingSVG()) : datamatrix(opts, drawingSVG());
    // bwip-js draws 2 units per module at scale 1
    const size = Number(/viewBox="0 0 (\d+)/.exec(svg)?.[1] ?? 0);
    code = { svg, modules: size / 2 };
    cache.set(key, code);
  }
  return code;
}
