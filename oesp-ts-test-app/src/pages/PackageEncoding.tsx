import { useState, useEffect } from 'react';
import { Package, Download, Copy, Check } from 'lucide-react';
import { useOespStore } from '@/store/useOespStore';

export default function PackageEncoding() {
  const [toDid, setToDid] = useState('did:oesp:demo-recipient');
  const [payload, setPayload] = useState('{"message": "Hello OESP!"}');
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');

  const { init, client } = useOespStore();

  useEffect(() => {
    init();
  }, [init]);

  const encodePackage = async () => {
    if (!client) {
      setError('Client OESP non initialisé');
      return;
    }
    setError('');
    try {
      // Try to parse payload as JSON if possible, otherwise send as string/Uint8Array
      let body: any;
      try {
        body = JSON.parse(payload);
      } catch (e) {
        body = payload;
      }

      const packed = await client.pack(toDid, body);
      setToken(packed);
    } catch (err) {
      setError(`Erreur d'encodage: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  const copyToClipboard = async () => {
    if (token) {
      try {
        await navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Erreur de copie:', error);
      }
    }
  };

  const downloadPackage = () => {
    if (token) {
      const blob = new Blob([token], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oesp_token_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <Package className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Encodage OESP (SDK)</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulaire d'encodage */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Paramètres du message</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destinataire (DID)
                </label>
                <input
                  type="text"
                  value={toDid}
                  onChange={(e) => setToDid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Données (JSON ou Texte)
                </label>
                <textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="Entrez vos données ici..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <button
                onClick={encodePackage}
                className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Package className="w-5 h-5 mr-2" />
                Générer Token OESP
              </button>
            </div>

            {/* Résultat de l'encodage */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Résultat (Token OESP1)</h2>
              
              {token ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Token Format</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Le token commence par <span className="font-mono font-bold">OESP1.</span> suivi du payload encodé en Base64Url.
                    </p>
                    <div className="bg-black text-green-400 p-3 rounded font-mono text-xs break-all max-h-64 overflow-y-auto">
                      {token}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copié!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copier
                        </>
                      )}
                    </button>
                    <button
                      onClick={downloadPackage}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun token généré</p>
                  <p className="text-sm text-gray-400 mt-2">Configurez le message et cliquez sur "Générer"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
