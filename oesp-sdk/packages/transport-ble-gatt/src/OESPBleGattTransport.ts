import { BleGattLink } from "./link/BleGattLink";
import { base64Encode, base64Decode } from "@oesp/core";
import { 
  OESPBleFrame, 
  StartFrame, 
  ChunkFrame, 
  AckFrame, 
  NackFrame
} from "./frames";

export interface TransportOpts {
  maxChunkBytes?: number;
  timeoutMs?: number;
  retries?: number;
  sha256: (data: Uint8Array) => Uint8Array | Promise<Uint8Array>;
}

export class OESPBleGattTransport {
  private maxChunkBytes: number;
  private timeoutMs: number;
  private retries: number;
  private sha256: (data: Uint8Array) => Uint8Array | Promise<Uint8Array>;

  constructor(opts: TransportOpts) {
    this.maxChunkBytes = opts.maxChunkBytes || 1024;
    this.timeoutMs = opts.timeoutMs || 3000;
    this.retries = opts.retries || 3;
    this.sha256 = opts.sha256;
  }

  /**
   * Envoie un token OESP via BLE GATT (Central -> Peripheral)
   */
  async sendToken(token: string, link: BleGattLink, sid: string = Math.random().toString(36).substring(7)): Promise<void> {
    const tokenBytes = new TextEncoder().encode(token);
    const shaBytes = await this.sha256(tokenBytes);
    const sha256 = base64Encode(shaBytes);
    const totalLen = tokenBytes.length;
    
    const chunks = this.fragment(tokenBytes, this.maxChunkBytes);
    const parts = chunks.length;

    // 1. Send START
    const startFrame: StartFrame = {
      t: "START",
      sid,
      mid: Math.random().toString(36).substring(7),
      totalLen,
      parts,
      sha256
    };
    await this.sendFrameWithAck(link, startFrame, -1);

    // 2. Send CHUNKS (Stop-and-Wait)
    for (let i = 0; i < chunks.length; i++) {
      const chunkFrame: ChunkFrame = {
        t: "CHUNK",
        sid,
        seq: i,
        data: base64Encode(chunks[i])
      };
      await this.sendFrameWithAck(link, chunkFrame, i);
    }

    // 3. Send END
    await this.sendFrameWithAck(link, { t: "END", sid }, -1);
  }

  /**
   * Boucle de réception pour le Peripheral (GATT Server)
   */
  receiveLoop(link: BleGattLink, onToken: (token: string) => void) {
    let currentSession: {
      sid: string;
      expectedSha: string;
      expectedParts: number;
      chunks: Uint8Array[];
      receivedParts: Set<number>;
    } | null = null;

    link.onTxNotify(async (data) => {
      try {
        const frame = JSON.parse(new TextDecoder().decode(data)) as OESPBleFrame;
        
        switch (frame.t) {
          case "START":
            currentSession = {
              sid: frame.sid,
              expectedSha: frame.sha256,
              expectedParts: frame.parts,
              chunks: new Array(frame.parts),
              receivedParts: new Set()
            };
            await this.sendAck(link, frame.sid, -1);
            break;

          case "CHUNK":
            if (currentSession && currentSession.sid === frame.sid) {
              const chunkData = base64Decode(frame.data);
              currentSession.chunks[frame.seq] = chunkData;
              currentSession.receivedParts.add(frame.seq);
              await this.sendAck(link, frame.sid, frame.seq);
            }
            break;

          case "END":
            if (currentSession && currentSession.sid === frame.sid) {
              if (currentSession.receivedParts.size === currentSession.expectedParts) {
                const fullTokenBytes = this.reassemble(currentSession.chunks);
                const actualShaBytes = await this.sha256(fullTokenBytes);
                const actualSha = base64Encode(actualShaBytes);
                
                if (actualSha === currentSession.expectedSha) {
                  const token = new TextDecoder().decode(fullTokenBytes);
                  await this.sendAck(link, frame.sid, -1);
                  onToken(token);
                } else {
                  await this.sendNack(link, frame.sid, -1, "BAD_HASH");
                }
              } else {
                await this.sendNack(link, frame.sid, -1, "BAD_SEQ");
              }
              currentSession = null;
            }
            break;
        }
      } catch (e) {
        console.error("Failed to parse frame", e);
      }
    });
  }

  private fragment(data: Uint8Array, maxChunk: number): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < data.length; i += maxChunk) {
      chunks.push(data.slice(i, i + maxChunk));
    }
    return chunks;
  }

  private reassemble(chunks: Uint8Array[]): Uint8Array {
    const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      if (chunk) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
    }
    return result;
  }

  private async sendFrameWithAck(link: BleGattLink, frame: OESPBleFrame, expectedAck: number): Promise<void> {
    let attempts = 0;
    const frameBytes = new TextEncoder().encode(JSON.stringify(frame));

    while (attempts < this.retries) {
      await link.writeRx(frameBytes);
      
      try {
        await this.waitForAck(link, frame.sid, expectedAck);
        return;
      } catch (e) {
        attempts++;
        if (attempts >= this.retries) throw new Error(`Failed to send frame ${frame.t} after ${this.retries} attempts`);
      }
    }
  }

  private waitForAck(link: BleGattLink, sid: string, expectedAck: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout waiting for ACK"));
      }, this.timeoutMs);
      
      const handler = (data: Uint8Array) => {
        try {
          const frame = JSON.parse(new TextDecoder().decode(data)) as OESPBleFrame;
          if (frame.sid === sid) {
            if (frame.t === "ACK" && frame.ack === expectedAck) {
              cleanup();
              resolve();
            } else if (frame.t === "NACK" && frame.at === expectedAck) {
              cleanup();
              reject(new Error(`Received NACK: ${frame.reason}`));
            }
          }
        } catch (e) {}
      };

      const cleanup = () => {
        clearTimeout(timeout);
        if (link.offTxNotify) {
          link.offTxNotify(handler);
        }
      };

      link.onTxNotify(handler);
    });
  }

  private async sendAck(link: BleGattLink, sid: string, ack: number) {
    const ackFrame: AckFrame = { t: "ACK", sid, ack };
    await link.writeRx(new TextEncoder().encode(JSON.stringify(ackFrame)));
  }

  private async sendNack(link: BleGattLink, sid: string, at: number, reason: NackFrame["reason"]) {
    const nackFrame: NackFrame = { t: "NACK", sid, at, reason };
    await link.writeRx(new TextEncoder().encode(JSON.stringify(nackFrame)));
  }
}
