import { BleGattLink } from "./BleGattLink";

export class MockBleGattLink implements BleGattLink {
  private notifyCb?: (data: Uint8Array) => void;
  public lastWrittenRx?: Uint8Array;

  async connect(deviceId: string): Promise<void> {
    console.log(`Mock: Connected to ${deviceId}`);
  }

  async disconnect(): Promise<void> {
    console.log("Mock: Disconnected");
  }

  async writeRx(frameBytes: Uint8Array): Promise<void> {
    this.lastWrittenRx = frameBytes;
    console.log("Mock: Wrote RX", new TextDecoder().decode(frameBytes));
  }

  onTxNotify(cb: (frameBytes: Uint8Array) => void): void {
    this.notifyCb = cb;
  }

  async startNotify(): Promise<void> {
    console.log("Mock: Started Notify");
  }

  async getMtuHint(): Promise<number> {
    return 185;
  }

  // Helper for tests
  simulateTxNotify(data: Uint8Array) {
    if (this.notifyCb) {
      this.notifyCb(data);
    }
  }
}
