import { useState, useEffect } from 'react';
import { Bluetooth, BluetoothOff, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOespStore } from '@/store/useOespStore';
import { OESP_BLE_SERVICE_UUID } from '@oesp/all';

interface BLEDevice {
  id: string;
  name: string;
  connected: boolean;
  rssi?: number;
  device?: BluetoothDevice;
}

export default function BLEConnection() {
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [scanMode, setScanMode] = useState<'filtered' | 'all'>('filtered');
  
  const { 
    init, 
    setConnectedDevice, 
    disconnect, 
    isConnected, 
    deviceName: connectedName 
  } = useOespStore();

  useEffect(() => {
    init();
  }, [init]);

  const isWebBluetoothSupported = 'bluetooth' in navigator;

  const startScan = async () => {
    if (!isWebBluetoothSupported) {
      setError('Web Bluetooth API non supportée. Utilisez HTTPS ou localhost.');
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      const options: RequestDeviceOptions = scanMode === 'filtered' 
        ? {
            filters: [{ services: [OESP_BLE_SERVICE_UUID] }],
            optionalServices: ['generic_access', 'generic_attribute']
          }
        : {
            acceptAllDevices: true,
            optionalServices: [OESP_BLE_SERVICE_UUID, 'generic_access', 'generic_attribute']
          };

      const device = await navigator.bluetooth.requestDevice(options);

      const newDevice: BLEDevice = {
        id: device.id,
        name: device.name || 'Appareil inconnu',
        connected: false,
        rssi: Math.floor(Math.random() * 100) - 50, // Simulated RSSI
        device: device
      };

      setDevices(prev => {
        const existing = prev.find(d => d.id === device.id);
        if (existing) return prev;
        return [...prev, newDevice];
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'NotFoundError') {
        // User cancelled the picker
      } else {
        setError(`Erreur de scan: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const connectDevice = async (device: BLEDevice) => {
    if (!device.device) return;
    try {
      await setConnectedDevice(device.device);
    } catch (err) {
      setError(`Erreur de connexion: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  const getRssiColor = (rssi?: number) => {
    if (!rssi) return 'text-gray-400';
    if (rssi > -50) return 'text-green-500';
    if (rssi > -70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRssiWidth = (rssi?: number) => {
    if (!rssi) return '0%';
    const strength = Math.min(100, Math.max(0, (rssi + 100) * 2));
    return `${strength}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Connexion BLE</h1>
            <div className="flex items-center space-x-2">
              {isWebBluetoothSupported ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="w-5 h-5 mr-1" />
                  <span className="text-sm">Web Bluetooth supporté</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="w-5 h-5 mr-1" />
                  <span className="text-sm">Web Bluetooth non supporté</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {isConnected && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bluetooth className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-green-900">Connecté à</p>
                    <p className="text-green-700">{connectedName}</p>
                  </div>
                </div>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Déconnecter
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={startScan}
              disabled={isScanning || !isWebBluetoothSupported}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scan en cours...' : 'Scanner les appareils'}
            </button>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setScanMode('filtered')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  scanMode === 'filtered' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Filtre OESP
              </button>
              <button
                onClick={() => setScanMode('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  scanMode === 'all' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tous les appareils
              </button>
            </div>
          </div>

          {devices.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Appareils trouvés</h2>
              <div className="space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center flex-1">
                      {isConnected && connectedName === device.name ? (
                        <Bluetooth className="w-6 h-6 text-green-600 mr-3" />
                      ) : (
                        <BluetoothOff className="w-6 h-6 text-gray-400 mr-3" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{device.name}</p>
                        <p className="text-sm text-gray-500">ID: {device.id}</p>
                        {device.rssi && (
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500 mr-2">RSSI:</span>
                            <div className="flex items-center flex-1 max-w-32">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    device.rssi > -50 ? 'bg-green-500' :
                                    device.rssi > -70 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: getRssiWidth(device.rssi) }}
                                />
                              </div>
                              <span className={`text-xs font-mono ${getRssiColor(device.rssi)}`}>
                                {device.rssi} dBm
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {!(isConnected && connectedName === device.name) && (
                      <button
                        onClick={() => connectDevice(device)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Connecter
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {devices.length === 0 && !isScanning && (
            <div className="text-center py-12">
              <Bluetooth className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun appareil trouvé</p>
              <p className="text-sm text-gray-400 mt-2">Cliquez sur "Scanner les appareils" pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
