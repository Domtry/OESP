import { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle } from 'lucide-react';
import { useOespStore } from '@/store/useOespStore';
import { DecodedMessage } from '@oesp/sdk';

export default function PackageDecoding() {
  const [token, setToken] = useState<string>('');
  const [decoded, setDecoded] = useState<DecodedMessage | null>(null);
  const [error, setError] = useState<string>('');

  const { init, client } = useOespStore();

  useEffect(() => {
    init();
  }, [init]);

  const decodeToken = async () => {
    if (!client) {
      setError('Client OESP non initialisé');
      return;
    }
    setError('');
    try {
      const result = await client.unpack(token);
      setDecoded(result);
    } catch (err) {
      setError(`Erreur de décodage: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      setDecoded(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const text = await file.text();
      setToken(text.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <FileText className="w-8 h-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Analyseur OESP (SDK)</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Saisir un Token</h2>
              
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Collez votre token OESP1.xxx ici..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs break-all"
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white text-sm text-gray-500">OU</span>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Charger un fichier .txt</p>
                </label>
              </div>

              <button
                onClick={decodeToken}
                className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                Analyser le Token
              </button>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Analyse du Message</h2>
              
              {decoded ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Token valide et vérifié</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Métadonnées</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID Message:</span>
                        <span className="font-mono">{decoded.mid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expéditeur:</span>
                        <span className="font-mono text-xs">{decoded.fromDid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Destinataire:</span>
                        <span className="font-mono text-xs">{decoded.toDid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span>{new Date(decoded.ts * 1000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Contenu (Plaintext)</h3>
                    <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-64 overflow-y-auto">
                      <pre>{new TextDecoder().decode(decoded.plaintext)}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun token analysé</p>
                  <p className="text-sm text-gray-400 mt-2">Saisissez un token pour voir les détails</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
