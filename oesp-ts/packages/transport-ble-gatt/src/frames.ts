export const OESP_BLE_SERVICE_UUID = "e95f1234-5678-4321-8765-abcdef012345";
export const OESP_BLE_CHAR_RX_UUID = "e95f1235-5678-4321-8765-abcdef012345"; // Central -> Peripheral (Write)
export const OESP_BLE_CHAR_TX_UUID = "e95f1236-5678-4321-8765-abcdef012345"; // Peripheral -> Central (Notify)
export const OESP_BLE_CHAR_META_UUID = "e95f1237-5678-4321-8765-abcdef012345"; // Meta (Read)

export type FrameType = "HELLO" | "START" | "CHUNK" | "END" | "ACK" | "NACK";

export interface BaseFrame {
  t: FrameType;
  sid: string; // Session ID
}

export interface HelloFrame extends BaseFrame {
  t: "HELLO";
  ver: number;
  did: string;
  caps: {
    maxChunk: number;
    mtuHint?: number;
  };
}

export interface StartFrame extends BaseFrame {
  t: "START";
  mid: string; // Message ID
  totalLen: number;
  parts: number;
  sha256: string; // Base64 hash of the full token bytes
}

export interface ChunkFrame extends BaseFrame {
  t: "CHUNK";
  seq: number;
  data: string; // Base64 data
}

export interface EndFrame extends BaseFrame {
  t: "END";
}

export interface AckFrame extends BaseFrame {
  t: "ACK";
  ack: number; // sequence number or -1 for start/end
}

export interface NackFrame extends BaseFrame {
  t: "NACK";
  at: number;
  reason: "BAD_HASH" | "TIMEOUT" | "BAD_SEQ" | "UNKNOWN";
}

export type OESPBleFrame = HelloFrame | StartFrame | ChunkFrame | EndFrame | AckFrame | NackFrame;
