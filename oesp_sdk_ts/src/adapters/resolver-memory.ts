import type { Resolver } from './resolver'

export class ResolverMemory implements Resolver {
  private map = new Map<string, Uint8Array>()
  add(did: string, x25519Public: Uint8Array) { this.map.set(did, x25519Public) }
  async resolveDid(did: string): Promise<Uint8Array> {
    const v = this.map.get(did)
    if (!v) throw new Error(`DID not found: ${did}`)
    return v
  }
}

