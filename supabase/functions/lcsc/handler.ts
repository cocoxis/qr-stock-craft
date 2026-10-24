// Proxy for the LCSC API: the browser cannot call it directly (no CORS).
// Shared by the Supabase Edge Function (index.ts) and the self-hosted server (server/index.ts).
// GET /functions/v1/lcsc?code=C17673  →  { code, mpn, manufacturer, package, description, image, datasheet, url, price, category, specs }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
  });

export async function lcscHandler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let code = new URL(req.url).searchParams.get('code') ?? '';
  if (!code && req.method === 'POST') code = (await req.json().catch(() => ({})))?.code ?? '';
  code = code.trim().toUpperCase();
  if (!/^C\d+$/.test(code)) return json({ error: 'Invalid LCSC part number (e.g. C17673)' }, 400);

  const res = await fetch(`https://wmsc.lcsc.com/ftps/wm/product/detail?productCode=${code}`, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });
  if (!res.ok) return json({ error: `LCSC responded ${res.status}` }, 502);
  const r = (await res.json())?.result;
  if (!r) return json({ error: `Part ${code} not found on LCSC` }, 404);

  const params: { paramNameEn: string; paramValueEn: string }[] = r.paramVOList ?? [];
  const specs = [
    { name: 'Manufacturer', value: r.brandNameEn },
    { name: 'MPN', value: r.productModel },
    { name: 'Package', value: r.encapStandard },
    ...params.map(p => ({ name: p.paramNameEn, value: p.paramValueEn })),
  ].filter(s => s.value && s.value !== '-');

  return json({
    code,
    mpn: r.productModel ?? '',
    manufacturer: r.brandNameEn ?? '',
    package: r.encapStandard ?? '',
    title: r.productNameEn ?? '',
    description: r.productIntroEn || r.productDescEn || r.productNameEn || '',
    category: r.catalogName ?? '',
    image: r.productImages?.[0] ?? '',
    datasheet: r.pdfUrl ?? '',
    url: `https://www.lcsc.com/product-detail/${code}.html`,
    price: r.productPriceList?.[0]?.usdPrice ?? null,
    specs,
  });
}
