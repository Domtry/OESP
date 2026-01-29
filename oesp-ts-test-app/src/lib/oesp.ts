import { BleGattLink, OESP_BLE_SERVICE_UUID, OESP_BLE_CHAR_RX_UUID, OESP_BLE_CHAR_TX_UUID } from "@oesp/transport-ble-gatt";

export class BrowserBleGattLink implements BleGattLink {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private rxChar: BluetoothRemoteGATTCharacteristic | null = null;
  private txChar: BluetoothRemoteGATTCharacteristic | null = null;
  private txCallbacks: Set<(frameBytes: Uint8Array) => void> = new Set();

  async connect(deviceId: string): Promise<void> {
    console.warn(`[BLE] connect(${deviceId}) called but not implemented for BrowserBleGattLink. Use setDevice instead.`);
    throw new Error("Use setDevice instead of connect(id) for BrowserBleGattLink");
  }

  async setDevice(device: BluetoothDevice): Promise<void> {
    console.log(`[BLE] Connecting to device: ${device.name} (${device.id})`);
    this.device = device;
    
    if (!device.gatt) {
      console.warn(`[BLE] Device ${device.name} does not support GATT.`);
      throw new Error("GATT server not available on device");
    }

    try {
      console.log(`[BLE] Attempting to connect to GATT server of ${device.name}...`);
      this.server = await device.gatt.connect();
      console.log("[BLE] GATT connected");
    } catch (e: unknown) {
      console.error(`[BLE] Connection failed:`, e);
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("Unsupported device")) {
        throw new Error("Appareil non supporté par le navigateur (ou bloqué par sécurité). Vérifiez qu'il n'est pas déjà appairé au système.");
      }
      throw new Error(`Erreur de connexion GATT: ${message}`);
    }

    try {
      console.log(`[BLE] Getting primary service ${OESP_BLE_SERVICE_UUID}...`);
      this.service = await this.server.getPrimaryService(OESP_BLE_SERVICE_UUID);
      console.log(`[BLE] Service found: ${OESP_BLE_SERVICE_UUID}`);
    } catch (e) {
      console.error(`[BLE] Service NOT found: ${OESP_BLE_SERVICE_UUID}`, e);
      // Try to list available services if possible (debugging)
      try {
        const services = await this.server.getPrimaryServices();
        console.log("[BLE] Available services:", services.map(s => s.uuid));
      } catch (err) {
        console.warn("[BLE] Could not list services", err);
      }
      throw new Error(`Service OESP non trouvé sur l'appareil. UUID attendu: ${OESP_BLE_SERVICE_UUID}`);
    }

    try {
      this.rxChar = await this.service.getCharacteristic(OESP_BLE_CHAR_RX_UUID);
      console.log(`[BLE] RX Characteristic found: ${OESP_BLE_CHAR_RX_UUID}`);
    } catch (e) {
      console.error(`[BLE] RX Characteristic NOT found: ${OESP_BLE_CHAR_RX_UUID}`, e);
      throw new Error("Caractéristique RX non trouvée");
    }

    try {
      this.txChar = await this.service.getCharacteristic(OESP_BLE_CHAR_TX_UUID);
      console.log(`[BLE] TX Characteristic found: ${OESP_BLE_CHAR_TX_UUID}`);
    } catch (e) {
      console.error(`[BLE] TX Characteristic NOT found: ${OESP_BLE_CHAR_TX_UUID}`, e);
      throw new Error("Caractéristique TX non trouvée");
    }
  }

  async startNotify(): Promise<void> {
    if (!this.txChar) throw new Error("TX characteristic not found");
    
    console.log("[BLE] Starting notifications on TX...");
    await this.txChar.startNotifications();
    
    this.txChar.addEventListener('characteristicvaluechanged', (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      const value = target.value;
      if (value) {
        const bytes = new Uint8Array(value.buffer);
        // console.debug(`[BLE] Notification received: ${bytes.length} bytes`);
        this.txCallbacks.forEach(cb => cb(bytes));
      }
    });
    console.log("[BLE] Notifications started");
  }

  async writeRx(frameBytes: Uint8Array): Promise<void> {
    if (!this.rxChar) throw new Error("RX characteristic not found");
    
    // console.debug(`[BLE] Writing to RX: ${frameBytes.length} bytes`);
    try {
      await this.rxChar.writeValueWithoutResponse(frameBytes as unknown as BufferSource);
    } catch (e) {
      console.error("[BLE] Write failed", e);
      // Fallback to writeValue if writeValueWithoutResponse fails
      await this.rxChar.writeValue(frameBytes as unknown as BufferSource);
    }
  }

  onTxNotify(cb: (frameBytes: Uint8Array) => void): void {
    this.txCallbacks.add(cb);
  }

  offTxNotify(cb: (frameBytes: Uint8Array) => void): void {
    this.txCallbacks.delete(cb);
  }

  async disconnect(): Promise<void> {
    console.log("[BLE] Disconnecting...");
    if (this.server) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
    this.service = null;
    this.rxChar = null;
    this.txChar = null;
    this.txCallbacks.clear();
    console.log("[BLE] Disconnected");
  }

  async getMtuHint(): Promise<number | undefined> {
    // Standard BLE MTU is 23, leaving 20 bytes for payload.
    // Some devices support higher, but 20 is the safest minimum.
    return 20;
  }
}
