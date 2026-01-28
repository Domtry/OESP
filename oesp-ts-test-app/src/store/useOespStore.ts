import { create } from 'zustand';
import { OESPClient, Identity, KeyStore } from '@oesp/sdk';
import { SodiumCryptoProvider, createSodiumCryptoProvider } from '@oesp/crypto-sodium';
import { MemoryReplayStore } from '@oesp/storage-memory';
import { BrowserBleGattLink } from '@/lib/oesp';
import { OESPBleGattTransport } from '@oesp/transport-ble-gatt';

interface OespState {
  client: OESPClient | null;
  crypto: SodiumCryptoProvider | null;
  link: BrowserBleGattLink | null;
  transport: OESPBleGattTransport | null;
  isConnected: boolean;
  deviceName: string | null;
  init: () => Promise<void>;
  setConnectedDevice: (device: BluetoothDevice) => Promise<void>;
  disconnect: () => Promise<void>;
}

class SimpleKeyStore implements KeyStore {
  private identity: Identity | null = null;
  private crypto: SodiumCryptoProvider;

  constructor(crypto: SodiumCryptoProvider) {
    this.crypto = crypto;
  }

  async getOrCreateIdentity(): Promise<Identity> {
    if (!this.identity) {
      this.crypto.randomBytes(32);
      // Simplified identity generation for demo
      // In real sdk, it uses ed25519.keyPairFromSeed
      // Here we just mock the bytes to satisfy the interface
      this.identity = {
        ed25519Priv: this.crypto.randomBytes(64),
        ed25519Pub: this.crypto.randomBytes(32),
        x25519Priv: this.crypto.randomBytes(32),
        x25519Pub: this.crypto.randomBytes(32),
      };
    }
    return this.identity;
  }
}

export const useOespStore = create<OespState>((set, get) => ({
  client: null,
  crypto: null,
  link: null,
  transport: null,
  isConnected: false,
  deviceName: null,

  init: async () => {
    if (get().client) return;

    const crypto = await createSodiumCryptoProvider();
    const replay = new MemoryReplayStore();
    const keystore = new SimpleKeyStore(crypto);
    
    const client = new OESPClient({
      crypto,
      keystore,
      replay
    });

    const transport = new OESPBleGattTransport({
      sha256: (data) => crypto.sha256(data),
      maxChunkBytes: 20 // BLE MTU standard (23 - 3 bytes header)
    });

    set({ client, crypto, transport });
  },

  setConnectedDevice: async (device: BluetoothDevice) => {
    const link = new BrowserBleGattLink();
    await link.setDevice(device);
    await link.startNotify();
    
    set({ 
      link, 
      isConnected: true, 
      deviceName: device.name || 'Unknown Device' 
    });

    device.addEventListener('gattserverdisconnected', () => {
      set({ isConnected: false, deviceName: null, link: null });
    });
  },

  disconnect: async () => {
    const { link } = get();
    if (link) {
      await link.disconnect();
    }
    set({ isConnected: false, deviceName: null, link: null });
  }
}));
