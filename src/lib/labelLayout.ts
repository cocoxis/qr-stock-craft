import type { StockItem } from '@/types';
import { DOTS_PER_MM, tapeFor, type Bitmap } from '@/lib/ptouch';
import { labelCode, type LabelCode, type LabelCodeKind } from '@/lib/qr';

export type FieldKey = 'value' | 'name' | 'mpn' | 'footprint' | 'lcsc' | 'location' | 'sku';

const specValue = (i: StockItem, name: string) =>
  i.specs?.find(s => s.name.toLowerCase() === name.toLowerCase())?.value || '';

export const FIELDS: { key: FieldKey; label: string; get: (i: StockItem) => string }[] = [
  { key: 'value', label: 'Value', get: i => i.componentValue || '' },
  { key: 'name', label: 'Name', get: i => i.name },
  { key: 'mpn', label: 'MPN', get: i => specValue(i, 'MPN') },
  { key: 'footprint', label: 'Package', get: i => i.componentFootprint || '' },
  { key: 'lcsc', label: 'LCSC #', get: i => i.lcscPart || '' },
  { key: 'location', label: 'Location', get: i => i.location || '' },
  { key: 'sku', label: 'SKU', get: i => i.sku },
];

export type LabelMode = 'box' | 'custom';

/** Where the code goes. Auto: left on long labels, bottom corner (with lines beside it) on tall ones. */
export type CodePosition = 'auto' | 'left' | 'right' | 'top' | 'bottom';

export interface LabelSettings {
  mode: LabelMode;
  tape: number;
  /** Total length of tape per label, in mm (margins included) */
  length: number;
  /** 2D code printed at the start of the label */
  code: LabelCodeKind;
  /** Printer dots per code module (2 = 0.28 mm, 3 = 0.42 mm) */
  codeDots: number;
  codePos: CodePosition;
  /** Text lines, in print order */
  fields: FieldKey[];
  /** Auto-cut after every N labels (0 = only at the end). Groups of several labels get scissor marks between them. */
  cutEvery: number;
}

/** Per-printer adjustments, saved in the browser. All values in mm. */
export interface Calibration {
  /** Blank tape fed before and after each cut label */
  tapeMargin: number;
  /** Extra blank space before the content */
  offsetStart: number;
  /** Shifts the content across the tape (+ = towards the bottom edge) */
  offsetTop: number;
  /** Usable print height (0 = full printable area of the tape) */
  printHeight: number;
}

export const DEFAULT_CALIBRATION: Calibration = { tapeMargin: 2, offsetStart: 0, offsetTop: 0, printHeight: 0 };

/** The PT-P700 will not cut a piece shorter than this (head-to-cutter distance), mm */
export const MIN_CUT_LENGTH = 23.5;

/** Labels per cut piece, raised so every piece is long enough for the cutter. 0 = one piece. */
export function effectiveCutEvery(s: Pick<LabelSettings, 'length' | 'cutEvery'>): number {
  if (s.cutEvery <= 0) return 0;
  return Math.max(s.cutEvery, Math.ceil(MIN_CUT_LENGTH / s.length));
}

/** Blank kept at each end of a label inside a strip, so a slightly off scissor cut does not hit the print */
const STRIP_PAD = 0.8;

/** Blank at each end of a label and printed length of its content, mm. */
export function labelLength(s: Pick<LabelSettings, 'length' | 'cutEvery'>, cal: Calibration) {
  const margin = effectiveCutEvery(s) === 1 ? Math.max(0, cal.tapeMargin) : STRIP_PAD;
  return { margin, content: Math.max(5, s.length - 2 * margin) };
}

let measureCtx: CanvasRenderingContext2D | null | undefined;

/** Width of `text` in bold sans, relative to the font size (measured, so capitals are not underestimated). */
function textRatio(text: string): number {
  if (measureCtx === undefined) {
    measureCtx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
    if (measureCtx) measureCtx.font = `bold 100px ${FONT_SANS}`;
  }
  return measureCtx ? measureCtx.measureText(text).width / 100 : text.length * 0.65;
}

/** Whole printer dots per module, so every module prints with the same size. Shrinks to fit `h`. */
const codeDotsFor = (modules: number, wanted: number, h: number) =>
  Math.max(1, Math.min(wanted, Math.floor((h * DOTS_PER_MM) / modules)));
const LINE_HEIGHT = 1.1;
const FONT_SANS = 'Arial, Helvetica, sans-serif';

export interface LabelLine {
  text: string;
  size: number; // mm
  bold: boolean;
  /** Position of the line box inside the print area, mm */
  x: number;
  y: number;
  width: number;
}

export interface LabelLayout {
  tapeWidth: number;
  /** Printed length (without the tape margins), mm */
  length: number;
  /** Print height actually used, mm */
  h: number;
  offsetTop: number;
  code: LabelCode | null;
  /** Printer dots per module */
  codeScale: number;
  codeX: number;
  codeY: number;
  codeSize: number;
  lines: LabelLine[];
}

