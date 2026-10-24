import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { parseStockCode } from '@/lib/qr';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QRScanner = ({ open, onOpenChange }: QRScannerProps) => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader', {
          // Labels use Data Matrix (smaller); older labels and the app screens use QR
          formatsToSupport: [Html5QrcodeSupportedFormats.DATA_MATRIX, Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
          // Native reader (Android Chrome) is much better at small Data Matrix codes than the JS fallback
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            const id = parseStockCode(decodedText);
            if (id) {
              scanner.stop().catch(() => {});
              onOpenChange(false);
              navigate(`/stock/${id}`);
            }
            toast({ title: 'Code scanned', description: id ?? decodedText });
          },
          () => {}
        );
      } catch (err) {
        setError("Cannot access the camera. Check permissions.");
      }
    };

    const timer = setTimeout(startScanner, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, navigate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; } onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-4 h-4" /> Scan a code
          </DialogTitle>
        </DialogHeader>
        {error ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <XCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">{error}</p>
            <Button variant="outline" onClick={() => { setError(''); onOpenChange(false); }}>Close</Button>
          </div>
        ) : (
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner;
