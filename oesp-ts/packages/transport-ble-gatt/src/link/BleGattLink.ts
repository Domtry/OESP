export interface BleGattLink {
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  writeRx(frameBytes: Uint8Array): Promise<void>;
  onTxNotify(cb: (frameBytes: Uint8Array) => void): void;
  offTxNotify?(cb: (frameBytes: Uint8Array) => void): void;
  startNotify(): Promise<void>;
  getMtuHint?(): Promise<number | undefined>;
}
