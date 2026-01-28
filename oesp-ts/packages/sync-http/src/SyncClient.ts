import { base64Encode } from "@oesp/sdk";
import { SyncConfig, getSyncConfig } from "./env";

export interface SyncSummary {
  success: boolean;
  uploadedCount: number;
  totalBytes: number;
  sessionId?: string;
  error?: string;
}

export interface SyncOpts extends Partial<SyncConfig> {
  sha256: (data: Uint8Array) => Uint8Array | Promise<Uint8Array>;
}

export class OESPSyncClient {
  private config: SyncConfig;
  private sha256: (data: Uint8Array) => Uint8Array | Promise<Uint8Array>;

  constructor(opts: SyncOpts) {
    this.config = getSyncConfig(opts);
    this.sha256 = opts.sha256;
  }

  setBaseUrl(url: string) {
    this.config.baseUrl = url;
  }

  /**
   * Synchronise une liste de tokens vers le serveur
   */
  async syncTokens(
    tokens: string[],
    deviceDid: string,
    opts: { devicePubB64?: string; clientMeta?: any; allowExpired?: boolean } = {}
  ): Promise<SyncSummary> {
    try {
      // 1. Démarrer la session
      const startRes = await fetch(`${this.config.baseUrl}/sync/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          did: deviceDid,
          pub: opts.devicePubB64,
          meta: opts.clientMeta
        })
      });

      if (!startRes.ok) throw new Error(`Failed to start sync: ${startRes.statusText}`);
      const { session_id } = await startRes.json();

      // 2. Chunker et Upload
      let uploadedCount = 0;
      let totalBytes = 0;
      const jsonlData = tokens.map(t => JSON.stringify({ token: t })).join("\n");
      const dataBytes = new TextEncoder().encode(jsonlData);
      
      const chunks = this.chunkBytes(dataBytes, this.config.maxChunkBytes);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkRes = await fetch(`${this.config.baseUrl}/sync/upload`, {
          method: "POST",
          headers: {
            "X-Session-ID": session_id,
            "X-Chunk-Index": i.toString(),
            "Content-Type": "application/octet-stream"
          },
          body: chunks[i] as unknown as BodyInit
        });
        
        if (!chunkRes.ok) throw new Error(`Failed to upload chunk ${i}: ${chunkRes.statusText}`);
        totalBytes += chunks[i].length;
      }

      // 3. Commit
      const finalHashBytes = await this.sha256(dataBytes);
      const finalHash = base64Encode(finalHashBytes);
      const commitRes = await fetch(`${this.config.baseUrl}/sync/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id,
          final_hash: finalHash,
          allow_expired: opts.allowExpired ?? true
        })
      });

      if (!commitRes.ok) throw new Error(`Failed to commit: ${commitRes.statusText}`);

      return {
        success: true,
        uploadedCount: tokens.length,
        totalBytes,
        sessionId: session_id
      };
    } catch (e: any) {
      return {
        success: false,
        uploadedCount: 0,
        totalBytes: 0,
        error: e.message
      };
    }
  }

  private chunkBytes(data: Uint8Array, maxSize: number): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < data.length; i += maxSize) {
      chunks.push(data.slice(i, i + maxSize));
    }
    return chunks;
  }
}
