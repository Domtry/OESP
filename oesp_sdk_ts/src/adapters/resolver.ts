export interface Resolver {
  resolveDid(did: string): Promise<Uint8Array>
}