const MIN_TEXT = 1.2;

/** Size (mm) of each text in a block of `height` mm, shrunk to fit `width`. The first one is the title if `title`. */
function blockSizes(texts: string[], width: number, height: number, title: boolean, cap: number): number[] {
  const n = texts.length;
  // 2% spare so rounding at 180 dpi never triggers the ellipsis
  const fit = (text: string, size: number) => Math.max(MIN_TEXT, Math.min(size, (width * 0.98) / textRatio(text)));
  if (!title) return texts.map(t => Math.min(cap, fit(t, height / (n * LINE_HEIGHT))));
  const titleSize = Math.min(height * 0.45, n === 1 ? height * 0.6 : height / (n + 0.6), cap);
  const textSize = Math.min(titleSize * 0.75, height / (n + 0.4));
  const titleFit = fit(texts[0], titleSize);
  // Secondary lines never get bigger than the title
  return texts.map((t, i) => (i === 0 ? titleFit : Math.min(titleFit * 0.85, fit(t, textSize))));
}

/** Places a block of lines, vertically centred in the given box. */
function placeBlock(texts: string[], sizes: number[], x: number, y: number, width: number, height: number, firstBold: boolean): LabelLine[] {
  const blockHeight = sizes.reduce((sum, size) => sum + size * LINE_HEIGHT, 0);
  let top = y + (height - blockHeight) / 2;
  return texts.map((text, i) => {
    const line = { text, size: sizes[i], bold: firstBold && i === 0, x, y: top, width };
    top += sizes[i] * LINE_HEIGHT;
    return line;
  });
}

/** Computes where everything goes on one label. Shared by the screen preview and the printer bitmap. */
export function layoutLabel(item: StockItem, s: LabelSettings, cal: Calibration): LabelLayout {
  const tape = tapeFor(s.tape);
  const h = Math.min(tape.printable, cal.printHeight || tape.printable);
  const length = labelLength(s, cal).content;

  const get = (key: FieldKey) => FIELDS.find(f => f.key === key)!.get(item);
  const texts = (s.mode === 'box'
    ? [get('value') || get('mpn') || item.name, ...s.fields.filter(k => k !== 'value').map(get)]
    : s.fields.map(get))
    .filter(Boolean)
    .filter((v, idx, arr) => arr.indexOf(v) === idx);
  // Without any field, the name becomes the title
  if (texts.length === 0) texts.push(item.name);
  const shown = texts.slice(0, Math.max(1, Math.floor(h / 2.2)));

  // Short labels (ESD box) get tight spacing so the text keeps room next to the code
  const compact = length < 25;
  const padX = compact ? 0.3 : 1.5;
  const gap = compact ? 0.8 : 1.5;
  const code = s.code === 'none' ? null : labelCode(item, s.code);
  const codeScale = code ? codeDotsFor(code.modules, s.codeDots, h) : 0;
  const codeSize = code ? (codeScale * code.modules) / DOTS_PER_MM : 0;
  const left = cal.offsetStart + padX;
  const right = length - padX;
  const fullWidth = Math.max(1, right - left);
  const centredX = left + (fullWidth - codeSize) / 2;
  // Quiet zone of at least 3 modules between the text and the code (Data Matrix detectors need it)
  const vgap = Math.max(0.6, (3 * codeScale) / DOTS_PER_MM);
  const base = { tapeWidth: s.tape, length, h, offsetTop: cal.offsetTop, code, codeScale, codeSize };

  const pos: CodePosition = !code ? 'left' : s.mode === 'box' ? 'bottom' : s.codePos;
  const textBlock = (x: number, y: number, width: number, height: number) =>
    placeBlock(shown, blockSizes(shown, width, height, true, Infinity), x, y, width, height, true);

  if (code && (pos === 'top' || pos === 'bottom')) {
    const textHeight = Math.max(1, h - codeSize - vgap);
    return pos === 'top'
      ? { ...base, codeX: centredX, codeY: 0, lines: textBlock(left, codeSize + vgap, fullWidth, textHeight) }
      : { ...base, codeX: centredX, codeY: h - codeSize, lines: textBlock(left, 0, fullWidth, textHeight) };
  }

  if (code && pos === 'right') {
    const width = Math.max(1, right - codeSize - gap - left);
    return { ...base, codeX: right - codeSize, codeY: (h - codeSize) / 2, lines: textBlock(left, 0, width, h) };
  }

  // Auto on a tall label (18 mm+ tape on a short length): title rows across the full width,
  // the code in the bottom corner with the last lines beside it.
  if (code && pos === 'auto' && h >= length * 0.75) {
    const topHeight = h - codeSize - vgap;
    const sideX = left + codeSize + gap;
    const sideWidth = Math.max(1, right - sideX);
    let best: { score: number; lines: LabelLine[] } | null = null;
    // Try 0..3 lines next to the code, keep the arrangement with the biggest smallest text
    for (let k = 0; k <= Math.min(3, shown.length - 1); k++) {
      const top = shown.slice(0, shown.length - k);
      const side = shown.slice(shown.length - k);
      const topSizes = blockSizes(top, fullWidth, topHeight, true, Infinity);
      // Lines beside the code are never bigger than the secondary lines above
      const sideCap = topSizes.length > 1 ? Math.max(...topSizes.slice(1)) : topSizes[0] * 0.85;
      const sideSizes = blockSizes(side, sideWidth, codeSize, false, sideCap);
      const all = [...topSizes, ...sideSizes];
      const height = (sizes: number[]) => sizes.reduce((sum, size) => sum + size * LINE_HEIGHT, 0);
      if (height(topSizes) > topHeight + 0.01 || height(sideSizes) > codeSize + 0.01) continue;
      const score = Math.min(...all) * 10 + all.reduce((a, b) => a + b, 0) / all.length;
      if (!best || score > best.score + 1e-6) {
        best = {
          score,
          lines: [
            ...placeBlock(top, topSizes, left, 0, fullWidth, topHeight, true),
            ...placeBlock(side, sideSizes, sideX, h - codeSize, sideWidth, codeSize, false),
          ],
        };
      }
    }
    if (best) {
      // Nothing beside the code: centre it under the text
      const alone = best.lines.every(l => l.x === left);
      return { ...base, codeX: alone ? centredX : left, codeY: h - codeSize, lines: best.lines };
    }
  }

  // Code on the left (or no code), text block next to it
  const textX = left + (code ? codeSize + gap : 0);
  return { ...base, codeX: left, codeY: (h - codeSize) / 2, lines: textBlock(textX, 0, Math.max(1, right - textX), h) };
}

