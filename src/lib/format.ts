/** Formats a USD price; small unit prices (LCSC parts) keep up to 4 decimals. */
export function formatPrice(value: number, decimals?: number) {
  const digits = decimals ?? (value !== 0 && Math.abs(value) < 1 ? 4 : 2);
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Math.min(2, digits),
    maximumFractionDigits: digits,
  });
}
