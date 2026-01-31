export interface SyncConfig {
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
  maxChunkBytes: number;
}

export function getSyncConfig(overrides: Partial<SyncConfig> = {}): SyncConfig {
  const defaultBaseUrl = "http://oesp-sync-server:8000";
  
  let envBaseUrl: string | undefined;
  
  // Node.js
  const nodeEnv = (globalThis as any)?.process?.env;
  if (nodeEnv?.OESP_SYNC_BASE_URL) {
    envBaseUrl = nodeEnv.OESP_SYNC_BASE_URL;
  }

  
  // Vite / Web
  // @ts-ignore
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_OESP_SYNC_BASE_URL) {
    // @ts-ignore
    envBaseUrl = import.meta.env.VITE_OESP_SYNC_BASE_URL;
  }

  return {
    baseUrl: overrides.baseUrl || envBaseUrl || defaultBaseUrl,
    apiKey: overrides.apiKey,
    timeoutMs: overrides.timeoutMs || 30000,
    maxChunkBytes: overrides.maxChunkBytes || 500000, // 500KB
  };
}