// Everything is bold sans: thin strokes disappear at 180 dpi
export const lineFont = (_line: LabelLine, sizePx: number) => `bold ${sizePx}px ${FONT_SANS}`;

export const lineFontFamily = (_line: LabelLine) => FONT_SANS;

export { LINE_HEIGHT };

export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

function loadSvg(svg: string, size: number): Promise<HTMLImageElement> {
  const url = svgDataUrl(svg.replace('<svg ', `<svg width="${size}" height="${size}" `));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Code could not be rendered'));
    img.src = url;
  });
}

/**
 * Draws a label at printer resolution (180 dpi) and returns it as a 1-bit bitmap.
 */
export async function renderLabelBitmap(layout: LabelLayout): Promise<Bitmap> {
  const tape = tapeFor(layout.tapeWidth);
  const k = DOTS_PER_MM;
  const width = Math.round(layout.length * k);
  const height = tape.pins;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000';

  const areaTop = ((tape.printable - layout.h) / 2 + layout.offsetTop) * k;

  if (layout.code) {
    // Drawn at 1 px per module, then scaled up without smoothing: crisp, identical modules
    const { modules } = layout.code;
    const size = layout.codeScale * modules;
    const img = await loadSvg(layout.code.svg, modules);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(layout.codeX * k), Math.round(areaTop + layout.codeY * k), size, size);
  }

  ctx.textBaseline = 'top';
  for (const line of layout.lines) {
    const px = line.size * k;
    ctx.font = lineFont(line, px);
    let text = line.text;
    while (text.length > 1 && ctx.measureText(text).width > line.width * k) text = text.slice(0, -2) + '…';
    // Centred horizontally in its line box
    const x = line.x * k + (line.width * k - ctx.measureText(text).width) / 2;
    ctx.fillText(text, Math.round(x), Math.round(areaTop + line.y * k + (LINE_HEIGHT - 1) * px / 2));
  }

  // Threshold to 1 bit
  const { data } = ctx.getImageData(0, 0, width, height);
  const bits = new Uint8Array(width * height);
  for (let i = 0; i < bits.length; i++) {
    const lum = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
    bits[i] = lum < 160 ? 1 : 0; // slightly bold threshold keeps small text readable
  }
  return { width, height, data: bits };
}

/**
 * Joins labels into one strip, each centred in a slot of `slotMm`, with cut marks on the tape edges
 * at every boundary. Used when labels are too short for the printer's cutter.
 */
export function joinStrip(labels: Bitmap[], slotMm: number): Bitmap {
  const slot = Math.round(slotMm * DOTS_PER_MM);
  const height = labels[0].height;
  const width = slot * labels.length;
  const data = new Uint8Array(width * height);
  labels.forEach((label, i) => {
    const x0 = i * slot + Math.floor((slot - label.width) / 2);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < label.width; x++)
        if (label.data[y * label.width + x]) data[y * width + x0 + x] = 1;
  });
  // Cut marks: 1.2 mm ticks from both edges, 2 dots wide
  const tick = Math.round(1.2 * DOTS_PER_MM);
  for (let i = 0; i <= labels.length; i++) {
    const x = Math.min(width - 2, Math.max(0, i * slot - 1));
    for (let y = 0; y < tick; y++)
      for (const dx of [0, 1]) {
        data[y * width + x + dx] = 1;
        data[(height - 1 - y) * width + x + dx] = 1;
      }
  }
  return { width, height, data };
}
