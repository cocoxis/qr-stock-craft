import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              scanner.stop().catch(() => {});
              onOpenChange(false);
              if (data.type === 'stock') {
                navigate(`/stock?highlight=${data.id}`);
              } else if (data.type === 'product') {
                navigate(`/products?highlight=${data.id}`);
              }
              toast({ title: 'QR scanné', description: `${data.name} (${data.sku})` });
            } catch {
              toast({ title: 'QR scanné', description: decodedText });
            }
          },
          () => {}
        );
      } catch (err) {
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
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
            <Camera className="w-4 h-4" /> Scanner un QR code
          </DialogTitle>
        </DialogHeader>
        {error ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <XCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">{error}</p>
            <Button variant="outline" onClick={() => { setError(''); onOpenChange(false); }}>Fermer</Button>
          </div>
        ) : (
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner;
