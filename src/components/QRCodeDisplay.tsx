import { QRCodeSVG } from 'qrcode.react';
import { useState, useRef } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
  showPrint?: boolean;
  itemName?: string;
}

const QR_PRINT_SIZES = [
  { value: '60', label: '20×20mm' },
  { value: '100', label: '35×35mm' },
  { value: '150', label: '50×50mm' },
  { value: '200', label: '70×70mm' },
  { value: '300', label: '100×100mm' },
];

const QRCodeDisplay = ({ value, size = 120, label, showPrint = false, itemName }: QRCodeDisplayProps) => {
  const [printSize, setPrintSize] = useState('150');
  const qrRef = useRef<HTMLDivElement>(null);

  const handlePrintQR = () => {
    const pxSize = Number(printSize);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Render a hidden QR at the chosen size and print it
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(tempDiv);

    // Use the SVG approach: re-create inline
    printWindow.document.write(`
      <html><head><title>QR Code - ${itemName || label || ''}</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; }
        .qr-print { text-align: center; }
        .qr-print svg { width: ${pxSize}px; height: ${pxSize}px; }
        .qr-label { margin-top: 8px; font-size: ${Math.max(10, pxSize / 12)}px; font-family: monospace; color: #333; }
        .qr-name { margin-bottom: 8px; font-size: ${Math.max(12, pxSize / 10)}px; font-weight: 600; color: #111; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="qr-print">
        ${itemName ? `<div class="qr-name">${itemName}</div>` : ''}
        <div id="qr-target"></div>
        ${label ? `<div class="qr-label">${label}</div>` : ''}
      </div>
      </body></html>
    `);
    printWindow.document.close();

    // Inject QR SVG into print window
    const target = printWindow.document.getElementById('qr-target');
    if (target && qrRef.current) {
      const svgEl = qrRef.current.querySelector('svg');
      if (svgEl) {
        const cloned = svgEl.cloneNode(true) as SVGElement;
        cloned.setAttribute('width', String(pxSize));
        cloned.setAttribute('height', String(pxSize));
        target.appendChild(cloned);
      }
    }

    document.body.removeChild(tempDiv);
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {itemName && (
        <span className="text-sm font-semibold text-foreground text-center max-w-[180px] truncate">{itemName}</span>
      )}
      <div className="qr-container" ref={qrRef}>
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          bgColor="white"
          fgColor="#1a1a2e"
        />
      </div>
      {label && (
        <span className="text-xs font-mono text-muted-foreground">{label}</span>
      )}
      {showPrint && (
        <div className="flex items-center gap-2 mt-1">
          <Select value={printSize} onValueChange={setPrintSize}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QR_PRINT_SIZES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8" onClick={handlePrintQR}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Imprimer
          </Button>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
