/**
 * Brother P-touch raster printing (PT-P700 family), bypassing the Windows driver rendering.
 * The app builds the raster command stream; the local relay (scripts/ptouch-relay.ts)
 * writes it unchanged ("RAW") to the Windows print queue.
 */

/** Print head: 128 pins at 180 dpi. */
export const DOTS_PER_MM = 180 / 25.4;
const HEAD_PINS = 128;
const BYTES_PER_LINE = HEAD_PINS / 8;

/** TZe tapes: printable pins and the blank pins before them on the 128-pin head. */
export const TAPES = [
  { width: 6, pins: 32, offset: 48 },
  { width: 9, pins: 50, offset: 39 },
  { width: 12, pins: 70, offset: 29 },
  { width: 18, pins: 112, offset: 8 },
  { width: 24, pins: 128, offset: 0 },
].map(t => ({ ...t, printable: +(t.pins / DOTS_PER_MM).toFixed(2) }));

export type Tape = (typeof TAPES)[number];

export const tapeFor = (width: number): Tape => TAPES.find(t => t.width === width) ?? TAPES[2];

/** A 1-bit label image: `width` dots along the tape, `height` = tape pins. true = black. */
export interface Bitmap {
  width: number;
  height: number;
  data: Uint8Array; // row-major, 1 = black
}

export interface RasterOptions {
  tape: Tape;
  /** Blank tape fed before and after each label, in dots */
  marginDots: number;
  /** Shift the image across the tape, in pins (+ = towards pin 0) */
  pinShift?: number;
}

/** Builds the full raster command stream for a print job (one page per label, cut between). */
export function encodeRaster(pages: Bitmap[], { tape, marginDots, pinShift = 0 }: RasterOptions): Uint8Array {
  const out: number[] = [];
  const push = (...b: number[]) => { for (const x of b) out.push(x); };

  // Invalidate + initialize + switch to raster mode
  for (let i = 0; i < 100; i++) out.push(0x00);
  push(0x1b, 0x40);
  push(0x1b, 0x69, 0x61, 0x01);

  const margin = Math.max(0, Math.min(0xffff, Math.round(marginDots)));

  pages.forEach((page, index) => {
    const lines = page.width;
    // Print information: valid flags (width + recover), media type, width (mm), length, raster lines, page
    push(0x1b, 0x69, 0x7a, 0x84, 0x00, tape.width, 0x00,
      lines & 0xff, (lines >> 8) & 0xff, (lines >> 16) & 0xff, (lines >> 24) & 0xff,
      index === 0 ? 0x00 : 0x01, 0x00);
    push(0x1b, 0x69, 0x4d, 0x40); // various mode: auto cut
    push(0x1b, 0x69, 0x41, 0x01); // cut after every label
    push(0x1b, 0x69, 0x4b, 0x08); // advanced mode: no chain printing (last label is fed and cut)
    push(0x1b, 0x69, 0x64, margin & 0xff, (margin >> 8) & 0xff); // margin (feed) amount
    push(0x4d, 0x02); // TIFF (PackBits) compression

    for (let x = 0; x < lines; x++) {
      const line = new Uint8Array(BYTES_PER_LINE);
      let any = false;
      for (let y = 0; y < page.height; y++) {
        if (!page.data[y * page.width + x]) continue;
        // Bottom row of the image → first printable pin (same convention as ptouch-print)
        const pin = tape.offset + pinShift + (page.height - 1 - y);
        if (pin < 0 || pin >= HEAD_PINS) continue;
        line[BYTES_PER_LINE - 1 - (pin >> 3)] |= 1 << (pin & 7);
        any = true;
      }
      if (!any) { push(0x5a); continue; } // empty raster line
      // PackBits "literal run" of 16 bytes: header 15 + data
      push(0x47, BYTES_PER_LINE + 1, 0x00, BYTES_PER_LINE - 1, ...line);
    }

    push(index === pages.length - 1 ? 0x1a : 0x0c); // print (+ feed) / next page
  });

  return Uint8Array.from(out);
}

// ── Local relay ─────────────────────────────────────────────

export const RELAY_URL = 'http://127.0.0.1:8765';

export interface RelayStatus {
  ok: boolean;
  printer: string | null;
  printers: string[];
}

export async function relayStatus(): Promise<RelayStatus | null> {
  try {
    const res = await fetch(`${RELAY_URL}/status`, { signal: AbortSignal.timeout(1500) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function relayPrint(data: Uint8Array, printer?: string | null): Promise<void> {
  const url = `${RELAY_URL}/print${printer ? `?printer=${encodeURIComponent(printer)}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: data,
  });
  if (!res.ok) throw new Error((await res.text()) || `Relay error ${res.status}`);
}
