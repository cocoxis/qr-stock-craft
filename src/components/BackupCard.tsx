import { useEffect, useState } from 'react';
import { DatabaseBackup, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BackupStatus {
  at: string | null;
  ok: boolean;
  message: string;
  supabase: boolean;
  intervalHours: number;
}

/** Backup status of the self-hosted server (hidden when the app runs on Supabase directly). */
const BackupCard = () => {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch('/api/backup/status')
      .then(r => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : null))
      .then(setStatus, () => setStatus(null));
  }, []);

  if (!status) return null;

  const runNow = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/backup/run', { method: 'POST' });
      const next = await res.json();
      setStatus(s => (s ? { ...s, ...next } : s));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DatabaseBackup className="w-4 h-4" />
          Backups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Every {status.intervalHours} h: a file on the NAS{status.supabase ? ' and a copy in Supabase' : ''}.
        </p>
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
          {status.at && (status.ok
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-success shrink-0" />
            : <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />)}
          <div>
            <p className="font-medium">{status.at ? new Date(status.at).toLocaleString() : 'No backup yet'}</p>
            <p className="text-muted-foreground">{status.message}</p>
          </div>
        </div>
        <Button variant="outline" onClick={runNow} disabled={running}>
          {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DatabaseBackup className="w-4 h-4 mr-2" />}
          Back up now
        </Button>
      </CardContent>
    </Card>
  );
};

export default BackupCard;
