import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/integrations/supabase/client';

export interface Spec {
  name: string;
  value: string;
}

export interface LcscPart {
  code: string;
  mpn: string;
  manufacturer: string;
  package: string;
  /** Short LCSC product title, e.g. "MOSFET N-CH 60V 115mA SOT-23" */
  title?: string;
  description: string;
  category: string;
  image: string;
  datasheet: string;
  url: string;
  price: number | null;
  specs: Spec[];
}

export const isLcscCode = (code: string) => /^C\d{3,}$/i.test(code.trim());

/** Fetches image + specs for an LCSC part through the `lcsc` Edge Function. */
export async function fetchLcscPart(code: string): Promise<LcscPart> {
  const url = `${SUPABASE_URL}/functions/v1/lcsc?code=${encodeURIComponent(code.trim().toUpperCase())}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.error) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data as LcscPart;
}
