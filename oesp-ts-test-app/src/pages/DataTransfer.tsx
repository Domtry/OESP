import { useState, useEffect } from 'react';
import { Send, Upload, Activity, Clock, Database, AlertCircle } from 'lucide-react';
import { useOespStore } from '@/store/useOespStore';

interface TransferStats {
  bytesTransferred: number;
  packagesSent: number;
  packagesReceived: number;
  duration: number;
  throughput: number;
  latency: number;
}

interface TransferLog {
  id: string;
  timestamp: Date;
  type: 'sent' | 'received';
  size: number;
  status: 'success' | 'error' | 'pending';
  message?: string;
}

export default function DataTransfer() {
  const [isTransferring, setIsTransferring] = useState(false);
  const [stats, setStats] = useState<TransferStats>({
    bytesTransferred: 0,
    packagesSent: 0,
    packagesReceived: 0,
    duration: 0,
    throughput: 0,
    latency: 0
  });
  const [logs, setLogs] = useState<TransferLog[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const { isConnected, deviceName, link, transport, client, init } = useOespStore();

  useEffect(() => {
    init();
  }, [init]);

  const startTransfer = async () => {
    if (!client || !transport || !link || !isConnected) {
      setError('Veuillez vous connecter à un appareil BLE d\'abord.');
      return;
    }

    setIsTransferring(true);
    setError('');
    if (!startTime) setStartTime(Date.now());
    
    const logId = Date.now().toString();
    const newLog: TransferLog = {
      id: logId,
      timestamp: new Date(),
      type: 'sent',
      size: 0,
      status: 'pending'
    };

    setLogs(prev => [newLog, ...prev]);

    try {
      // 1. Generate a real OESP token
      const token = await client.pack('did:oesp:peripheral', {
        command: 'ping',
        data: Math.random().toString(36).substring(7),
        ts: Date.now()
      });

      // Update log with real size
      const tokenSize = new TextEncoder().encode(token).length;
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, size: tokenSize } : l));

      // 2. Send via OESP Transport (Stop-and-Wait)
      await transport.sendToken(token, link);

      // 3. Mark success
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success' } : l));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        packagesSent: prev.packagesSent + 1,
        bytesTransferred: prev.bytesTransferred + tokenSize
      }));

    } catch (err) {
      setError(`Erreur de transfert: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'error', message: String(err) } : l));
    } finally {
      setIsTransferring(false);
    }
  };

  // Update stats in real-time
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const duration = (currentTime - startTime) / 1000; // seconds
      
      const sentLogs = logs.filter(log => log.type === 'sent' && log.status === 'success');
      const receivedLogs = logs.filter(log => log.type === 'received' && log.status === 'success');
      
      const totalBytes = [...sentLogs, ...receivedLogs].reduce((sum, log) => sum + log.size, 0);
      const throughput = duration > 0 ? totalBytes / duration : 0;
      
      setStats(prev => ({
        ...prev,
        bytesTransferred: totalBytes,
        duration,
        throughput,
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [startTime, logs]);

  const resetStats = () => {
    setStats({
      bytesTransferred: 0,
      packagesSent: 0,
      packagesReceived: 0,
      duration: 0,
      throughput: 0,
      latency: 0
    });
    setLogs([]);
    setStartTime(null);
    setIsTransferring(false);
    setError('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-orange-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Transfert OESP</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={startTransfer}
                disabled={isTransferring || !isConnected}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className={`w-5 h-5 mr-2 ${isTransferring ? 'animate-pulse' : ''}`} />
                {isTransferring ? 'Transfert...' : 'Envoyer Token OESP'}
              </button>
              <button
                onClick={resetStats}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {!isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800 text-sm">
                Connectez-vous à un appareil dans le module <span className="font-bold">Connexion BLE</span> pour activer le transfert.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {isConnected && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping mr-2"></div>
                <span className="text-sm font-medium text-green-800">Prêt pour le transfert vers {deviceName}</span>
              </div>
              <span className="text-xs text-green-600 font-mono">MTU: ~20 bytes/frame</span>
            </div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Bytes transférés</p>
                  <p className="text-2xl font-bold text-blue-900">{formatBytes(stats.bytesTransferred)}</p>
                </div>
                <Database className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Packages envoyés</p>
                  <p className="text-2xl font-bold text-green-900">{stats.packagesSent}</p>
                </div>
                <Send className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Débit moyen</p>
                  <p className="text-2xl font-bold text-orange-900">{formatBytes(stats.throughput)}/s</p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Durée session</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.duration)}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Journal des transferts */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Journal OESP (Fragmenté)</h2>
            
            {logs.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full bg-blue-100 text-blue-600`}>
                          <Send className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Token OESP fragmenté
                          </p>
                          <p className="text-sm text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 font-mono">
                          {formatBytes(log.size)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status === 'success' ? 'Succès' : 
                           log.status === 'error' ? 'Erreur' : 'En cours'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun transfert enregistré</p>
                <p className="text-sm text-gray-400 mt-2">Connectez-vous et envoyez un token pour voir les logs</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
