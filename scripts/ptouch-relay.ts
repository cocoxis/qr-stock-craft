/**
 * Local print relay for the Brother PT-P700.
 * The app sends ready-made raster commands; they are written RAW to the Windows print queue.
 *
 *   bun run printer            (default printer: first one whose name contains "PT-P700")
 *   PTOUCH_PRINTER="..." bun run printer
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 8765;
const RAW_PRINT = join(import.meta.dir, 'raw-print.ps1');

function run(cmd: string, args: string[]): Promise<{ code: number; out: string }> {
  return new Promise(resolve => {
    const p = spawn(cmd, args, { windowsHide: true });
    let out = '';
    p.stdout.on('data', d => (out += d));
    p.stderr.on('data', d => (out += d));
    p.on('close', code => resolve({ code: code ?? 1, out: out.trim() }));
  });
}

async function listPrinters(): Promise<string[]> {
  const { out } = await run('powershell', ['-NoProfile', '-Command', 'Get-Printer | ForEach-Object Name']);
  return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

let printers = await listPrinters();
const defaultPrinter = process.env.PTOUCH_PRINTER || printers.find(p => /PT-?P?700/i.test(p)) || null;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Private-Network': 'true',
};

Bun.serve({
  hostname: '127.0.0.1',
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    if (url.pathname === '/status') {
      printers = await listPrinters();
      return Response.json({ ok: true, printer: defaultPrinter, printers }, { headers: cors });
    }

    if (url.pathname === '/print' && req.method === 'POST') {
      const printer = url.searchParams.get('printer') || defaultPrinter;
      if (!printer) return new Response('No PT-P700 printer found', { status: 400, headers: cors });
      const bytes = new Uint8Array(await req.arrayBuffer());
      if (bytes.length === 0) return new Response('Empty job', { status: 400, headers: cors });

      const dir = mkdtempSync(join(tmpdir(), 'ptouch-'));
      const file = join(dir, 'job.bin');
      writeFileSync(file, bytes);
      const { code, out } = await run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', RAW_PRINT, '-Printer', printer, '-Path', file]);
      rmSync(dir, { recursive: true, force: true });
      console.log(`[${new Date().toLocaleTimeString()}] ${bytes.length} bytes → ${printer}: ${code === 0 ? 'OK' : out}`);
      return code === 0
        ? new Response('OK', { headers: cors })
        : new Response(out || 'Print failed', { status: 500, headers: cors });
    }

    return new Response('Not found', { status: 404, headers: cors });
  },
});

console.log(`P-touch relay listening on http://127.0.0.1:${PORT}`);
console.log(`Printer: ${defaultPrinter ?? '(none found — set PTOUCH_PRINTER)'}`);
