import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

const QRCodeDisplay = ({ value, size = 120, label }: QRCodeDisplayProps) => (
  <div className="flex flex-col items-center gap-2">
    <div className="qr-container">
      <QRCodeSVG value={value} size={size} level="M" bgColor="white" fgColor="#1a1a2e" />
    </div>
    {label && <span className="text-xs font-mono text-muted-foreground">{label}</span>}
  </div>
);

export default QRCodeDisplay;
