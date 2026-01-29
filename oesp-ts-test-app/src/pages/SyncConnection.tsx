import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Wifi, Smartphone, Monitor, Loader2, UploadCloud, Camera, X } from 'lucide-react';
import { OESPSyncClient } from '@oesp/sync-http';
import sodium from 'libsodium-wrappers-sumo';

export default function SyncConnection() {
  const [mode, setMode] = useState<'host' | 'client' | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hostUrl, setHostUrl] = useState<string>('http://localhost:8000');
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncLog, setSyncLog] = useState<string[]>([]);

  // Generate a random session ID for the host
  useEffect(() => {
    if (mode === 'host') {
      const newSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setSessionId(newSessionId);
    }
  }, [mode]);

  // Initialize QR scanner when in client mode
  useEffect(() => {
    if (mode === 'client' && isScanning && !scanResult) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          setScanResult(decodedText);
          setIsScanning(false);
          scanner.clear();
        },
        () => {
          // Ignore scanning errors as they happen frequently
        }
      );

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [mode, isScanning, scanResult]);

  const handleSync = async () => {
    if (!scanResult) return;
    
    setSyncStatus('syncing');
    setSyncLog(prev => [...prev, "Initialisation de la synchronisation..."]);

    try {
      await sodium.ready;
      const data = JSON.parse(scanResult);
      
      if (data.type !== 'oesp-sync' || !data.sid || !data.url) {
        throw new Error("Format QR code invalide");
      }

      setSyncLog(prev => [...prev, `Serveur cible: ${data.url}`]);
      setSyncLog(prev => [...prev, `Session ID: ${data.sid}`]);

      const client = new OESPSyncClient({
        baseUrl: data.url,
        sha256: async (bytes) => sodium.crypto_hash_sha256(bytes)
      });

      // Dummy tokens for demonstration
      const dummyTokens = [
        "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.dummy1.signature",
        "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.dummy2.signature"
      ];

      setSyncLog(prev => [...prev, `Envoi de ${dummyTokens.length} tokens...`]);

      const result = await client.syncTokens(dummyTokens, "did:oesp:test-device", {
        clientMeta: { userAgent: navigator.userAgent }
      });

      if (result.success) {
        setSyncStatus('success');
        setSyncLog(prev => [...prev, `Succès ! ${result.uploadedCount} tokens envoyés.`]);
      } else {
        throw new Error(result.error || "Erreur inconnue lors du sync");
      }

    } catch (e: unknown) {
      console.error(e);
      setSyncStatus('error');
      const message = e instanceof Error ? e.message : String(e);
      setSyncLog(prev => [...prev, `Erreur: ${message}`]);
      
      // Fallback for demo purposes if server is not reachable
      if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        setSyncLog(prev => [...prev, "⚠️ Note: Le serveur de sync n'est pas joignable (attendu si aucun serveur ne tourne)."]);
        setSyncLog(prev => [...prev, "La logique client a été exécutée correctement."]);
      }
    }
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Wifi className="w-8 h-8 text-blue-600" />
            Connexion Sync (QR Code)
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              onClick={() => setMode('host')}
              className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border-2 border-transparent hover:border-blue-500 transition-all group"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Monitor className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Mode PC (Host)</h2>
              <p className="text-center text-gray-600">
                Générer un QR Code pour permettre à un autre appareil de se connecter.
              </p>
            </button>

            <button
              onClick={() => setMode('client')}
              className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border-2 border-transparent hover:border-purple-500 transition-all group"
            >
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Mode Téléphone (Client)</h2>
              <p className="text-center text-gray-600">
                Scanner un QR Code pour se connecter à un PC.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => {
            setMode(null);
            setScanResult(null);
            setSessionId('');
            setSyncStatus('idle');
            setSyncLog([]);
          }}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Retour
        </button>

        {mode === 'host' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Scanner pour connecter</h2>
            
            <div className="mb-6 max-w-sm mx-auto text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL du Serveur Sync</label>
              <input 
                type="text" 
                value={hostUrl} 
                onChange={(e) => setHostUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="http://192.168.1.x:3000"
              />
              <p className="text-xs text-gray-500 mt-1">L'URL que le téléphone utilisera pour envoyer les données.</p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white border-2 border-gray-100 rounded-xl">
                <QRCodeSVG 
                  value={JSON.stringify({ type: 'oesp-sync', sid: sessionId, url: hostUrl })} 
                  size={256} 
                />
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Session ID: <span className="font-mono font-bold text-gray-900">{sessionId}</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>En attente de connexion...</span>
            </div>
          </div>
        )}

        {mode === 'client' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Scanner le QR Code</h2>
            
            {!scanResult ? (
              isScanning ? (
                <div className="space-y-4">
                  <div id="reader" className="overflow-hidden rounded-lg border-2 border-gray-100"></div>
                  <button
                    onClick={() => setIsScanning(false)}
                    className="w-full py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Annuler le scan
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 group"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <Camera className="w-8 h-8" />
                  </div>
                  <span className="text-lg font-medium">Appuyer pour scanner</span>
                </button>
              )
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-700 mb-2">QR Code Détecté !</h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left overflow-auto">
                  <pre className="text-sm font-mono text-gray-600 whitespace-pre-wrap break-all">
                    {scanResult}
                  </pre>
                </div>

                {syncStatus === 'idle' && (
                  <button
                    onClick={handleSync}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Démarrer la Synchronisation
                    <UploadCloud className="w-5 h-5" />
                  </button>
                )}

                {syncStatus === 'syncing' && (
                  <div className="w-full py-3 bg-blue-50 text-blue-600 rounded-lg font-semibold flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Synchronisation en cours...
                  </div>
                )}

                {syncStatus === 'success' && (
                  <div className="w-full py-3 bg-green-50 text-green-600 rounded-lg font-semibold flex items-center justify-center gap-2">
                    Synchronisation Terminée !
                  </div>
                )}

                {syncStatus === 'error' && (
                  <div className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-semibold flex items-center justify-center gap-2">
                    Erreur de Synchronisation
                  </div>
                )}
                
                {/* Log Console */}
                <div className="mt-6 text-left bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto">
                  {syncLog.map((log, i) => (
                    <div key={i}>&gt; {log}</div>
                  ))}
                  {syncLog.length === 0 && <span className="text-gray-500">Prêt...</span>}
                </div>

                <button
                  onClick={() => {
                    setScanResult(null);
                    setSyncStatus('idle');
                    setSyncLog([]);
                  }}
                  className="mt-4 text-gray-500 hover:text-gray-700 underline"
                >
                  Scanner à nouveau
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
